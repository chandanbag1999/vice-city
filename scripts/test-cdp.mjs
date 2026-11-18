import { spawn, execSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME_PATH =
  process.env.CHROME_PATH ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "google-chrome");
const PORT = 4173;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runTest(testName, disableGpu = false, cdpPort = 9222) {
  console.log(`\n========================================`);
  console.log(`Starting Test: ${testName} (CDP Port: ${cdpPort})`);
  console.log(`========================================`);

  const userDataDir = path.join(os.tmpdir(), `chrome-cdp-test-${Date.now()}`);
  const chromeArgs = [
    "--headless=new",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--enable-unsafe-webgpu",
    "--use-angle=default",
    "--enable-features=Vulkan,DefaultANGLEVulkan,VulkanFromANGLE",
    "about:blank",
  ];

  const chromeProc = spawn(CHROME_PATH, chromeArgs, { stdio: "ignore" });

  try {
    // Wait for CDP to respond
    let version = null;
    for (let i = 0; i < 30; i++) {
      await delay(250);
      try {
        version = await fetchJson(`http://127.0.0.1:${cdpPort}/json/version`);
        if (version) break;
      } catch (_) {}
    }

    if (!version) {
      throw new Error(`Failed to connect to Chrome CDP endpoint on port ${cdpPort}.`);
    }

    const targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error("No page target found with webSocketDebuggerUrl.");
    }

    const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Runtime.enable");

    const consoleLogs = [];
    client.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
        consoleLogs.push(`[Browser ${msg.params.type}] ${text}`);
      }
    });

    if (disableGpu) {
      await client.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `
          Object.defineProperty(navigator, 'gpu', {
            get: () => undefined,
            configurable: true
          });
          console.info("[TestHarness] navigator.gpu overridden to undefined (simulating non-WebGPU environment).");
        `,
      });
    }

    console.log(`Navigating to http://localhost:${PORT}...`);
    await client.send("Page.navigate", { url: `http://localhost:${PORT}/` });

    // Wait 3.5 seconds for scene rendering and rolling frame metrics
    console.log("Waiting 3500ms for scene initialization and first frames...");
    await delay(3500);

    // 1. Initial State Check (Idle spawn)
    const initialEval = await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const telemStatus = document.getElementById('telemStatus')?.textContent ?? 'N/A';
          const telemFpsCurrent = document.getElementById('telemFpsCurrent')?.textContent ?? 'N/A';
          const telemFpsAvg = document.getElementById('telemFpsAvg')?.textContent ?? 'N/A';
          const telemMeshes = document.getElementById('telemMeshes')?.textContent ?? 'N/A';
          const telemDrawCalls = document.getElementById('telemDrawCalls')?.textContent ?? 'N/A';
          const telemResolution = document.getElementById('telemResolution')?.textContent ?? 'N/A';
          const telemDpr = document.getElementById('telemDpr')?.textContent ?? 'N/A';
          const telemPlayerState = document.getElementById('telemPlayerState')?.textContent ?? 'N/A';
          const telemPlayerSpeed = document.getElementById('telemPlayerSpeed')?.textContent ?? 'N/A';
          const telemPlayerPos = document.getElementById('telemPlayerPos')?.textContent ?? 'N/A';
          const backendBadge = document.querySelector('.badge-webgpu, .badge-webgl2')?.textContent ?? 'N/A';
          const errorCard = document.querySelector('.error-card')?.textContent ?? null;

          return {
            backendBadge,
            status: telemStatus,
            fpsInstant: telemFpsCurrent,
            fpsRolling60: telemFpsAvg,
            activeMeshes: telemMeshes,
            drawCalls: telemDrawCalls,
            playerState: telemPlayerState,
            playerSpeed: telemPlayerSpeed,
            playerPos: telemPlayerPos,
            resolution: telemResolution,
            dpr: telemDpr,
            hasErrorCard: !!errorCard,
            errorCardText: errorCard
          };
        })()
      `,
      returnByValue: true,
    });

    const initialMetrics = initialEval.result.value;
    console.log("\n--- Initial Spawn Telemetry ---");
    console.log(`Backend Badge:    ${initialMetrics.backendBadge}`);
    console.log(`Engine Status:    ${initialMetrics.status}`);
    console.log(`Instant FPS:      ${initialMetrics.fpsInstant}`);
    console.log(`60-Frame Avg FPS: ${initialMetrics.fpsRolling60}`);
    console.log(`Active Meshes:    ${initialMetrics.activeMeshes}`);
    console.log(`Player State:     ${initialMetrics.playerState}`);
    console.log(`Player Speed:     ${initialMetrics.playerSpeed}`);
    console.log(`Player Pos:       ${initialMetrics.playerPos}`);
    console.log(`Error Card:       ${initialMetrics.hasErrorCard ? "YES - " + initialMetrics.errorCardText : "None"}`);

    if (initialMetrics.hasErrorCard) {
      throw new Error(`Fatal Error Card present: ${initialMetrics.errorCardText}`);
    }
    if (initialMetrics.status !== "Running") {
      throw new Error(`Expected status 'Running', got '${initialMetrics.status}'`);
    }
    if (initialMetrics.playerState !== "IDLE") {
      throw new Error(`Expected initial player state 'IDLE', got '${initialMetrics.playerState}'`);
    }

    // 2. Simulate Forward Walk Locomotion (KeyW)
    console.log("\nSimulating Forward Walk Locomotion (KeyW down for 1000ms)...");
    await client.send("Runtime.evaluate", {
      expression: `
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w', bubbles: true }));
      `,
    });
    await delay(1000);

    const walkEval = await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const state = document.getElementById('telemPlayerState')?.textContent ?? 'N/A';
          const speed = document.getElementById('telemPlayerSpeed')?.textContent ?? 'N/A';
          const pos = document.getElementById('telemPlayerPos')?.textContent ?? 'N/A';
          return { state, speed, pos };
        })()
      `,
      returnByValue: true,
    });
    const walkMetrics = walkEval.result.value;
    console.log(`Walk State: ${walkMetrics.state}, Speed: ${walkMetrics.speed}, Pos: ${walkMetrics.pos}`);

    if (walkMetrics.state !== "WALK" && walkMetrics.state !== "RUN" && walkMetrics.state !== "SPRINT") {
      throw new Error(`Expected state WALK/RUN/SPRINT during KeyW, got ${walkMetrics.state}`);
    }

    // 3. Simulate Sprint (ShiftLeft + KeyW)
    console.log("\nSimulating Sprint (ShiftLeft + KeyW for 800ms)...");
    await client.send("Runtime.evaluate", {
      expression: `
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift', bubbles: true }));
      `,
    });
    await delay(800);

    const sprintEval = await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const state = document.getElementById('telemPlayerState')?.textContent ?? 'N/A';
          const speed = document.getElementById('telemPlayerSpeed')?.textContent ?? 'N/A';
          const pos = document.getElementById('telemPlayerPos')?.textContent ?? 'N/A';
          return { state, speed, pos };
        })()
      `,
      returnByValue: true,
    });
    const sprintMetrics = sprintEval.result.value;
    console.log(`Sprint State: ${sprintMetrics.state}, Speed: ${sprintMetrics.speed}, Pos: ${sprintMetrics.pos}`);
    if (sprintMetrics.state !== "SPRINT") {
      throw new Error(`Expected state SPRINT, got ${sprintMetrics.state}`);
    }

    // 4. Simulate Jump (Space)
    console.log("\nSimulating Jump (Space key)...");
    await client.send("Runtime.evaluate", {
      expression: `
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      `,
    });
    await delay(200);

    const jumpEval = await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const state = document.getElementById('telemPlayerState')?.textContent ?? 'N/A';
          const speed = document.getElementById('telemPlayerSpeed')?.textContent ?? 'N/A';
          const pos = document.getElementById('telemPlayerPos')?.textContent ?? 'N/A';
          return { state, speed, pos };
        })()
      `,
      returnByValue: true,
    });
    console.log(`Jump State: ${jumpEval.result.value.state}, Pos: ${jumpEval.result.value.pos}`);

    // Release keys
    await client.send("Runtime.evaluate", {
      expression: `
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w', bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', key: 'Shift', bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      `,
    });
    await delay(600);

    // 5. Simulate Camera Mouse Look & Touch Controls
    console.log("\nSimulating Camera Orbit deltas & Touch Joystick interaction...");
    await client.send("Runtime.evaluate", {
      expression: `
        // Dispatch mouse movement
        const canvas = document.getElementById('renderCanvas');
        if (canvas) {
          canvas.dispatchEvent(new MouseEvent('mousemove', { movementX: 45, movementY: -10, bubbles: true }));
        }

        // Test touch joystick dispatch
        const leftZone = document.querySelector('.touch-zone-left');
        if (leftZone) {
          leftZone.dispatchEvent(new PointerEvent('pointerdown', {
            pointerId: 101,
            clientX: 60,
            clientY: 600,
            bubbles: true
          }));
          window.dispatchEvent(new PointerEvent('pointermove', {
            pointerId: 101,
            clientX: 60,
            clientY: 540,
            bubbles: true
          }));
        }
      `,
    });
    await delay(500);

    // Release touch pointer
    await client.send("Runtime.evaluate", {
      expression: `
        window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 101, bubbles: true }));
      `,
    });
    await delay(400);

    // Capture screenshot for visual inspection
    const screenshotDir = "screenshots";
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const screenshotTag = disableGpu ? "player-webgl2" : "player-webgpu";
    const screenshotData = await client.send("Page.captureScreenshot", { format: "png" });
    if (screenshotData && screenshotData.data) {
      const screenshotPath = `${screenshotDir}/screenshot-${screenshotTag}.png`;
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData.data, "base64"));
      console.log(`Screenshot captured: ${screenshotPath}`);
    }

    console.log("\n--- Browser Console Logs ---");
    consoleLogs.forEach((l) => console.log(l));

    client.close();

    const fpsInstantNum = parseInt(initialMetrics.fpsInstant, 10);
    const fpsAvgNum = parseInt(initialMetrics.fpsRolling60, 10);
    if (fpsInstantNum < 30) {
      throw new Error(`Instant FPS too low: ${fpsInstantNum}`);
    }
    if (fpsAvgNum < 30) {
      throw new Error(`60-Frame Avg FPS too low: ${fpsAvgNum}`);
    }

    if (disableGpu) {
      if (initialMetrics.backendBadge !== "WebGL 2") {
        throw new Error(`Expected WebGL 2 backend badge, got '${initialMetrics.backendBadge}'`);
      }
    } else {
      if (initialMetrics.backendBadge !== "WebGPU") {
        throw new Error(`Expected WebGPU backend badge, got '${initialMetrics.backendBadge}'`);
      }
    }

    console.log(`\n>>> TEST PASSED: ${testName} <<<\n`);
    return { success: true, metrics: initialMetrics };
  } finally {
    try {
      execSync(`taskkill /F /T /PID ${chromeProc.pid}`, { stdio: "ignore" });
    } catch (_) {}
  }
}

async function main() {
  console.log("Starting Vite Preview server on port " + PORT + "...");
  const previewProc = spawn("cmd.exe", ["/c", `npx vite preview --port ${PORT}`], {
    stdio: "inherit",
    detached: false,
  });

  // Wait for preview server to be responsive
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    await delay(200);
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${PORT}/`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        });
        req.on("error", reject);
      });
      serverReady = true;
      break;
    } catch (_) {}
  }

  if (!serverReady) {
    try {
      execSync(`taskkill /F /T /PID ${previewProc.pid}`, { stdio: "ignore" });
    } catch (_) {}
    throw new Error("Vite preview server failed to start.");
  }

  try {
    const webgpuResult = await runTest("WebGPU Primary Pipeline Test", false, 9222);
    await delay(1000);
    const webgl2Result = await runTest("WebGL 2 Graceful Fallback Pipeline Test", true, 9223);

    console.log("\n========================================");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log("WebGPU Run:", JSON.stringify(webgpuResult.metrics, null, 2));
    console.log("WebGL 2 Run:", JSON.stringify(webgl2Result.metrics, null, 2));
  } finally {
    try {
      execSync(`taskkill /F /T /PID ${previewProc.pid}`, { stdio: "ignore" });
    } catch (_) {}
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

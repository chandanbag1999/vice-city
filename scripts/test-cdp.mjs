import { spawn, execSync } from "node:child_process";
import http from "node:http";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 4173;
const CDP_PORT = 9222;

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

  const userDataDir = `C:\\Users\\cbag6\\AppData\\Local\\Temp\\chrome-cdp-test-${Date.now()}`;
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

    // Wait 4 seconds for render loop and 60-frame rolling average accumulation
    console.log("Waiting 4000ms for scene rendering and rolling frame metrics...");
    await delay(4000);

    const evalResult = await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const telemStatus = document.getElementById('telemStatus')?.textContent ?? 'N/A';
          const telemFpsCurrent = document.getElementById('telemFpsCurrent')?.textContent ?? 'N/A';
          const telemFpsAvg = document.getElementById('telemFpsAvg')?.textContent ?? 'N/A';
          const telemMeshes = document.getElementById('telemMeshes')?.textContent ?? 'N/A';
          const telemDrawCalls = document.getElementById('telemDrawCalls')?.textContent ?? 'N/A';
          const telemResolution = document.getElementById('telemResolution')?.textContent ?? 'N/A';
          const telemDpr = document.getElementById('telemDpr')?.textContent ?? 'N/A';
          const backendBadge = document.querySelector('.badge-webgpu, .badge-webgl2')?.textContent ?? 'N/A';
          const errorCard = document.querySelector('.error-card')?.textContent ?? null;

          return {
            backendBadge,
            status: telemStatus,
            fpsInstant: telemFpsCurrent,
            fpsRolling60: telemFpsAvg,
            activeMeshes: telemMeshes,
            drawCalls: telemDrawCalls,
            resolution: telemResolution,
            dpr: telemDpr,
            hasErrorCard: !!errorCard,
            errorCardText: errorCard
          };
        })()
      `,
      returnByValue: true,
    });

    const metrics = evalResult.result.value;
    console.log("\n--- Telemetry Metrics Harvested ---");
    console.log(`Backend Badge:    ${metrics.backendBadge}`);
    console.log(`Engine Status:    ${metrics.status}`);
    console.log(`Instant FPS:      ${metrics.fpsInstant}`);
    console.log(`60-Frame Avg FPS: ${metrics.fpsRolling60}`);
    console.log(`Active Meshes:    ${metrics.activeMeshes}`);
    console.log(`Draw Calls:       ${metrics.drawCalls}`);
    console.log(`Resolution:       ${metrics.resolution}`);
    console.log(`DPR:              ${metrics.dpr}`);
    console.log(`Error Card:       ${metrics.hasErrorCard ? "YES - " + metrics.errorCardText : "None"}`);

    console.log("\n--- Browser Console Logs ---");
    consoleLogs.forEach((l) => console.log(l));

    client.close();

    // Validations
    if (metrics.hasErrorCard) {
      throw new Error(`Fatal Error Card present: ${metrics.errorCardText}`);
    }
    if (metrics.status !== "Running") {
      throw new Error(`Expected status 'Running', got '${metrics.status}'`);
    }
    const fpsInstantNum = parseInt(metrics.fpsInstant, 10);
    const fpsAvgNum = parseInt(metrics.fpsRolling60, 10);
    if (fpsInstantNum < 30) {
      throw new Error(`Instant FPS too low: ${fpsInstantNum}`);
    }
    if (fpsAvgNum < 30) {
      throw new Error(`60-Frame Avg FPS too low: ${fpsAvgNum}`);
    }
    if (metrics.activeMeshes !== "5") {
      throw new Error(`Expected 5 active meshes, got '${metrics.activeMeshes}'`);
    }

    if (disableGpu) {
      if (metrics.backendBadge !== "WebGL 2") {
        throw new Error(`Expected WebGL 2 backend badge, got '${metrics.backendBadge}'`);
      }
    } else {
      if (metrics.backendBadge !== "WebGPU") {
        throw new Error(`Expected WebGPU backend badge, got '${metrics.backendBadge}'`);
      }
    }

    console.log(`\n>>> TEST PASSED: ${testName} <<<\n`);
    return { success: true, metrics };
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
  console.error("FATAL TEST SUITE FAILURE:", err);
  process.exit(1);
});

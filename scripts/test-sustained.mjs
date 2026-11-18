import { spawn, execSync } from "node:child_process";
import http from "node:http";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 4173;
const CDP_PORT = 9225;

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

async function main() {
  console.log("==================================================");
  console.log("Starting 60-Second Sustained Environment Stress Test");
  console.log("==================================================");

  const previewProc = spawn("cmd.exe", ["/c", `npx vite preview --port ${PORT}`], {
    stdio: "ignore",
  });

  // Wait for preview server
  await delay(1500);

  const userDataDir = `C:\\Users\\cbag6\\AppData\\Local\\Temp\\chrome-cdp-sustained-${Date.now()}`;
  const chromeArgs = [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
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
    let version = null;
    for (let i = 0; i < 30; i++) {
      await delay(250);
      try {
        version = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (version) break;
      } catch (_) {}
    }

    if (!version) throw new Error("Could not connect to Chrome CDP.");

    const targets = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Runtime.enable");

    console.log(`Navigating to http://localhost:${PORT}/...`);
    await client.send("Page.navigate", { url: `http://localhost:${PORT}/` });

    // Initial settle
    await delay(3000);

    console.log("\nStarting 60s sampling (samples every 5 seconds):");
    console.log("Time (s) | Instant FPS | 60-Frame Avg | Active Meshes | JS Heap (MB) | Status");
    console.log("-------------------------------------------------------------------------");

    const samples = [];
    const durationSec = 60;
    const intervalSec = 5;

    for (let elapsed = 5; elapsed <= durationSec; elapsed += intervalSec) {
      await delay(intervalSec * 1000);

      const evalRes = await client.send("Runtime.evaluate", {
        expression: `
          (() => {
            const telemStatus = document.getElementById('telemStatus')?.textContent ?? 'N/A';
            const telemFpsCurrent = document.getElementById('telemFpsCurrent')?.textContent ?? 'N/A';
            const telemFpsAvg = document.getElementById('telemFpsAvg')?.textContent ?? 'N/A';
            const telemMeshes = document.getElementById('telemMeshes')?.textContent ?? 'N/A';
            const memoryMb = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) : 'N/A';
            return {
              status: telemStatus,
              fpsInstant: telemFpsCurrent,
              fpsAvg: telemFpsAvg,
              meshes: telemMeshes,
              heapMb: memoryMb
            };
          })()
        `,
        returnByValue: true,
      });

      const s = evalRes.result.value;
      samples.push({ elapsed, ...s });
      console.log(
        `${String(elapsed).padStart(8)} | ${String(s.fpsInstant).padStart(11)} | ${String(s.fpsAvg).padStart(12)} | ${String(s.meshes).padStart(13)} | ${String(s.heapMb).padStart(12)} | ${s.status}`
      );
    }

    client.close();
    console.log("-------------------------------------------------------------------------");
    console.log("Sustained test completed successfully!");
  } finally {
    try {
      execSync(`taskkill /F /T /PID ${chromeProc.pid}`, { stdio: "ignore" });
    } catch (_) {}
    try {
      execSync(`taskkill /F /T /PID ${previewProc.pid}`, { stdio: "ignore" });
    } catch (_) {}
  }
}

main().catch((err) => {
  console.error("Sustained test failed:", err);
  process.exit(1);
});

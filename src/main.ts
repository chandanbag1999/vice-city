import { EngineFactory } from "./core/EngineFactory";
import { createTestScene } from "./scene/createTestScene";
import { Telemetry } from "./ui/Telemetry";

async function bootstrap(): Promise<void> {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
  const telemetryContainer = document.getElementById("telemetryOverlay") as HTMLElement | null;

  if (!canvas) {
    console.error("[Bootstrap] Canvas element '#renderCanvas' not found in DOM.");
    return;
  }

  try {
    console.info("[Bootstrap] Initializing Vice-City Rendering Engine...");

    // 1. Initialize rendering engine (WebGPU with WebGL 2 fallback)
    const { engine, backend } = await EngineFactory.create(canvas, {
      antialias: true,
      powerPreference: "high-performance",
    });

    console.info(`[Bootstrap] Engine initialized with backend: ${backend}`);

    // 2. Build 3D test scene
    const { scene } = createTestScene(engine, canvas);

    // 3. Initialize lightweight telemetry overlay
    let telemetry: Telemetry | null = null;
    if (telemetryContainer) {
      telemetry = new Telemetry(telemetryContainer, engine, scene, backend, canvas);
    }

    // 4. Register context loss & restoration lifecycle observers
    engine.onContextLostObservable.add(() => {
      console.warn("[Bootstrap] Graphics context lost.");
      telemetry?.setStatus("Context Lost");
    });

    engine.onContextRestoredObservable.add(() => {
      console.info("[Bootstrap] Graphics context restored.");
      telemetry?.setStatus("Running");
    });

    // 5. Start Babylon render loop (prevent duplicate render loops)
    engine.stopRenderLoop();
    engine.runRenderLoop(() => {
      scene.render();
    });

    // 6. Responsive window resize handling with DPR awareness
    const handleResize = (): void => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    // 7. Resource lifecycle cleanup
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("resize", handleResize);
      engine.stopRenderLoop();
      telemetry?.dispose();
      scene.dispose();
      engine.dispose();
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Bootstrap] Fatal initialization failure:", error);

    const appContainer = document.getElementById("app");
    if (appContainer) {
      const errorCard = document.createElement("div");
      errorCard.className = "error-card";
      errorCard.innerHTML = `
        <div class="error-title">Graphics Initialization Failed</div>
        <div class="error-message">
          ${errorMsg}
          <br /><br />
          Please verify that hardware acceleration is enabled in your browser settings and your graphics drivers are up to date.
        </div>
      `;
      appContainer.appendChild(errorCard);
    }
  }
}

// Start application bootstrap
void bootstrap();

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { type Observer } from "@babylonjs/core/Misc/observable";
import { EngineFactory } from "./core/EngineFactory";
import { createCityScene } from "./scene/createCityScene";
import { EnvironmentManager } from "./environment/EnvironmentManager";
import { PlayerController } from "./player/PlayerController";
import { ThirdPersonCamera } from "./camera/ThirdPersonCamera";
import { InputService } from "./input/InputService";
import { Telemetry } from "./ui/Telemetry";

/**
 * Safely constructs a DOM error card using textContent to prevent XSS / HTML injection.
 */
function displayFatalError(appContainer: HTMLElement, errorMsg: string): void {
  const existingCard = appContainer.querySelector(".error-card");
  if (existingCard) {
    existingCard.remove();
  }

  const errorCard = document.createElement("div");
  errorCard.className = "error-card";
  errorCard.setAttribute("role", "alert");
  errorCard.setAttribute("aria-live", "assertive");

  const errorTitle = document.createElement("div");
  errorTitle.className = "error-title";
  errorTitle.textContent = "Graphics Initialization Failed";

  const errorMessage = document.createElement("div");
  errorMessage.className = "error-message";

  const techDetail = document.createElement("p");
  techDetail.textContent = errorMsg;

  const guidance = document.createElement("p");
  guidance.style.marginTop = "12px";
  guidance.textContent =
    "Please verify that hardware acceleration is enabled in your browser settings and your graphics drivers are up to date.";

  errorMessage.appendChild(techDetail);
  errorMessage.appendChild(guidance);
  errorCard.appendChild(errorTitle);
  errorCard.appendChild(errorMessage);
  appContainer.appendChild(errorCard);
}

async function bootstrap(): Promise<void> {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
  const telemetryContainer = document.getElementById("telemetryOverlay") as HTMLElement | null;
  const appContainer = document.getElementById("app");

  if (!canvas || !appContainer) {
    console.error("[Bootstrap] Canvas '#renderCanvas' or container '#app' not found in DOM.");
    return;
  }

  // Lifecycle state tracking for clean, idempotent disposal on failure or teardown
  let engine: AbstractEngine | null = null;
  let scene: Scene | null = null;
  let environment: EnvironmentManager | null = null;
  let player: PlayerController | null = null;
  let camera: ThirdPersonCamera | null = null;
  let input: InputService | null = null;
  let telemetry: Telemetry | null = null;
  let toastEl: HTMLElement | null = null;
  let handleResize: (() => void) | null = null;
  let contextLostObserver: Observer<AbstractEngine> | null = null;
  let contextRestoredObserver: Observer<AbstractEngine> | null = null;
  let isCleanedUp = false;

  const cleanup = (): void => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    if (toastEl) {
      toastEl.remove();
      toastEl = null;
    }

    if (handleResize) {
      window.removeEventListener("resize", handleResize);
      handleResize = null;
    }

    if (engine) {
      if (contextLostObserver) {
        engine.onContextLostObservable.remove(contextLostObserver);
        contextLostObserver = null;
      }
      if (contextRestoredObserver) {
        engine.onContextRestoredObservable.remove(contextRestoredObserver);
        contextRestoredObserver = null;
      }
      try {
        engine.stopRenderLoop();
      } catch (_) {}
    }

    if (telemetry) {
      try {
        telemetry.dispose();
      } catch (_) {}
      telemetry = null;
    }

    if (camera) {
      try {
        camera.dispose();
      } catch (_) {}
      camera = null;
    }

    if (player) {
      try {
        player.dispose();
      } catch (_) {}
      player = null;
    }

    if (input) {
      try {
        input.dispose();
      } catch (_) {}
      input = null;
    }

    if (environment) {
      try {
        environment.dispose();
      } catch (_) {}
      environment = null;
    }

    if (scene) {
      try {
        scene.dispose();
      } catch (_) {}
      scene = null;
    }

    if (engine) {
      try {
        engine.dispose();
      } catch (_) {}
      engine = null;
    }
  };

  // Register teardown listener
  window.addEventListener("beforeunload", cleanup);

  try {
    console.info("[Bootstrap] Initializing Vice-City Rendering Engine...");

    // 1. Initialize rendering engine (WebGPU with WebGL 2 fallback)
    const initResult = await EngineFactory.create(canvas, {
      antialias: true,
      powerPreference: "high-performance",
    });
    engine = initResult.engine;
    const backend = initResult.backend;

    console.info(`[Bootstrap] Engine initialized with backend: ${backend}`);

    // 2. Build Controllable Modular City Scene
    const cityResult = createCityScene(engine, canvas, appContainer);
    scene = cityResult.scene;
    environment = cityResult.environment;
    player = cityResult.player;
    camera = cityResult.camera;
    input = cityResult.input;

    // 3. Initialize lightweight telemetry overlay
    if (telemetryContainer) {
      telemetry = new Telemetry(telemetryContainer, engine, scene, backend, canvas);
    }

    // 4. Instructions Toast for desktop mouse-look
    toastEl = document.createElement("div");
    toastEl.className = "pointer-lock-toast";
    toastEl.textContent = "Click to aim | WASD to move | Shift to sprint | Space to jump";
    appContainer.appendChild(toastEl);

    // 5. Register context loss & restoration lifecycle observers
    contextLostObserver = engine.onContextLostObservable.add(() => {
      console.warn("[Bootstrap] Graphics context lost.");
      telemetry?.setStatus("Context Lost");
    });

    contextRestoredObserver = engine.onContextRestoredObservable.add(() => {
      console.info("[Bootstrap] Graphics context restoration event detected.");
      telemetry?.setStatus("Context Restored");
    });

    // 6. Start Babylon render loop (prevent duplicate render loops)
    engine.stopRenderLoop();
    engine.runRenderLoop(() => {
      if (!scene || !engine) return;

      const dt = engine.getDeltaTime() / 1000.0;

      // Update input, player kinematics, camera spring-arm, and telemetry
      if (input && player && camera) {
        input.update(dt);
        player.update(dt, input.getState(), camera.yaw);
        camera.update(dt, player.position, input.getState());

        const runtimeState = player.getRuntimeState();
        telemetry?.updatePlayer(
          runtimeState.state,
          runtimeState.speed,
          player.position.x,
          player.position.y,
          player.position.z
        );
      }

      scene.render();
    });

    // 7. Responsive window resize handling with DPR awareness
    handleResize = (): void => {
      engine?.resize();
    };
    window.addEventListener("resize", handleResize);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Bootstrap] Fatal initialization failure:", error);

    // Idempotently clean up any partially initialized resources
    cleanup();

    // Display safe, accessible error card
    displayFatalError(appContainer, errorMsg);
  }
}

// Start application bootstrap
void bootstrap();

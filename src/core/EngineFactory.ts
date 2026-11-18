import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";

export type RenderingBackend = "WebGPU" | "WebGL 2";

export interface EngineInitResult {
  engine: AbstractEngine;
  backend: RenderingBackend;
}

export interface EngineFactoryOptions {
  antialias?: boolean;
  powerPreference?: "high-performance" | "low-power";
  stencil?: boolean;
}

/**
 * Asynchronously initializes the optimal Babylon.js rendering engine:
 * 1. Checks WebGPU availability.
 * 2. Attempts WebGPUEngine initialization.
 * 3. Disposes partial WebGPU resources and falls back to WebGL 2 Engine on any failure.
 * 4. Fails gracefully if neither backend is supported.
 */
export class EngineFactory {
  public static async create(
    canvas: HTMLCanvasElement,
    options: EngineFactoryOptions = {}
  ): Promise<EngineInitResult> {
    const isWebGPUSupported = await EngineFactory.checkWebGPUSupport();

    if (isWebGPUSupported) {
      let webGPUEngine: WebGPUEngine | null = null;
      try {
        console.info("[EngineFactory] Attempting WebGPU engine initialization...");
        webGPUEngine = new WebGPUEngine(canvas, {
          antialias: options.antialias ?? true,
          powerPreference: options.powerPreference ?? "high-performance",
          stencil: options.stencil ?? true,
        });

        await webGPUEngine.initAsync();
        console.info("[EngineFactory] WebGPU engine initialized successfully.");

        return {
          engine: webGPUEngine,
          backend: "WebGPU",
        };
      } catch (error) {
        console.warn(
          "[EngineFactory] WebGPU initialization failed. Disposing partial resources and falling back to WebGL 2.",
          error
        );
        try {
          webGPUEngine?.dispose();
        } catch (disposeErr) {
          console.warn("[EngineFactory] Error disposing partially initialized WebGPUEngine:", disposeErr);
        }
      }
    } else {
      console.info("[EngineFactory] WebGPU is not supported by the environment. Proceeding to WebGL 2 fallback.");
    }

    // WebGL 2 Fallback
    try {
      console.info("[EngineFactory] Initializing WebGL 2 engine fallback...");
      if (!Engine.isSupported()) {
        throw new Error("WebGL is not supported by this browser/device.");
      }

      const webglEngine = new Engine(canvas, options.antialias ?? true, {
        stencil: options.stencil ?? true,
        powerPreference: options.powerPreference ?? "high-performance",
        disableWebGL2Support: false,
      });

      // Explicitly verify that the context created is WebGL 2 (never mislabel WebGL 1)
      if (webglEngine.webGLVersion < 2) {
        webglEngine.dispose();
        throw new Error(
          `WebGL 2 context creation failed: browser only provided WebGL ${webglEngine.webGLVersion}. WebGL 2 is strictly required.`
        );
      }

      console.info("[EngineFactory] WebGL 2 engine initialized successfully.");

      return {
        engine: webglEngine,
        backend: "WebGL 2",
      };
    } catch (fallbackError) {
      const errorMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : "Unknown error during WebGL 2 initialization.";
      console.error("[EngineFactory] Fatal: All rendering backends failed.", fallbackError);
      throw new Error(`Failed to initialize graphics engine (WebGPU & WebGL 2 unavailable): ${errorMessage}`);
    }
  }

  /**
   * Probes WebGPU availability safely without throwing unhandled exceptions.
   */
  private static async checkWebGPUSupport(): Promise<boolean> {
    try {
      if (typeof navigator === "undefined" || !("gpu" in navigator)) {
        return false;
      }
      return await WebGPUEngine.IsSupportedAsync;
    } catch (err) {
      console.warn("[EngineFactory] Error checking WebGPU support:", err);
      return false;
    }
  }
}

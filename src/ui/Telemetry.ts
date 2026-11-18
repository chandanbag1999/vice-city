import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { RenderingBackend } from "../core/EngineFactory";

export class Telemetry {
  private readonly _container: HTMLElement;
  private readonly _engine: AbstractEngine;
  private readonly _scene: Scene;
  private readonly _backend: RenderingBackend;
  private readonly _canvas: HTMLCanvasElement;

  private _intervalId: number | null = null;
  private _status = "Initializing";
  private readonly _fpsHistory: Float32Array;
  private _historyIndex = 0;
  private _historyCount = 0;
  private readonly _historySize = 60;

  constructor(
    container: HTMLElement,
    engine: AbstractEngine,
    scene: Scene,
    backend: RenderingBackend,
    canvas: HTMLCanvasElement
  ) {
    this._container = container;
    this._engine = engine;
    this._scene = scene;
    this._backend = backend;
    this._canvas = canvas;
    this._fpsHistory = new Float32Array(this._historySize);

    this.renderInitialUI();
    this.startUpdating(250); // Throttled updates to prevent DOM churn
  }

  private renderInitialUI(): void {
    const badgeClass = this._backend === "WebGPU" ? "badge-webgpu" : "badge-webgl2";

    this._container.innerHTML = `
      <div class="telemetry-title">Vice-City Telemetry</div>
      <div class="telemetry-row">
        <span class="telemetry-label">Backend:</span>
        <span class="telemetry-value ${badgeClass}">${this._backend}</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">Status:</span>
        <span class="telemetry-value" id="telemStatus">Initializing</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">FPS (Instant):</span>
        <span class="telemetry-value" id="telemFpsCurrent">--</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">FPS (Average):</span>
        <span class="telemetry-value" id="telemFpsAvg">--</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">Active Meshes:</span>
        <span class="telemetry-value" id="telemMeshes">--</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">Draw Calls:</span>
        <span class="telemetry-value" id="telemDrawCalls">--</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">Canvas Buffer:</span>
        <span class="telemetry-value" id="telemResolution">--</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">Device Pixel Ratio:</span>
        <span class="telemetry-value" id="telemDpr">${window.devicePixelRatio.toFixed(2)}</span>
      </div>
    `;
  }

  private startUpdating(intervalMs: number): void {
    const statusEl = document.getElementById("telemStatus");
    const fpsCurrentEl = document.getElementById("telemFpsCurrent");
    const fpsAvgEl = document.getElementById("telemFpsAvg");
    const meshesEl = document.getElementById("telemMeshes");
    const drawCallsEl = document.getElementById("telemDrawCalls");
    const resolutionEl = document.getElementById("telemResolution");
    const dprEl = document.getElementById("telemDpr");

    this._intervalId = window.setInterval(() => {
      const currentFps = this._engine.getFps();

      // Record sample in circular buffer for rolling average
      if (Number.isFinite(currentFps) && currentFps > 0) {
        this._fpsHistory[this._historyIndex] = currentFps;
        this._historyIndex = (this._historyIndex + 1) % this._historySize;
        if (this._historyCount < this._historySize) {
          this._historyCount++;
        }
      }

      let avgFps = 0;
      if (this._historyCount > 0) {
        let sum = 0;
        for (let i = 0; i < this._historyCount; i++) {
          sum += this._fpsHistory[i] ?? 0;
        }
        avgFps = sum / this._historyCount;
      }

      // Query documented draw calls if exposed on engine instance
      const engineAny = this._engine as unknown as { drawCalls?: number };
      const drawCallsValue = typeof engineAny.drawCalls === "number" ? engineAny.drawCalls : "N/A";

      if (this._status === "Initializing") {
        this._status = "Running";
      }

      if (statusEl) statusEl.textContent = this._status;
      if (fpsCurrentEl) fpsCurrentEl.textContent = Math.round(currentFps).toString();
      if (fpsAvgEl) fpsAvgEl.textContent = Math.round(avgFps).toString();
      if (meshesEl) meshesEl.textContent = this._scene.getActiveMeshes().length.toString();
      if (drawCallsEl) drawCallsEl.textContent = drawCallsValue.toString();
      if (resolutionEl) resolutionEl.textContent = `${this._canvas.width}×${this._canvas.height}`;
      if (dprEl) dprEl.textContent = window.devicePixelRatio.toFixed(2);
    }, intervalMs);
  }

  public setStatus(status: string): void {
    this._status = status;
    const statusEl = document.getElementById("telemStatus");
    if (statusEl) {
      statusEl.textContent = this._status;
    }
  }

  public dispose(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._container.innerHTML = "";
  }
}

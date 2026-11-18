import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { type Observer } from "@babylonjs/core/Misc/observable";
import { RenderingBackend } from "../core/EngineFactory";

export class Telemetry {
  private readonly _container: HTMLElement;
  private readonly _engine: AbstractEngine;
  private readonly _scene: Scene;
  private readonly _backend: RenderingBackend;
  private readonly _canvas: HTMLCanvasElement;

  private _intervalId: number | null = null;
  private _renderObserver: Observer<Scene> | null = null;
  private _status = "Initializing";

  // Genuine frame-based rolling window (last 60 rendered frames)
  private readonly _historySize = 60;
  private readonly _frameTimeHistory: Float32Array;
  private _frameIndex = 0;
  private _frameCount = 0;
  private _rollingDeltaSum = 0;

  // Runtime player telemetry
  private _playerState = "IDLE";
  private _playerSpeed = 0;
  private _playerPosX = 0;
  private _playerPosY = 0;
  private _playerPosZ = 0;

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
    this._frameTimeHistory = new Float32Array(this._historySize);

    this.renderInitialUI();
    this.attachRenderObserver();
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
        <span class="telemetry-label">FPS (60-Frame Avg):</span>
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
        <span class="telemetry-label">Player State:</span>
        <span class="telemetry-value" id="telemPlayerState">--</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">Player Speed:</span>
        <span class="telemetry-value" id="telemPlayerSpeed">--</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">Player Pos:</span>
        <span class="telemetry-value" id="telemPlayerPos">--</span>
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

  /**
   * Records every single rendered frame time into a pre-allocated circular buffer.
   * Zero per-frame memory allocations.
   */
  private attachRenderObserver(): void {
    this._renderObserver = this._scene.onAfterRenderObservable.add(() => {
      const dt = this._engine.getDeltaTime();
      if (dt > 0 && Number.isFinite(dt)) {
        const oldDt = this._frameTimeHistory[this._frameIndex] ?? 0;
        this._frameTimeHistory[this._frameIndex] = dt;
        this._rollingDeltaSum = this._rollingDeltaSum - oldDt + dt;
        this._frameIndex = (this._frameIndex + 1) % this._historySize;
        if (this._frameCount < this._historySize) {
          this._frameCount++;
        }

        // Periodic resynchronization to prevent floating-point accumulation drift
        if (this._frameIndex === 0) {
          let sum = 0;
          for (let i = 0; i < this._frameCount; i++) {
            sum += this._frameTimeHistory[i] ?? 0;
          }
          this._rollingDeltaSum = sum;
        }
      }
    });
  }

  private startUpdating(intervalMs: number): void {
    const statusEl = document.getElementById("telemStatus");
    const fpsCurrentEl = document.getElementById("telemFpsCurrent");
    const fpsAvgEl = document.getElementById("telemFpsAvg");
    const meshesEl = document.getElementById("telemMeshes");
    const drawCallsEl = document.getElementById("telemDrawCalls");
    const resolutionEl = document.getElementById("telemResolution");
    const dprEl = document.getElementById("telemDpr");
    const playerStateEl = document.getElementById("telemPlayerState");
    const playerSpeedEl = document.getElementById("telemPlayerSpeed");
    const playerPosEl = document.getElementById("telemPlayerPos");

    this._intervalId = window.setInterval(() => {
      const currentFps = this._engine.getFps();

      // Calculate genuine 60-frame rolling average from accumulated delta times
      let avgFps = 0;
      if (this._frameCount > 0 && this._rollingDeltaSum > 0) {
        const avgDeltaMs = this._rollingDeltaSum / this._frameCount;
        if (avgDeltaMs > 0) {
          avgFps = 1000 / avgDeltaMs;
        }
      }

      // Babylon WebGPUEngine/Engine does not expose a public scalar drawCalls property; display honest label
      const engineAny = this._engine as unknown as { drawCalls?: number };
      const drawCallsValue = typeof engineAny.drawCalls === "number" ? engineAny.drawCalls : "N/A";

      if (this._status === "Initializing") {
        this._status = "Running";
      }

      if (statusEl) statusEl.textContent = this._status;
      if (fpsCurrentEl) fpsCurrentEl.textContent = Math.round(Number.isFinite(currentFps) ? currentFps : 0).toString();
      if (fpsAvgEl) fpsAvgEl.textContent = Math.round(Number.isFinite(avgFps) ? avgFps : 0).toString();
      if (meshesEl) meshesEl.textContent = this._scene.getActiveMeshes().length.toString();
      if (drawCallsEl) drawCallsEl.textContent = drawCallsValue.toString();
      if (resolutionEl) resolutionEl.textContent = `${this._canvas.width}×${this._canvas.height}`;
      if (dprEl) dprEl.textContent = window.devicePixelRatio.toFixed(2);
      if (playerStateEl) playerStateEl.textContent = this._playerState;
      if (playerSpeedEl) playerSpeedEl.textContent = `${this._playerSpeed.toFixed(1)} m/s`;
      if (playerPosEl) {
        playerPosEl.textContent = `${this._playerPosX.toFixed(1)}, ${this._playerPosY.toFixed(1)}, ${this._playerPosZ.toFixed(1)}`;
      }
    }, intervalMs);
  }

  public updatePlayer(state: string, speed: number, x: number, y: number, z: number): void {
    this._playerState = state;
    this._playerSpeed = speed;
    this._playerPosX = x;
    this._playerPosY = y;
    this._playerPosZ = z;
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
    if (this._renderObserver !== null) {
      this._scene.onAfterRenderObservable.remove(this._renderObserver);
      this._renderObserver = null;
    }
    this._container.innerHTML = "";
  }
}

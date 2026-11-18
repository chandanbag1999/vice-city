import { IInputDevice } from "./InputTypes";

export interface KeyboardMouseConfig {
  sensitivityX: number;
  sensitivityY: number;
}

export const DEFAULT_KEYBOARD_MOUSE_CONFIG: KeyboardMouseConfig = {
  sensitivityX: 0.0022,
  sensitivityY: 0.0022,
};

/**
 * Handles desktop keyboard locomotion and mouse-look camera rotation.
 * Manages pointer lock lifecycle, window blur clearing, and event listener disposal.
 */
export class KeyboardMouseInput implements IInputDevice {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _config: KeyboardMouseConfig;
  private readonly _keysDown: Set<string> = new Set();

  private _moveX = 0;
  private _moveY = 0;
  private _lookX = 0;
  private _lookY = 0;
  private _accumulatedDeltaX = 0;
  private _accumulatedDeltaY = 0;
  private _sprint = false;
  private _jump = false;
  private _interact = false;
  private _isPointerLocked = false;
  private _isMouseDown = false;

  // Bound event handlers for clean removal
  private readonly _onKeyDown: (e: KeyboardEvent) => void;
  private readonly _onKeyUp: (e: KeyboardEvent) => void;
  private readonly _onMouseMove: (e: MouseEvent) => void;
  private readonly _onMouseDown: (e: MouseEvent) => void;
  private readonly _onMouseUp: (e: MouseEvent) => void;
  private readonly _onPointerLockChange: () => void;
  private readonly _onBlur: () => void;
  private readonly _onVisibilityChange: () => void;

  constructor(canvas: HTMLCanvasElement, config: Partial<KeyboardMouseConfig> = {}) {
    this._canvas = canvas;
    this._config = { ...DEFAULT_KEYBOARD_MOUSE_CONFIG, ...config };

    this._onKeyDown = (e: KeyboardEvent): void => {
      // Prevent browser scrolling on Space and Arrow keys
      if (
        e.code === "Space" ||
        e.code === "ArrowUp" ||
        e.code === "ArrowDown" ||
        e.code === "ArrowLeft" ||
        e.code === "ArrowRight"
      ) {
        e.preventDefault();
      }
      this._keysDown.add(e.code);
    };

    this._onKeyUp = (e: KeyboardEvent): void => {
      this._keysDown.delete(e.code);
    };

    this._onMouseMove = (e: MouseEvent): void => {
      // Rotate if pointer locked or if dragging with mouse button down
      if (this._isPointerLocked || this._isMouseDown) {
        this._accumulatedDeltaX += e.movementX ?? 0;
        this._accumulatedDeltaY += e.movementY ?? 0;
      }
    };

    this._onMouseDown = (e: MouseEvent): void => {
      if (e.button === 0) {
        this._isMouseDown = true;
        // Request pointer lock on canvas click if not already locked
        if (!this._isPointerLocked && document.pointerLockElement !== this._canvas) {
          try {
            const promise = this._canvas.requestPointerLock() as Promise<void> | undefined;
            if (promise && typeof promise.catch === "function") {
              promise.catch(() => {
                // User or browser declined pointer lock; mouse-drag look remains functional
              });
            }
          } catch (_) {
            // Pointer lock unavailable or rejected
          }
        }
      }
    };

    this._onMouseUp = (e: MouseEvent): void => {
      if (e.button === 0) {
        this._isMouseDown = false;
      }
    };

    this._onPointerLockChange = (): void => {
      this._isPointerLocked = document.pointerLockElement === this._canvas;
      if (!this._isPointerLocked) {
        this._accumulatedDeltaX = 0;
        this._accumulatedDeltaY = 0;
      }
    };

    this._onBlur = (): void => {
      this.reset();
    };

    this._onVisibilityChange = (): void => {
      if (document.hidden) {
        this.reset();
      }
    };

    this.attachListeners();
  }

  private attachListeners(): void {
    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp, { passive: true });
    window.addEventListener("mousemove", this._onMouseMove, { passive: true });
    window.addEventListener("mouseup", this._onMouseUp, { passive: true });
    this._canvas.addEventListener("mousedown", this._onMouseDown, { passive: true });
    document.addEventListener("pointerlockchange", this._onPointerLockChange, { passive: true });
    window.addEventListener("blur", this._onBlur, { passive: true });
    document.addEventListener("visibilitychange", this._onVisibilityChange, { passive: true });
  }

  public get moveX(): number {
    return this._moveX;
  }

  public get moveY(): number {
    return this._moveY;
  }

  public get lookX(): number {
    return this._lookX;
  }

  public get lookY(): number {
    return this._lookY;
  }

  public get sprint(): boolean {
    return this._sprint;
  }

  public get jump(): boolean {
    return this._jump;
  }

  public get interact(): boolean {
    return this._interact;
  }

  public get isPointerLocked(): boolean {
    return this._isPointerLocked;
  }

  public update(_deltaTime: number): void {
    let rawX = 0;
    let rawY = 0;

    // Longitudinal (W / S / Up / Down)
    if (this._keysDown.has("KeyW") || this._keysDown.has("ArrowUp")) rawY += 1;
    if (this._keysDown.has("KeyS") || this._keysDown.has("ArrowDown")) rawY -= 1;

    // Lateral (A / D / Left / Right)
    if (this._keysDown.has("KeyA") || this._keysDown.has("ArrowLeft")) rawX -= 1;
    if (this._keysDown.has("KeyD") || this._keysDown.has("ArrowRight")) rawX += 1;

    this._moveX = rawX;
    this._moveY = rawY;

    // Action modifiers
    this._sprint = this._keysDown.has("ShiftLeft") || this._keysDown.has("ShiftRight");
    this._jump = this._keysDown.has("Space");
    this._interact = this._keysDown.has("KeyE");

    // Camera look deltas
    this._lookX = this._accumulatedDeltaX * this._config.sensitivityX;
    this._lookY = this._accumulatedDeltaY * this._config.sensitivityY;

    // Reset frame delta accumulators
    this._accumulatedDeltaX = 0;
    this._accumulatedDeltaY = 0;
  }

  public reset(): void {
    this._keysDown.clear();
    this._moveX = 0;
    this._moveY = 0;
    this._lookX = 0;
    this._lookY = 0;
    this._accumulatedDeltaX = 0;
    this._accumulatedDeltaY = 0;
    this._sprint = false;
    this._jump = false;
    this._interact = false;
    this._isMouseDown = false;
  }

  public dispose(): void {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
    this._canvas.removeEventListener("mousedown", this._onMouseDown);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    window.removeEventListener("blur", this._onBlur);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    this.reset();
  }
}

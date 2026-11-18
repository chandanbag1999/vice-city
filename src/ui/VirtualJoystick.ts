export interface VirtualJoystickConfig {
  maxRadius: number;
  lookSensitivity: number;
  autoDetectTouch: boolean;
}

export const DEFAULT_JOYSTICK_CONFIG: VirtualJoystickConfig = {
  maxRadius: 48,
  lookSensitivity: 0.004,
  autoDetectTouch: true,
};

/**
 * Mobile touch HUD featuring:
 * - Left floating/fixed virtual thumbstick for character locomotion
 * - Right swipe region for camera look
 * - Action buttons for Sprint (toggle/hold) and Jump
 *
 * Uses Pointer Events with independent pointerId tracking for seamless multi-touch.
 */
export class VirtualJoystick {
  private readonly _container: HTMLElement;
  private readonly _config: VirtualJoystickConfig;

  private _overlayEl: HTMLElement | null = null;
  private _joystickBaseEl: HTMLElement | null = null;
  private _joystickKnobEl: HTMLElement | null = null;

  private _movePointerId: number | null = null;
  private _lookPointerId: number | null = null;

  private _joystickStartX = 0;
  private _joystickStartY = 0;
  private _lookLastX = 0;
  private _lookLastY = 0;

  private _moveX = 0;
  private _moveY = 0;
  private _lookDeltaX = 0;
  private _lookDeltaY = 0;
  private _sprint = false;
  private _jump = false;
  private _interact = false;
  private _isVisible = false;

  // Bound event handlers
  private readonly _onLeftPointerDown: (e: PointerEvent) => void;
  private readonly _onRightPointerDown: (e: PointerEvent) => void;
  private readonly _onWindowPointerMove: (e: PointerEvent) => void;
  private readonly _onWindowPointerUp: (e: PointerEvent) => void;
  private readonly _onWindowPointerCancel: (e: PointerEvent) => void;

  constructor(parentContainer: HTMLElement, config: Partial<VirtualJoystickConfig> = {}) {
    this._container = parentContainer;
    this._config = { ...DEFAULT_JOYSTICK_CONFIG, ...config };

    this._onLeftPointerDown = this.handleLeftPointerDown.bind(this);
    this._onRightPointerDown = this.handleRightPointerDown.bind(this);
    this._onWindowPointerMove = this.handlePointerMove.bind(this);
    this._onWindowPointerUp = this.handlePointerUp.bind(this);
    this._onWindowPointerCancel = this.handlePointerCancel.bind(this);

    this.createUI();
  }

  private isTouchDevice(): boolean {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
  }

  private createUI(): void {
    const isTouch = this.isTouchDevice();
    this._isVisible = !this._config.autoDetectTouch || isTouch;

    const overlay = document.createElement("div");
    overlay.className = "touch-controls-overlay";
    overlay.style.display = this._isVisible ? "block" : "none";

    // 1. Left Zone: Locomotion Joystick Zone
    const leftZone = document.createElement("div");
    leftZone.className = "touch-zone-left";

    const joyBase = document.createElement("div");
    joyBase.className = "touch-joystick-base";

    const joyKnob = document.createElement("div");
    joyKnob.className = "touch-joystick-knob";

    joyBase.appendChild(joyKnob);
    leftZone.appendChild(joyBase);
    overlay.appendChild(leftZone);

    this._joystickBaseEl = joyBase;
    this._joystickKnobEl = joyKnob;

    // 2. Right Zone: Camera Look & Action Buttons
    const rightZone = document.createElement("div");
    rightZone.className = "touch-zone-right";

    // Buttons Container
    const btnContainer = document.createElement("div");
    btnContainer.className = "touch-buttons-container";

    // Sprint Button
    const sprintBtn = document.createElement("button");
    sprintBtn.className = "touch-btn touch-btn-sprint";
    sprintBtn.textContent = "RUN";
    sprintBtn.setAttribute("type", "button");

    sprintBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this._sprint = !this._sprint; // Toggle sprint state on touch
      sprintBtn.classList.toggle("active", this._sprint);
    });

    // Jump Button
    const jumpBtn = document.createElement("button");
    jumpBtn.className = "touch-btn touch-btn-jump";
    jumpBtn.textContent = "JUMP";
    jumpBtn.setAttribute("type", "button");

    jumpBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this._jump = true;
      jumpBtn.classList.add("active");
    });
    jumpBtn.addEventListener("pointerup", (e) => {
      e.stopPropagation();
      this._jump = false;
      jumpBtn.classList.remove("active");
    });
    jumpBtn.addEventListener("pointercancel", (e) => {
      e.stopPropagation();
      this._jump = false;
      jumpBtn.classList.remove("active");
    });

    btnContainer.appendChild(sprintBtn);
    btnContainer.appendChild(jumpBtn);
    rightZone.appendChild(btnContainer);
    overlay.appendChild(rightZone);

    this._container.appendChild(overlay);
    this._overlayEl = overlay;

    // Attach pointer listeners
    leftZone.addEventListener("pointerdown", this._onLeftPointerDown);
    rightZone.addEventListener("pointerdown", this._onRightPointerDown);
    window.addEventListener("pointermove", this._onWindowPointerMove);
    window.addEventListener("pointerup", this._onWindowPointerUp);
    window.addEventListener("pointercancel", this._onWindowPointerCancel);
  }

  private handleLeftPointerDown(e: PointerEvent): void {
    if (this._movePointerId !== null) return;
    this._movePointerId = e.pointerId;

    const rect = this._container.getBoundingClientRect();
    this._joystickStartX = e.clientX - rect.left;
    this._joystickStartY = e.clientY - rect.top;

    if (this._joystickBaseEl) {
      this._joystickBaseEl.style.display = "block";
      this._joystickBaseEl.style.left = `${this._joystickStartX}px`;
      this._joystickBaseEl.style.top = `${this._joystickStartY}px`;
    }
    if (this._joystickKnobEl) {
      this._joystickKnobEl.style.transform = `translate(0px, 0px)`;
    }

    this._moveX = 0;
    this._moveY = 0;
  }

  private handleRightPointerDown(e: PointerEvent): void {
    if (this._lookPointerId !== null) return;
    this._lookPointerId = e.pointerId;
    this._lookLastX = e.clientX;
    this._lookLastY = e.clientY;
  }

  private handlePointerMove(e: PointerEvent): void {
    if (e.pointerId === this._movePointerId) {
      const rect = this._container.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      let dx = currentX - this._joystickStartX;
      let dy = currentY - this._joystickStartY;
      const dist = Math.hypot(dx, dy);

      if (dist > this._config.maxRadius) {
        dx = (dx / dist) * this._config.maxRadius;
        dy = (dy / dist) * this._config.maxRadius;
      }

      if (this._joystickKnobEl) {
        this._joystickKnobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      this._moveX = dx / this._config.maxRadius;
      this._moveY = -dy / this._config.maxRadius; // Up is forward
    } else if (e.pointerId === this._lookPointerId) {
      const dx = e.clientX - this._lookLastX;
      const dy = e.clientY - this._lookLastY;
      this._lookLastX = e.clientX;
      this._lookLastY = e.clientY;

      this._lookDeltaX += dx * this._config.lookSensitivity;
      this._lookDeltaY += dy * this._config.lookSensitivity;
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (e.pointerId === this._movePointerId) {
      this._movePointerId = null;
      this._moveX = 0;
      this._moveY = 0;
      if (this._joystickBaseEl) {
        this._joystickBaseEl.style.display = "none";
      }
      if (this._joystickKnobEl) {
        this._joystickKnobEl.style.transform = `translate(0px, 0px)`;
      }
    } else if (e.pointerId === this._lookPointerId) {
      this._lookPointerId = null;
    }
  }

  private handlePointerCancel(e: PointerEvent): void {
    this.handlePointerUp(e);
  }

  public get moveX(): number {
    return this._moveX;
  }

  public get moveY(): number {
    return this._moveY;
  }

  public get lookX(): number {
    return this._lookDeltaX;
  }

  public get lookY(): number {
    return this._lookDeltaY;
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

  public update(): void {
    // Reset frame look accumulators after consumption
    this._lookDeltaX = 0;
    this._lookDeltaY = 0;
  }

  public reset(): void {
    this._movePointerId = null;
    this._lookPointerId = null;
    this._moveX = 0;
    this._moveY = 0;
    this._lookDeltaX = 0;
    this._lookDeltaY = 0;
    this._jump = false;
    if (this._joystickBaseEl) {
      this._joystickBaseEl.style.display = "none";
    }
    if (this._joystickKnobEl) {
      this._joystickKnobEl.style.transform = `translate(0px, 0px)`;
    }
  }

  public setVisible(visible: boolean): void {
    this._isVisible = visible;
    if (this._overlayEl) {
      this._overlayEl.style.display = visible ? "block" : "none";
    }
  }

  public dispose(): void {
    window.removeEventListener("pointermove", this._onWindowPointerMove);
    window.removeEventListener("pointerup", this._onWindowPointerUp);
    window.removeEventListener("pointercancel", this._onWindowPointerCancel);
    if (this._overlayEl) {
      this._overlayEl.remove();
      this._overlayEl = null;
    }
    this.reset();
  }
}

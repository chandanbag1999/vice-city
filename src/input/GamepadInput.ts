import { IInputDevice } from "./InputTypes";

export interface GamepadConfig {
  deadzone: number;
  lookSensitivityX: number;
  lookSensitivityY: number;
}

export const DEFAULT_GAMEPAD_CONFIG: GamepadConfig = {
  deadzone: 0.15,
  lookSensitivityX: 2.5,
  lookSensitivityY: 2.0,
};

/**
 * Handles HTML5 Gamepad API polling, axis normalization, and button mapping.
 */
export class GamepadInput implements IInputDevice {
  private readonly _config: GamepadConfig;
  private _connectedIndex: number | null = null;

  private _moveX = 0;
  private _moveY = 0;
  private _lookX = 0;
  private _lookY = 0;
  private _sprint = false;
  private _jump = false;
  private _interact = false;

  private readonly _onGamepadConnected: (e: GamepadEvent) => void;
  private readonly _onGamepadDisconnected: (e: GamepadEvent) => void;

  constructor(config: Partial<GamepadConfig> = {}) {
    this._config = { ...DEFAULT_GAMEPAD_CONFIG, ...config };

    this._onGamepadConnected = (e: GamepadEvent): void => {
      console.info(`[GamepadInput] Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
      if (this._connectedIndex === null) {
        this._connectedIndex = e.gamepad.index;
      }
    };

    this._onGamepadDisconnected = (e: GamepadEvent): void => {
      console.info(`[GamepadInput] Gamepad disconnected from index ${e.gamepad.index}`);
      if (this._connectedIndex === e.gamepad.index) {
        this._connectedIndex = null;
        this.reset();
      }
    };

    window.addEventListener("gamepadconnected", this._onGamepadConnected);
    window.addEventListener("gamepaddisconnected", this._onGamepadDisconnected);
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

  public get isConnected(): boolean {
    return this._connectedIndex !== null;
  }

  private applyDeadzone(value: number): number {
    const abs = Math.abs(value);
    if (abs < this._config.deadzone) {
      return 0;
    }
    const sign = Math.sign(value);
    // Smooth remap from [deadzone, 1.0] to [0.0, 1.0]
    return sign * ((abs - this._config.deadzone) / (1.0 - this._config.deadzone));
  }

  public update(deltaTime: number): void {
    if (typeof navigator === "undefined" || !navigator.getGamepads) {
      return;
    }

    const gamepads = navigator.getGamepads();
    let gamepad: Gamepad | null = null;

    if (this._connectedIndex !== null && gamepads[this._connectedIndex]) {
      gamepad = gamepads[this._connectedIndex] ?? null;
    } else {
      // Find the first available active gamepad
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp && gp.connected) {
          this._connectedIndex = i;
          gamepad = gp;
          break;
        }
      }
    }

    if (!gamepad || !gamepad.connected) {
      this.reset();
      return;
    }

    // Left Stick: Movement (axes 0: X, 1: Y where -1 is forward)
    const rawMoveX = gamepad.axes[0] ?? 0;
    const rawMoveY = gamepad.axes[1] ?? 0;
    this._moveX = this.applyDeadzone(rawMoveX);
    this._moveY = -this.applyDeadzone(rawMoveY); // Invert so positive is forward

    // Right Stick: Look (axes 2: X, 3: Y)
    const rawLookX = gamepad.axes[2] ?? 0;
    const rawLookY = gamepad.axes[3] ?? 0;
    this._lookX = this.applyDeadzone(rawLookX) * this._config.lookSensitivityX * deltaTime;
    this._lookY = this.applyDeadzone(rawLookY) * this._config.lookSensitivityY * deltaTime;

    // Standard Buttons
    const buttons = gamepad.buttons;
    // Button 0 (A / Cross): Jump
    this._jump = Boolean(buttons[0]?.pressed);
    // Button 4 (L1) / Button 10 (L3) / Button 6 (L2): Sprint
    this._sprint = Boolean(buttons[4]?.pressed || buttons[10]?.pressed || (buttons[6]?.value ?? 0) > 0.5);
    // Button 1 (B / Circle) / Button 2 (X / Square): Interact
    this._interact = Boolean(buttons[1]?.pressed || buttons[2]?.pressed);
  }

  public reset(): void {
    this._moveX = 0;
    this._moveY = 0;
    this._lookX = 0;
    this._lookY = 0;
    this._sprint = false;
    this._jump = false;
    this._interact = false;
  }

  public dispose(): void {
    window.removeEventListener("gamepadconnected", this._onGamepadConnected);
    window.removeEventListener("gamepaddisconnected", this._onGamepadDisconnected);
    this.reset();
  }
}

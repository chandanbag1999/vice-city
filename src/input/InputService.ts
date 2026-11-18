import { InputState } from "./InputTypes";
import { KeyboardMouseInput } from "./KeyboardMouseInput";
import { GamepadInput } from "./GamepadInput";
import { TouchInput } from "./TouchInput";

/**
 * Unified Input Service aggregating Keyboard/Mouse, Gamepad, and Touch devices.
 * Normalizes directional movement and camera rotation into a consistent, non-allocating schema.
 */
export class InputService {
  private readonly _keyboardMouse: KeyboardMouseInput;
  private readonly _gamepad: GamepadInput;
  private readonly _touch: TouchInput;

  // Single pre-allocated state object to eliminate per-frame GC allocations
  private readonly _state: InputState = {
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    sprint: false,
    jump: false,
    interact: false,
  };

  constructor(canvas: HTMLCanvasElement, appContainer: HTMLElement) {
    this._keyboardMouse = new KeyboardMouseInput(canvas);
    this._gamepad = new GamepadInput();
    this._touch = new TouchInput(appContainer);
  }

  public getState(): Readonly<InputState> {
    return this._state;
  }

  public get keyboardMouse(): KeyboardMouseInput {
    return this._keyboardMouse;
  }

  public get gamepad(): GamepadInput {
    return this._gamepad;
  }

  public get touch(): TouchInput {
    return this._touch;
  }

  public update(deltaTime: number): void {
    // 1. Update all underlying devices
    this._keyboardMouse.update(deltaTime);
    this._gamepad.update(deltaTime);
    this._touch.update(deltaTime);

    // 2. Aggregate movement axes
    let rawX = this._keyboardMouse.moveX + this._gamepad.moveX + this._touch.moveX;
    let rawY = this._keyboardMouse.moveY + this._gamepad.moveY + this._touch.moveY;

    // Clamp individual axes to [-1, 1]
    rawX = Math.max(-1, Math.min(1, rawX));
    rawY = Math.max(-1, Math.min(1, rawY));

    // Normalize diagonal magnitude so diagonal movement is never faster than orthogonal movement
    const magnitude = Math.hypot(rawX, rawY);
    if (magnitude > 1.0) {
      rawX /= magnitude;
      rawY /= magnitude;
    }

    this._state.moveX = rawX;
    this._state.moveY = rawY;

    // 3. Aggregate look rotation deltas
    this._state.lookX = this._keyboardMouse.lookX + this._gamepad.lookX + this._touch.lookX;
    this._state.lookY = this._keyboardMouse.lookY + this._gamepad.lookY + this._touch.lookY;

    // 4. Aggregate action triggers
    this._state.sprint =
      this._keyboardMouse.sprint || this._gamepad.sprint || this._touch.sprint;
    this._state.jump = this._keyboardMouse.jump || this._gamepad.jump || this._touch.jump;
    this._state.interact =
      this._keyboardMouse.interact || this._gamepad.interact || this._touch.interact;
  }

  public reset(): void {
    this._keyboardMouse.reset();
    this._gamepad.reset();
    this._touch.reset();
    this._state.moveX = 0;
    this._state.moveY = 0;
    this._state.lookX = 0;
    this._state.lookY = 0;
    this._state.sprint = false;
    this._state.jump = false;
    this._state.interact = false;
  }

  public dispose(): void {
    this._keyboardMouse.dispose();
    this._gamepad.dispose();
    this._touch.dispose();
  }
}

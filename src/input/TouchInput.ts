import { IInputDevice } from "./InputTypes";
import { VirtualJoystick } from "../ui/VirtualJoystick";

/**
 * Adapts VirtualJoystick touch controls into the standard IInputDevice pipeline.
 */
export class TouchInput implements IInputDevice {
  private readonly _joystick: VirtualJoystick;

  constructor(parentContainer: HTMLElement) {
    this._joystick = new VirtualJoystick(parentContainer);
  }

  public get moveX(): number {
    return this._joystick.moveX;
  }

  public get moveY(): number {
    return this._joystick.moveY;
  }

  public get lookX(): number {
    return this._joystick.lookX;
  }

  public get lookY(): number {
    return this._joystick.lookY;
  }

  public get sprint(): boolean {
    return this._joystick.sprint;
  }

  public get jump(): boolean {
    return this._joystick.jump;
  }

  public get interact(): boolean {
    return this._joystick.interact;
  }

  public update(_deltaTime: number): void {
    this._joystick.update();
  }

  public reset(): void {
    this._joystick.reset();
  }

  public dispose(): void {
    this._joystick.dispose();
  }
}

/**
 * Normalized input state representing aggregated player intention.
 * Decoupled from hardware input devices (keyboard, mouse, gamepad, touch).
 */
export interface InputState {
  /** Lateral movement: -1.0 (full left) to +1.0 (full right) */
  moveX: number;
  /** Longitudinal movement: -1.0 (backward) to +1.0 (forward) */
  moveY: number;

  /** Horizontal look delta (yaw angle delta in radians) */
  lookX: number;
  /** Vertical look delta (pitch angle delta in radians) */
  lookY: number;

  /** Sprint modifier active */
  sprint: boolean;
  /** Jump action active */
  jump: boolean;
  /** Contextual interaction active */
  interact: boolean;
}

/**
 * Standard interface for hardware input device providers.
 */
export interface IInputDevice {
  /** Updates internal state for the current frame */
  update(deltaTime: number): void;
  /** Resets transient input accumulators and clears stuck keys */
  reset(): void;
  /** Cleans up all registered event listeners and DOM mounts */
  dispose(): void;
}

/**
 * Locomotion and action states for the player character controller.
 */
export enum PlayerMovementState {
  IDLE = "IDLE",
  WALK = "WALK",
  RUN = "RUN",
  SPRINT = "SPRINT",
  JUMP = "JUMP",
  FALL = "FALL",
  LAND = "LAND",
}

export interface PlayerRuntimeState {
  state: PlayerMovementState;
  speed: number;
  isGrounded: boolean;
  timeInState: number;
}

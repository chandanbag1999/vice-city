export interface PlayerConfig {
  /** Walking movement speed in meters per second */
  walkSpeed: number;
  /** Running movement speed in meters per second */
  runSpeed: number;
  /** Sprinting movement speed in meters per second */
  sprintSpeed: number;
  /** Horizontal acceleration rate in m/s^2 */
  acceleration: number;
  /** Horizontal deceleration / braking rate in m/s^2 */
  deceleration: number;
  /** Character mesh yaw rotation speed toward movement vector in radians per second */
  turnSpeed: number;
  /** Initial vertical velocity impulse when jumping in m/s */
  jumpVelocity: number;
  /** Downward gravity acceleration in m/s^2 */
  gravity: number;
  /** Maximum vertical step-up obstacle height without jumping (e.g. 0.25m for 0.18m curbs) */
  stepUpHeight: number;
  /** Maximum walkable slope angle (e.g. 30 degrees = ~0.523 rad) */
  maxWalkableSlopeAngle: number;
  /** Player horizontal collision radius in meters */
  characterRadius: number;
  /** Player total height in meters */
  characterHeight: number;
}

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  walkSpeed: 2.8,
  runSpeed: 5.6,
  sprintSpeed: 8.8,
  acceleration: 18.0,
  deceleration: 22.0,
  turnSpeed: 14.0,
  jumpVelocity: 5.8,
  gravity: 14.0, // Tuned for crisp, responsive arcade feel
  stepUpHeight: 0.25,
  maxWalkableSlopeAngle: Math.PI / 6, // 30 degrees (normal.y >= 0.866)
  characterRadius: 0.40,
  characterHeight: 1.80,
};

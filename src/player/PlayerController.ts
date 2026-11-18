import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Ray } from "@babylonjs/core/Culling/ray";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { InputState } from "../input/InputTypes";
import { PlayerCharacter } from "./PlayerCharacter";
import { PlayerConfig, DEFAULT_PLAYER_CONFIG } from "./PlayerConfig";
import { PlayerMovementState, PlayerRuntimeState } from "./PlayerState";

/**
 * Kinematic character locomotion controller for the third-person player prototype.
 * Features:
 * - Camera-relative directional movement
 * - Smooth acceleration / deceleration
 * - Stepping over 0.18m curbs (up to stepUpHeight: 0.25m)
 * - 30-degree walkable slope support
 * - Horizontal wall collision and sliding
 * - Jump and gravity simulation
 * - Zero in-loop garbage collection allocations
 */
export class PlayerController {
  private readonly _scene: Scene;
  private readonly _character: PlayerCharacter;
  private readonly _config: PlayerConfig;

  // Transform and kinematic state
  private readonly _position: Vector3;
  private readonly _velocity: Vector3 = new Vector3(0, 0, 0);
  private _isGrounded = true;
  private _currentState: PlayerMovementState = PlayerMovementState.IDLE;
  private _timeInState = 0;
  private _landTimer = 0;

  // Ground and collision raycast masks
  private readonly _downRay: Ray = new Ray(new Vector3(), new Vector3(0, -1, 0), 1.0);
  private readonly _forwardRay: Ray = new Ray(new Vector3(), new Vector3(), 1.0);

  // Scratch vectors to eliminate per-frame allocations
  private readonly _scratchTargetVel = new Vector3();
  private readonly _scratchDisp = new Vector3();

  // Environment collision predicate
  private readonly _isWalkableGroundMesh: (mesh: AbstractMesh) => boolean;
  private readonly _isObstacleMesh: (mesh: AbstractMesh) => boolean;

  constructor(
    scene: Scene,
    character: PlayerCharacter,
    spawnPosition: Vector3,
    config: Partial<PlayerConfig> = {}
  ) {
    this._scene = scene;
    this._character = character;
    this._config = { ...DEFAULT_PLAYER_CONFIG, ...config };

    this._position = spawnPosition.clone();
    this._character.rootNode.position.copyFrom(this._position);

    // Ground predicate: Matches roads, sidewalks, ground foundation, ramps
    this._isWalkableGroundMesh = (mesh: AbstractMesh): boolean => {
      if (!mesh.isEnabled() || !mesh.isVisible) return false;
      const name = mesh.name;
      // Match ground, roads, sidewalks, curbs, and test ramps
      return (
        name.startsWith("road_") ||
        name.startsWith("sidewalk_") ||
        name.startsWith("curb_") ||
        name.startsWith("ground_") ||
        name.startsWith("ramp_")
      );
    };

    // Obstacle predicate: Matches building shells and solid architectural walls
    this._isObstacleMesh = (mesh: AbstractMesh): boolean => {
      if (!mesh.isEnabled() || !mesh.isVisible) return false;
      const name = mesh.name;
      return name.startsWith("bld_") || name.startsWith("shell_") || name.startsWith("parapet_");
    };
  }

  public get position(): Readonly<Vector3> {
    return this._position;
  }

  public get velocity(): Readonly<Vector3> {
    return this._velocity;
  }

  public get state(): PlayerMovementState {
    return this._currentState;
  }

  public get isGrounded(): boolean {
    return this._isGrounded;
  }

  public get character(): PlayerCharacter {
    return this._character;
  }

  public getRuntimeState(): PlayerRuntimeState {
    const horizontalSpeed = Math.hypot(this._velocity.x, this._velocity.z);
    return {
      state: this._currentState,
      speed: horizontalSpeed,
      isGrounded: this._isGrounded,
      timeInState: this._timeInState,
    };
  }

  /**
   * Teleports player directly to coordinate (e.g. for spawn points or reset).
   */
  public setPosition(pos: Vector3): void {
    this._position.copyFrom(pos);
    this._velocity.set(0, 0, 0);
    this._character.rootNode.position.copyFrom(pos);
  }

  /**
   * Main per-frame locomotion update.
   */
  public update(deltaTime: number, input: InputState, cameraYaw: number): void {
    const dt = Math.min(deltaTime, 0.1); // Clamp to prevent tunneling during lag spikes
    this._timeInState += dt;

    // 1. Calculate camera-relative desired movement vector
    const camSin = Math.sin(cameraYaw);
    const camCos = Math.cos(cameraYaw);

    // Forward on XZ plane: (sin(yaw), 0, cos(yaw))
    // Right on XZ plane:   (cos(yaw), 0, -sin(yaw))
    let desiredDirX = camCos * input.moveX + camSin * input.moveY;
    let desiredDirZ = -camSin * input.moveX + camCos * input.moveY;

    const inputMag = Math.hypot(desiredDirX, desiredDirZ);
    if (inputMag > 1.0) {
      desiredDirX /= inputMag;
      desiredDirZ /= inputMag;
    }

    // 2. Determine target horizontal speed
    let targetSpeed = 0;
    if (inputMag > 0.05) {
      if (input.sprint) {
        targetSpeed = this._config.sprintSpeed;
      } else if (inputMag > 0.6) {
        targetSpeed = this._config.runSpeed;
      } else {
        targetSpeed = this._config.walkSpeed;
      }
    }

    this._scratchTargetVel.set(desiredDirX * targetSpeed, 0, desiredDirZ * targetSpeed);

    // 3. Accelerate or decelerate horizontal velocity
    const accelRate = targetSpeed > 0 ? this._config.acceleration : this._config.deceleration;
    const maxSpeedDelta = accelRate * dt;

    const diffX = this._scratchTargetVel.x - this._velocity.x;
    const diffZ = this._scratchTargetVel.z - this._velocity.z;
    const diffLen = Math.hypot(diffX, diffZ);

    if (diffLen > 0.001) {
      const step = Math.min(diffLen, maxSpeedDelta);
      this._velocity.x += (diffX / diffLen) * step;
      this._velocity.z += (diffZ / diffLen) * step;
    } else {
      this._velocity.x = this._scratchTargetVel.x;
      this._velocity.z = this._scratchTargetVel.z;
    }

    // 4. Vertical Dynamics: Jump & Gravity
    if (this._isGrounded) {
      if (input.jump && this._landTimer <= 0) {
        this._velocity.y = this._config.jumpVelocity;
        this._isGrounded = false;
        this.transitionToState(PlayerMovementState.JUMP);
      } else {
        this._velocity.y = 0;
      }
    } else {
      // In air: apply gravity
      this._velocity.y -= this._config.gravity * dt;
      // Cap terminal fall speed
      if (this._velocity.y < -22.0) {
        this._velocity.y = -22.0;
      }
    }

    // 5. Horizontal Displacement with Obstacle Collision & Wall Sliding
    this._scratchDisp.set(this._velocity.x * dt, 0, this._velocity.z * dt);
    const dispLen = Math.hypot(this._scratchDisp.x, this._scratchDisp.z);

    if (dispLen > 0.0001) {
      // Cast horizontal collision probe from waist height (Y + 0.85m)
      const rayOrigin = this._forwardRay.origin;
      rayOrigin.set(this._position.x, this._position.y + 0.85, this._position.z);

      const rayDir = this._forwardRay.direction;
      rayDir.set(this._scratchDisp.x / dispLen, 0, this._scratchDisp.z / dispLen);
      this._forwardRay.length = dispLen + this._config.characterRadius;

      const hit = this._scene.pickWithRay(this._forwardRay, this._isObstacleMesh, true);
      if (hit && hit.hit && hit.pickedPoint) {
        const hitDistance = hit.distance;
        const availableDist = Math.max(0, hitDistance - this._config.characterRadius);

        // Move up to obstacle boundary
        if (dispLen > 0) {
          const ratio = availableDist / dispLen;
          this._scratchDisp.x *= ratio;
          this._scratchDisp.z *= ratio;
        }

        // Project remaining velocity along obstacle tangent (wall slide)
        const normal = hit.getNormal(true, true);
        if (normal) {
          const dot = this._velocity.x * normal.x + this._velocity.z * normal.z;
          if (dot < 0) {
            this._velocity.x -= normal.x * dot;
            this._velocity.z -= normal.z * dot;
          }
        }
      }

      this._position.x += this._scratchDisp.x;
      this._position.z += this._scratchDisp.z;
    }

    // 6. Ground Detection, Step-Up (Curbs), and Slope Validation
    // Cast ray downward from waist height (Y + stepUpHeight + 0.1)
    const downOrigin = this._downRay.origin;
    downOrigin.set(
      this._position.x,
      this._position.y + this._config.stepUpHeight + 0.1,
      this._position.z
    );
    this._downRay.length = this._config.stepUpHeight + 0.1 + 0.45; // Depth buffer to check support

    const groundHit = this._scene.pickWithRay(this._downRay, this._isWalkableGroundMesh, true);

    if (groundHit && groundHit.hit && groundHit.pickedPoint) {
      const surfaceY = groundHit.pickedPoint.y;
      const normal = groundHit.getNormal(true, true);
      const isSlopeWalkable =
        normal && normal.y >= Math.cos(this._config.maxWalkableSlopeAngle); // 30 deg slope threshold

      // If falling downward or currently grounded on walkable surface
      if (isSlopeWalkable && (this._velocity.y <= 0 || this._isGrounded)) {
        const heightDiff = surfaceY - this._position.y;

        // Smooth step-up over curbs (up to stepUpHeight) or downward step
        if (heightDiff <= this._config.stepUpHeight && heightDiff >= -0.35) {
          this._position.y = surfaceY;
          this._velocity.y = 0;

          if (!this._isGrounded) {
            // Just landed
            this._isGrounded = true;
            this._landTimer = 0.12; // Short land cushion
            this.transitionToState(PlayerMovementState.LAND);
          }
        } else if (heightDiff < -0.35) {
          // Stepped off a high ledge into the air
          this._position.y += this._velocity.y * dt;
          this._isGrounded = false;
        }
      } else {
        // Unsupported or steep surface
        this._position.y += this._velocity.y * dt;
        this._isGrounded = false;
      }
    } else {
      // In the air (no ground hit within ray range)
      this._position.y += this._velocity.y * dt;
      this._isGrounded = false;
    }

    // Safety ground plane floor clamping (never drop beneath Y = -0.05 foundation)
    if (this._position.y < 0.0) {
      this._position.y = 0.0;
      this._velocity.y = 0;
      this._isGrounded = true;
    }

    // 7. Update Mesh World Position
    this._character.rootNode.position.copyFrom(this._position);

    // 8. Rotate Visual Mesh toward Movement Heading
    const horizontalSpeed = Math.hypot(this._velocity.x, this._velocity.z);
    if (horizontalSpeed > 0.15) {
      const targetAngle = Math.atan2(this._velocity.x, this._velocity.z);
      const currentAngle = this._character.visualNode.rotation.y;

      // Wrap angle difference to [-PI, PI] for shortest rotation arc
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const maxTurn = this._config.turnSpeed * dt;
      const turnStep = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
      this._character.visualNode.rotation.y = currentAngle + turnStep;
    }

    // 9. State Machine Transitions
    this.updateStateMachine(dt, horizontalSpeed);

    // 10. Update Procedural Character Animation
    this._character.updateAnimation(this._currentState, horizontalSpeed, dt);
  }

  private updateStateMachine(dt: number, speed: number): void {
    if (this._landTimer > 0) {
      this._landTimer -= dt;
      if (this._landTimer <= 0 && this._isGrounded) {
        this.transitionToState(speed > 0.1 ? PlayerMovementState.WALK : PlayerMovementState.IDLE);
      }
      return;
    }

    if (!this._isGrounded) {
      if (this._velocity.y > 0.5) {
        this.transitionToState(PlayerMovementState.JUMP);
      } else {
        this.transitionToState(PlayerMovementState.FALL);
      }
      return;
    }

    // Grounded states
    if (speed < 0.15) {
      this.transitionToState(PlayerMovementState.IDLE);
    } else if (speed > this._config.runSpeed + 0.5) {
      this.transitionToState(PlayerMovementState.SPRINT);
    } else if (speed > this._config.walkSpeed + 0.4) {
      this.transitionToState(PlayerMovementState.RUN);
    } else {
      this.transitionToState(PlayerMovementState.WALK);
    }
  }

  private transitionToState(newState: PlayerMovementState): void {
    if (this._currentState !== newState) {
      this._currentState = newState;
      this._timeInState = 0;
    }
  }

  public dispose(): void {
    this._character.dispose();
  }
}

import { Scene } from "@babylonjs/core/scene";
import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Ray } from "@babylonjs/core/Culling/ray";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { InputState } from "../input/InputTypes";
import { CameraConfig, DEFAULT_CAMERA_CONFIG } from "./CameraConfig";

/**
 * Dedicated third-person spring-arm follow camera controller.
 * Features:
 * - Spherical coordinate orbit modulated by mouse, touch, and gamepad look inputs
 * - Wall obstruction raycast preventing geometry clipping
 * - Rapid collision pull-in and smooth distance recovery
 * - Pitch clamping and decoupled character-follow damping
 * - Zero in-loop garbage collection allocations
 */
export class ThirdPersonCamera {
  private readonly _scene: Scene;
  private readonly _camera: TargetCamera;
  private readonly _config: CameraConfig;

  // Spherical coordinates
  private _yaw = 0; // Alpha: 0 is facing north (+Z)
  private _pitch = 0.28; // Beta: ~16 degrees elevated
  private _currentDistance: number;

  // Pre-allocated vectors to eliminate runtime allocations
  private readonly _anchor = new Vector3();
  private readonly _desiredPos = new Vector3();
  private readonly _cameraDir = new Vector3();
  private readonly _lookTarget = new Vector3();
  private readonly _probeRay: Ray = new Ray(new Vector3(), new Vector3(), 1.0);

  // Obstacle collision predicate (detects building facades, parapets, and solid obstacles)
  private readonly _isObstacleMesh: (mesh: AbstractMesh) => boolean;

  constructor(scene: Scene, config: Partial<CameraConfig> = {}) {
    this._scene = scene;
    this._config = { ...DEFAULT_CAMERA_CONFIG, ...config };
    this._currentDistance = this._config.defaultDistance;

    // Instantiate Babylon TargetCamera
    this._camera = new TargetCamera("playerThirdPersonCamera", new Vector3(0, 3, -5), this._scene);
    this._camera.fov = this._config.fov;
    this._camera.minZ = 0.15; // Small near clipping plane
    this._camera.maxZ = 250.0;

    this._isObstacleMesh = (mesh: AbstractMesh): boolean => {
      if (!mesh.isEnabled() || !mesh.isVisible) return false;
      const name = mesh.name;
      return name.startsWith("bld_") || name.startsWith("shell_") || name.startsWith("parapet_");
    };
  }

  public get camera(): TargetCamera {
    return this._camera;
  }

  public get yaw(): number {
    return this._yaw;
  }

  public get pitch(): number {
    return this._pitch;
  }

  public get currentDistance(): number {
    return this._currentDistance;
  }

  /**
   * Snaps camera directly behind character (useful at scene init).
   */
  public resetToAnchor(playerPos: Vector3, initialYaw = 0, initialPitch = 0.28): void {
    this._yaw = initialYaw;
    this._pitch = initialPitch;
    this._currentDistance = this._config.defaultDistance;

    this._anchor.set(playerPos.x, playerPos.y + this._config.anchorHeight, playerPos.z);

    const cosPitch = Math.cos(this._pitch);
    const sinPitch = Math.sin(this._pitch);
    const sinYaw = Math.sin(this._yaw);
    const cosYaw = Math.cos(this._yaw);

    this._cameraDir.set(-sinYaw * cosPitch, sinPitch, -cosYaw * cosPitch);
    this._desiredPos.set(
      this._anchor.x + this._cameraDir.x * this._currentDistance,
      this._anchor.y + this._cameraDir.y * this._currentDistance,
      this._anchor.z + this._cameraDir.z * this._currentDistance
    );

    this._camera.position.copyFrom(this._desiredPos);
    this._camera.setTarget(this._anchor);
  }

  /**
   * Updates camera orbit, follow tracking, and collision obstruction.
   */
  public update(deltaTime: number, playerPos: Readonly<Vector3>, input: InputState): void {
    const dt = Math.min(deltaTime, 0.1);

    // 1. Modulate spherical orbit from look input
    this._yaw += input.lookX;
    this._pitch = Math.max(
      this._config.minPitch,
      Math.min(this._config.maxPitch, this._pitch - input.lookY)
    );

    // Keep yaw normalized between [-PI, PI]
    while (this._yaw > Math.PI) this._yaw -= Math.PI * 2;
    while (this._yaw < -Math.PI) this._yaw += Math.PI * 2;

    // 2. Character anchor point (focus height)
    this._anchor.set(playerPos.x, playerPos.y + this._config.anchorHeight, playerPos.z);

    // 3. Spherical direction vector from anchor back toward camera
    const cosPitch = Math.cos(this._pitch);
    const sinPitch = Math.sin(this._pitch);
    const sinYaw = Math.sin(this._yaw);
    const cosYaw = Math.cos(this._yaw);

    this._cameraDir.set(-sinYaw * cosPitch, sinPitch, -cosYaw * cosPitch);

    // 4. Spring-arm Obstruction Probe Raycast
    const rayOrigin = this._probeRay.origin;
    rayOrigin.copyFrom(this._anchor);

    const rayDir = this._probeRay.direction;
    rayDir.copyFrom(this._cameraDir);
    this._probeRay.length = this._config.defaultDistance;

    const hit = this._scene.pickWithRay(this._probeRay, this._isObstacleMesh, true);
    let targetDist = this._config.defaultDistance;

    if (hit && hit.hit && hit.distance > 0) {
      // Geometry obstruction detected: shorten spring arm
      targetDist = Math.max(this._config.minDistance, hit.distance - this._config.collisionCushion);

      // Fast pull-in when blocked to avoid even a single frame of wall clipping
      if (targetDist < this._currentDistance) {
        this._currentDistance = targetDist;
      } else {
        const blend = Math.min(1.0, dt * this._config.distanceRecoverySpeed);
        this._currentDistance += (targetDist - this._currentDistance) * blend;
      }
    } else {
      // No obstruction: smoothly recover toward default follow distance
      const blend = Math.min(1.0, dt * this._config.distanceRecoverySpeed);
      this._currentDistance += (this._config.defaultDistance - this._currentDistance) * blend;
    }

    // 5. Compute target camera position
    this._desiredPos.set(
      this._anchor.x + this._cameraDir.x * this._currentDistance,
      this._anchor.y + this._cameraDir.y * this._currentDistance,
      this._anchor.z + this._cameraDir.z * this._currentDistance
    );

    // 6. Smooth camera translation follow
    const posBlend = Math.min(1.0, dt * this._config.positionDamping);
    this._camera.position.x += (this._desiredPos.x - this._camera.position.x) * posBlend;
    this._camera.position.y += (this._desiredPos.y - this._camera.position.y) * posBlend;
    this._camera.position.z += (this._desiredPos.z - this._camera.position.z) * posBlend;

    // 7. Look target smoothing
    this._lookTarget.x += (this._anchor.x - this._lookTarget.x) * posBlend;
    this._lookTarget.y += (this._anchor.y - this._lookTarget.y) * posBlend;
    this._lookTarget.z += (this._anchor.z - this._lookTarget.z) * posBlend;

    this._camera.setTarget(this._lookTarget);
  }

  public dispose(): void {
    this._camera.dispose();
  }
}

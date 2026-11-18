import { Scene } from "@babylonjs/core/scene";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { EnvironmentManager } from "../environment/EnvironmentManager";
import { InputService } from "../input/InputService";
import { PlayerCharacter } from "../player/PlayerCharacter";
import { PlayerController } from "../player/PlayerController";
import { ThirdPersonCamera } from "../camera/ThirdPersonCamera";

export interface CitySceneResult {
  scene: Scene;
  camera: ThirdPersonCamera;
  environment: EnvironmentManager;
  player: PlayerController;
  input: InputService;
}

/**
 * Creates and initializes the Phase 3 Controllable City Scene:
 * - Natural sunny daylight lighting (Directional sun + Hemispheric fill)
 * - Modular urban block (Roads, Sidewalks, Buildings, Instanced Props, 30° Test Ramp)
 * - Controllable 3D Player Character prototype with kinematic locomotion and curb step-up
 * - Dedicated Third-Person Spring-Arm Follow Camera with wall obstruction detection
 * - Unified Input Service supporting Keyboard/Mouse, Gamepad, and Mobile Touch virtual controls
 */
export function createCityScene(
  engine: AbstractEngine,
  canvas: HTMLCanvasElement,
  appContainer: HTMLElement
): CitySceneResult {
  const scene = new Scene(engine);

  // Atmospheric coastal daylight clear color
  scene.clearColor = new Color4(0.62, 0.76, 0.92, 1.0);

  // 1. Natural Daylight Setup (Balanced intensities to preserve PBR contrast)
  const ambientLight = new HemisphericLight(
    "ambientDaylight",
    new Vector3(0, 1, 0),
    scene
  );
  ambientLight.diffuse = new Color3(0.76, 0.84, 0.96);
  ambientLight.groundColor = new Color3(0.22, 0.20, 0.18);
  ambientLight.intensity = 0.50;

  const sunLight = new DirectionalLight(
    "sunLight",
    new Vector3(-0.65, -0.85, -0.45).normalize(),
    scene
  );
  sunLight.diffuse = new Color3(1.0, 0.95, 0.86);
  sunLight.specular = new Color3(0.35, 0.35, 0.35);
  sunLight.intensity = 1.05;

  // 2. Assemble Modular City Environment (Roads, Sidewalks, Curbs, Buildings, Thin Props, 30° Ramp)
  const environment = new EnvironmentManager(scene);

  // 3. Initialize Unified Input Service
  const input = new InputService(canvas, appContainer);

  // 4. Spawn Player Character Prototype (Avenue roadway facing North down the avenue canyon)
  const spawnPosition = new Vector3(0, 0, -10.0);
  const character = new PlayerCharacter(scene);
  const player = new PlayerController(scene, character, spawnPosition);

  // 5. Initialize Dedicated Third-Person Follow Camera
  const camera = new ThirdPersonCamera(scene, {
    defaultDistance: 4.2,
    minDistance: 0.7,
    anchorHeight: 1.45,
  });
  camera.resetToAnchor(player.position, 0, 0.28);
  scene.activeCamera = camera.camera;

  return {
    scene,
    camera,
    environment,
    player,
    input,
  };
}

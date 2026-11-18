import { Scene } from "@babylonjs/core/scene";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { EnvironmentManager } from "../environment/EnvironmentManager";

export interface CitySceneResult {
  scene: Scene;
  camera: ArcRotateCamera;
  environment: EnvironmentManager;
}

/**
 * Creates and initializes the Phase 2 Modular City Block scene:
 * - Natural sunny daylight lighting (Directional sun + Hemispheric sky/ground fill)
 * - User-controllable ArcRotateCamera for 360-degree environment inspection
 * - Modular urban block (Roads, Sidewalks, Buildings, Instanced Props)
 */
export function createCityScene(
  engine: AbstractEngine,
  canvas: HTMLCanvasElement
): CitySceneResult {
  const scene = new Scene(engine);

  // Atmospheric coastal daylight clear color
  scene.clearColor = new Color4(0.62, 0.76, 0.92, 1.0);

  // 1. Diagnostic Orbit Camera (Framed looking down the avenue to display roads, buildings, and street props)
  const camera = new ArcRotateCamera(
    "cityInspectionCamera",
    -Math.PI / 2.35, // Diagonal avenue perspective
    Math.PI / 3.6, // Elevated cinematic downward pitch angle
    58.0, // Framing entire urban street canyon
    new Vector3(0, 3.5, 0), // Focus on the street canyon center
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5.0;
  camera.upperRadiusLimit = 130.0;
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = Math.PI / 2.05; // Prevent dipping beneath ground plane
  camera.wheelPrecision = 20;
  camera.pinchPrecision = 30;

  // 2. Natural Daylight Setup (Balanced intensities to preserve PBR contrast and prevent white blowout)
  // Sky & Ground Hemispheric Fill
  const ambientLight = new HemisphericLight(
    "ambientDaylight",
    new Vector3(0, 1, 0),
    scene
  );
  ambientLight.diffuse = new Color3(0.76, 0.84, 0.96);
  ambientLight.groundColor = new Color3(0.22, 0.20, 0.18);
  ambientLight.intensity = 0.50;

  // Directional Sun Light
  const sunLight = new DirectionalLight(
    "sunLight",
    new Vector3(-0.65, -0.85, -0.45).normalize(),
    scene
  );
  sunLight.diffuse = new Color3(1.0, 0.95, 0.86);
  sunLight.specular = new Color3(0.35, 0.35, 0.35);
  sunLight.intensity = 1.05;

  // 3. Assemble Modular City Environment
  const environment = new EnvironmentManager(scene);

  return {
    scene,
    camera,
    environment,
  };
}

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export interface TestSceneResult {
  scene: Scene;
  camera: ArcRotateCamera;
}

/**
 * Constructs a minimal, lightweight 3D test environment demonstrating
 * clear geometric depth, PBR-like standard lighting, and responsive camera controls.
 * Avoids heavy assets, download overhead, or expensive shadow filters.
 */
export function createTestScene(
  engine: AbstractEngine,
  canvas: HTMLCanvasElement
): TestSceneResult {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.06, 0.08, 0.14, 1.0);

  // 1. Camera: Responsive third-person orbit view
  const camera = new ArcRotateCamera(
    "orbitCamera",
    -Math.PI / 3.2,
    Math.PI / 3.0,
    16.0,
    new Vector3(0, 1.2, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5.0;
  camera.upperRadiusLimit = 40.0;
  camera.upperBetaLimit = Math.PI / 2.05; // Prevent camera going below ground
  camera.inertia = 0.85;
  camera.wheelPrecision = 20.0;

  // 2. Lighting: Dual-source setup (ambient fill + directional sun)
  const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.65;
  hemiLight.diffuse = new Color3(0.9, 0.95, 1.0);
  hemiLight.groundColor = new Color3(0.12, 0.14, 0.20);

  const dirLight = new DirectionalLight("sunLight", new Vector3(-1, -2, -1), scene);
  dirLight.intensity = 0.75;
  dirLight.diffuse = new Color3(1.0, 0.96, 0.88);

  // 3. Materials (Lightweight StandardMaterials with specular response)
  const groundMat = new StandardMaterial("mat_ground", scene);
  groundMat.diffuseColor = new Color3(0.15, 0.18, 0.25);
  groundMat.specularColor = new Color3(0.05, 0.05, 0.08);

  const cyanMat = new StandardMaterial("mat_cyan", scene);
  cyanMat.diffuseColor = new Color3(0.06, 0.72, 0.95);
  cyanMat.specularColor = new Color3(0.3, 0.3, 0.3);

  const amberMat = new StandardMaterial("mat_amber", scene);
  amberMat.diffuseColor = new Color3(0.95, 0.62, 0.12);
  amberMat.specularColor = new Color3(0.2, 0.2, 0.2);

  const roseMat = new StandardMaterial("mat_rose", scene);
  roseMat.diffuseColor = new Color3(0.92, 0.28, 0.45);
  roseMat.specularColor = new Color3(0.25, 0.25, 0.25);

  const emeraldMat = new StandardMaterial("mat_emerald", scene);
  emeraldMat.diffuseColor = new Color3(0.16, 0.78, 0.52);
  emeraldMat.specularColor = new Color3(0.2, 0.2, 0.2);

  // 4. Geometry Primitives
  // Ground grid plane
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 24, height: 24, subdivisions: 2 },
    scene
  );
  ground.material = groundMat;
  ground.isPickable = false;

  // Central Hero Cube (demonstrating active transform rendering)
  const heroCube = MeshBuilder.CreateBox("heroCube", { size: 2.0 }, scene);
  heroCube.position.set(0, 1.2, 0);
  heroCube.material = cyanMat;

  // Peripheral primitives demonstrating geometric form
  const cylinder = MeshBuilder.CreateCylinder(
    "accentCylinder",
    { height: 2.6, diameter: 1.2, tessellation: 24 },
    scene
  );
  cylinder.position.set(-4.0, 1.3, 2.0);
  cylinder.material = amberMat;

  const sphere = MeshBuilder.CreateSphere(
    "accentSphere",
    { diameter: 2.0, segments: 16 },
    scene
  );
  sphere.position.set(4.0, 1.0, -1.5);
  sphere.material = roseMat;

  const pillar = MeshBuilder.CreateBox(
    "accentPillar",
    { width: 1.0, height: 4.0, depth: 1.0 },
    scene
  );
  pillar.position.set(0, 2.0, 4.5);
  pillar.material = emeraldMat;

  // 5. Continuous animation observable (zero allocations in loop)
  const ROTATION_SPEED = 0.015;
  scene.onBeforeRenderObservable.add(() => {
    heroCube.rotation.y += ROTATION_SPEED;
    heroCube.rotation.x += ROTATION_SPEED * 0.5;
  });

  return { scene, camera };
}

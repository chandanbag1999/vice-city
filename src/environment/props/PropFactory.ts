import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Matrix, Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { MaterialLibrary } from "../materials/MaterialLibrary";
import { PropInstance } from "../types";
import {
  STREET_LAMP_INSTANCES,
  TREE_INSTANCES,
  BENCH_INSTANCES,
  TRASH_BIN_INSTANCES,
  TRAFFIC_SIGN_INSTANCES,
  PLANTER_INSTANCES,
} from "./propLayout";

/**
 * Creates modular urban street props utilizing Babylon.js Thin Instances.
 * Repeated props share base geometry and render in a minimal number of GPU draw calls.
 */
export class PropFactory {
  private readonly _scene: Scene;
  private readonly _materials: MaterialLibrary;
  private readonly _root: TransformNode;

  constructor(scene: Scene, materials: MaterialLibrary) {
    this._scene = scene;
    this._materials = materials;
    this._root = new TransformNode("props_root", this._scene);

    this.buildStreetLamps();
    this.buildTrees();
    this.buildBenches();
    this.buildTrashBins();
    this.buildTrafficSigns();
    this.buildPlanters();
  }

  public get root(): TransformNode {
    return this._root;
  }

  private applyThinInstances(mesh: Mesh, instances: PropInstance[]): void {
    const count = instances.length;
    if (count === 0) return;

    const buffer = new Float32Array(count * 16);
    for (let i = 0; i < count; i++) {
      const inst = instances[i]!;
      const scale = inst.scale ?? 1.0;
      const mat = Matrix.Compose(
        new Vector3(scale, scale, scale),
        Quaternion.RotationYawPitchRoll(inst.rotationY ?? 0, 0, 0),
        inst.position
      );
      mat.copyToArray(buffer, i * 16);
    }

    mesh.thinInstanceSetBuffer("matrix", buffer, 16, true);
    mesh.thinInstanceRefreshBoundingInfo();
  }

  /**
   * Street Lamps:
   * - Slender steel post with curved horizontal arm and lantern cap (metalDark)
   * - Emissive warm glow lens (lampGlow)
   */
  private buildStreetLamps(): void {
    // 1. Steel Post & Arm Assembly
    const basePlate = MeshBuilder.CreateBox(
      "lamp_base",
      { width: 0.35, height: 0.05, depth: 0.35 },
      this._scene
    );
    basePlate.position.set(0, 0.025, 0);

    const post = MeshBuilder.CreateCylinder(
      "lamp_post",
      { height: 4.2, diameterTop: 0.08, diameterBottom: 0.14, tessellation: 12 },
      this._scene
    );
    post.position.set(0, 2.1, 0);

    const horizontalArm = MeshBuilder.CreateCylinder(
      "lamp_arm",
      { height: 1.4, diameter: 0.07, tessellation: 10 },
      this._scene
    );
    horizontalArm.rotation.z = Math.PI / 2;
    horizontalArm.position.set(0.7, 4.15, 0);

    const lanternCap = MeshBuilder.CreateCylinder(
      "lamp_cap",
      { height: 0.22, diameterTop: 0.15, diameterBottom: 0.45, tessellation: 12 },
      this._scene
    );
    lanternCap.position.set(1.4, 4.05, 0);

    const mergedPost = Mesh.MergeMeshes(
      [basePlate, post, horizontalArm, lanternCap],
      true,
      true,
      undefined,
      false,
      false
    );

    if (mergedPost) {
      mergedPost.name = "prop_street_lamp_metal";
      mergedPost.material = this._materials.get("metalDark");
      mergedPost.parent = this._root;
      this.applyThinInstances(mergedPost, STREET_LAMP_INSTANCES);
    }

    // 2. Emissive Glow Lens under Lantern
    const lens = MeshBuilder.CreateCylinder(
      "prop_street_lamp_glow",
      { height: 0.08, diameter: 0.36, tessellation: 12 },
      this._scene
    );
    lens.position.set(1.4, 3.92, 0);
    lens.material = this._materials.get("lampGlow");
    lens.parent = this._root;
    this.applyThinInstances(lens, STREET_LAMP_INSTANCES);
  }

  /**
   * Urban Trees:
   * - Octagonal concrete planter base
   * - Cedar trunk
   * - Lush 3-tier stylized foliage canopy
   */
  private buildTrees(): void {
    // 1. Octagonal Concrete Planter
    const planter = MeshBuilder.CreateCylinder(
      "prop_tree_planter",
      { height: 0.45, diameter: 1.6, tessellation: 8 },
      this._scene
    );
    planter.position.set(0, 0.225, 0);
    planter.material = this._materials.get("concrete");
    planter.parent = this._root;
    this.applyThinInstances(planter, TREE_INSTANCES);

    // 2. Soil Bedding + Tree Trunk
    const soil = MeshBuilder.CreateCylinder(
      "tree_soil",
      { height: 0.08, diameter: 1.45, tessellation: 8 },
      this._scene
    );
    soil.position.set(0, 0.44, 0);

    const trunk = MeshBuilder.CreateCylinder(
      "tree_trunk",
      { height: 2.5, diameterTop: 0.18, diameterBottom: 0.26, tessellation: 10 },
      this._scene
    );
    trunk.position.set(0, 1.6, 0);

    const mergedTrunk = Mesh.MergeMeshes([soil, trunk], true, true, undefined, false, false);
    if (mergedTrunk) {
      mergedTrunk.name = "prop_tree_trunk";
      mergedTrunk.material = this._materials.get("treeBark");
      mergedTrunk.parent = this._root;
      this.applyThinInstances(mergedTrunk, TREE_INSTANCES);
    }

    // 3. Foliage Canopy (Merged sphere clusters)
    const lowerCanopy = MeshBuilder.CreateSphere(
      "canopy_low",
      { diameterX: 2.8, diameterY: 1.6, diameterZ: 2.8, segments: 10 },
      this._scene
    );
    lowerCanopy.position.set(0, 2.7, 0);

    const midCanopy = MeshBuilder.CreateSphere(
      "canopy_mid",
      { diameterX: 2.2, diameterY: 1.6, diameterZ: 2.2, segments: 10 },
      this._scene
    );
    midCanopy.position.set(0, 3.4, 0);

    const topCanopy = MeshBuilder.CreateSphere(
      "canopy_top",
      { diameterX: 1.5, diameterY: 1.3, diameterZ: 1.5, segments: 8 },
      this._scene
    );
    topCanopy.position.set(0, 4.0, 0);

    const mergedCanopy = Mesh.MergeMeshes(
      [lowerCanopy, midCanopy, topCanopy],
      true,
      true,
      undefined,
      false,
      false
    );
    if (mergedCanopy) {
      mergedCanopy.name = "prop_tree_canopy";
      mergedCanopy.material = this._materials.get("foliage");
      mergedCanopy.parent = this._root;
      this.applyThinInstances(mergedCanopy, TREE_INSTANCES);
    }
  }

  /**
   * Park Benches:
   * - Cast iron side frames (metalDark)
   * - Teak wooden seating slats (woodBench)
   */
  private buildBenches(): void {
    // 1. Cast Iron Frame
    const legLeft = MeshBuilder.CreateBox("leg_l", { width: 0.08, height: 0.5, depth: 0.6 }, this._scene);
    legLeft.position.set(-0.8, 0.25, 0);

    const legRight = MeshBuilder.CreateBox("leg_r", { width: 0.08, height: 0.5, depth: 0.6 }, this._scene);
    legRight.position.set(0.8, 0.25, 0);

    const backLeft = MeshBuilder.CreateBox("back_l", { width: 0.06, height: 0.5, depth: 0.06 }, this._scene);
    backLeft.position.set(-0.8, 0.65, -0.27);

    const backRight = MeshBuilder.CreateBox("back_r", { width: 0.06, height: 0.5, depth: 0.06 }, this._scene);
    backRight.position.set(0.8, 0.65, -0.27);

    const mergedFrame = Mesh.MergeMeshes(
      [legLeft, legRight, backLeft, backRight],
      true,
      true,
      undefined,
      false,
      false
    );
    if (mergedFrame) {
      mergedFrame.name = "prop_bench_frame";
      mergedFrame.material = this._materials.get("metalDark");
      mergedFrame.parent = this._root;
      this.applyThinInstances(mergedFrame, BENCH_INSTANCES);
    }

    // 2. Wooden Slats
    const slats: Mesh[] = [];
    // Seat slats (3 horizontal boards)
    for (let i = 0; i < 3; i++) {
      const slat = MeshBuilder.CreateBox(
        `seat_slat_${i}`,
        { width: 1.8, height: 0.04, depth: 0.14 },
        this._scene
      );
      slat.position.set(0, 0.48, -0.18 + i * 0.16);
      slats.push(slat);
    }
    // Backrest slats (2 boards)
    for (let i = 0; i < 2; i++) {
      const slat = MeshBuilder.CreateBox(
        `back_slat_${i}`,
        { width: 1.8, height: 0.14, depth: 0.04 },
        this._scene
      );
      slat.position.set(0, 0.62 + i * 0.18, -0.28);
      slats.push(slat);
    }

    const mergedWood = Mesh.MergeMeshes(slats, true, true, undefined, false, false);
    if (mergedWood) {
      mergedWood.name = "prop_bench_wood";
      mergedWood.material = this._materials.get("woodBench");
      mergedWood.parent = this._root;
      this.applyThinInstances(mergedWood, BENCH_INSTANCES);
    }
  }

  /**
   * Street Trash Bins:
   * - Cylindrical metal container with hooded top
   */
  private buildTrashBins(): void {
    const body = MeshBuilder.CreateCylinder(
      "bin_body",
      { height: 0.8, diameter: 0.45, tessellation: 12 },
      this._scene
    );
    body.position.set(0, 0.4, 0);

    const lid = MeshBuilder.CreateSphere(
      "bin_lid",
      { diameter: 0.46, segments: 8, slice: 0.5 },
      this._scene
    );
    lid.position.set(0, 0.8, 0);

    const mergedBin = Mesh.MergeMeshes([body, lid], true, true, undefined, false, false);
    if (mergedBin) {
      mergedBin.name = "prop_trash_bin";
      mergedBin.material = this._materials.get("metalDark");
      mergedBin.parent = this._root;
      this.applyThinInstances(mergedBin, TRASH_BIN_INSTANCES);
    }
  }

  /**
   * Traffic Signs:
   * - Metal post
   * - Octagonal sign plate (signRed)
   */
  private buildTrafficSigns(): void {
    const post = MeshBuilder.CreateCylinder(
      "prop_sign_post",
      { height: 2.6, diameter: 0.06, tessellation: 8 },
      this._scene
    );
    post.position.set(0, 1.3, 0);
    post.material = this._materials.get("metalDark");
    post.parent = this._root;
    this.applyThinInstances(post, TRAFFIC_SIGN_INSTANCES);

    const signPlate = MeshBuilder.CreateCylinder(
      "prop_sign_plate",
      { height: 0.03, diameter: 0.65, tessellation: 8 },
      this._scene
    );
    signPlate.rotation.x = Math.PI / 2;
    signPlate.position.set(0, 2.3, 0.04);
    signPlate.material = this._materials.get("signRed");
    signPlate.parent = this._root;
    this.applyThinInstances(signPlate, TRAFFIC_SIGN_INSTANCES);
  }

  /**
   * Roadside Planters:
   * - Rectangular stone planter trough
   * - Sculpted shrub foliage
   */
  private buildPlanters(): void {
    const box = MeshBuilder.CreateBox(
      "prop_planter_box",
      { width: 1.8, height: 0.45, depth: 0.7 },
      this._scene
    );
    box.position.set(0, 0.225, 0);
    box.material = this._materials.get("curb");
    box.parent = this._root;
    this.applyThinInstances(box, PLANTER_INSTANCES);

    const shrub = MeshBuilder.CreateBox(
      "prop_planter_shrub",
      { width: 1.6, height: 0.35, depth: 0.55 },
      this._scene
    );
    shrub.position.set(0, 0.55, 0);
    shrub.material = this._materials.get("foliageDark");
    shrub.parent = this._root;
    this.applyThinInstances(shrub, PLANTER_INSTANCES);
  }

  public dispose(): void {
    this._root.dispose(false, true);
  }
}

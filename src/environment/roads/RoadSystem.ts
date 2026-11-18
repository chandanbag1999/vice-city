import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MaterialLibrary } from "../materials/MaterialLibrary";

/**
 * Constructs the modular road infrastructure:
 * - Main 2-lane avenue (72m length, 9m width)
 * - T-intersection side street (8m width, 20m depth)
 * - Elevated sidewalks and curbs (Y = 0.18m)
 * - Road lane markings (dashed centerlines, solid borders, zebra crosswalks, stop lines)
 */
export class RoadSystem {
  private readonly _scene: Scene;
  private readonly _materials: MaterialLibrary;
  private readonly _root: TransformNode;

  constructor(scene: Scene, materials: MaterialLibrary) {
    this._scene = scene;
    this._materials = materials;
    this._root = new TransformNode("roads_root", this._scene);

    this.buildGroundBase();
    this.buildRoads();
    this.buildCurbsAndSidewalks();
    this.buildMarkings();
    this.buildTestRamp();
  }

  public get root(): TransformNode {
    return this._root;
  }

  /**
   * Wide ground foundation plane beneath the urban block.
   */
  private buildGroundBase(): void {
    const ground = MeshBuilder.CreateGround(
      "ground_sub_base",
      { width: 90, height: 90 },
      this._scene
    );
    ground.position.y = -0.05;
    ground.material = this._materials.get("concrete");
    ground.parent = this._root;
  }

  /**
   * Main avenue and intersecting side street asphalt surfaces.
   */
  private buildRoads(): void {
    // Main Avenue (runs along Z: -36 to +36, width 9m: -4.5 to +4.5)
    const mainAvenue = MeshBuilder.CreateGround(
      "road_main_avenue",
      { width: 9, height: 72 },
      this._scene
    );
    mainAvenue.position.set(0, 0, 0);
    mainAvenue.material = this._materials.get("asphalt");
    mainAvenue.parent = this._root;

    // Side Street (branches East: X from 4.5 to 24.5, Z from 4 to 12)
    const sideStreet = MeshBuilder.CreateGround(
      "road_side_street",
      { width: 20, height: 8 },
      this._scene
    );
    sideStreet.position.set(14.5, 0, 8);
    sideStreet.material = this._materials.get("asphalt");
    sideStreet.parent = this._root;
  }

  /**
   * Raised concrete curbs and sidewalk paving (Y = 0.18m).
   */
  private buildCurbsAndSidewalks(): void {
    const curbMat = this._materials.get("curb");
    const sidewalkMat = this._materials.get("sidewalk");

    // --- West Sidewalk (X: -8.5 to -4.5, Z: -36 to +36) ---
    // Sidewalk slab (width 4.0m, height 0.18m, length 72m)
    const westSidewalk = MeshBuilder.CreateBox(
      "sidewalk_west",
      { width: 4.0, height: 0.18, depth: 72 },
      this._scene
    );
    westSidewalk.position.set(-6.5, 0.09, 0);
    westSidewalk.material = sidewalkMat;
    westSidewalk.parent = this._root;

    // West Curb bevel line along road edge
    const westCurb = MeshBuilder.CreateBox(
      "curb_west",
      { width: 0.2, height: 0.2, depth: 72 },
      this._scene
    );
    westCurb.position.set(-4.6, 0.1, 0);
    westCurb.material = curbMat;
    westCurb.parent = this._root;

    // --- East Sidewalk South Section (Z: -36 to 4) ---
    const eastSidewalkSouth = MeshBuilder.CreateBox(
      "sidewalk_east_south",
      { width: 4.0, height: 0.18, depth: 40 },
      this._scene
    );
    eastSidewalkSouth.position.set(6.5, 0.09, -16);
    eastSidewalkSouth.material = sidewalkMat;
    eastSidewalkSouth.parent = this._root;

    const eastCurbSouth = MeshBuilder.CreateBox(
      "curb_east_south",
      { width: 0.2, height: 0.2, depth: 40 },
      this._scene
    );
    eastCurbSouth.position.set(4.6, 0.1, -16);
    eastCurbSouth.material = curbMat;
    eastCurbSouth.parent = this._root;

    // --- East Sidewalk North Section (Z: 12 to 36) ---
    const eastSidewalkNorth = MeshBuilder.CreateBox(
      "sidewalk_east_north",
      { width: 4.0, height: 0.18, depth: 24 },
      this._scene
    );
    eastSidewalkNorth.position.set(6.5, 0.09, 24);
    eastSidewalkNorth.material = sidewalkMat;
    eastSidewalkNorth.parent = this._root;

    const eastCurbNorth = MeshBuilder.CreateBox(
      "curb_east_north",
      { width: 0.2, height: 0.2, depth: 24 },
      this._scene
    );
    eastCurbNorth.position.set(4.6, 0.1, 24);
    eastCurbNorth.material = curbMat;
    eastCurbNorth.parent = this._root;

    // --- Side Street Sidewalks (South and North of side street) ---
    // South side street sidewalk (X: 8.5 to 24.5, Z: 0.5 to 4.0)
    const sideStreetSidewalkSouth = MeshBuilder.CreateBox(
      "sidewalk_side_south",
      { width: 16.0, height: 0.18, depth: 3.5 },
      this._scene
    );
    sideStreetSidewalkSouth.position.set(16.5, 0.09, 2.25);
    sideStreetSidewalkSouth.material = sidewalkMat;
    sideStreetSidewalkSouth.parent = this._root;

    const sideStreetCurbSouth = MeshBuilder.CreateBox(
      "curb_side_south",
      { width: 16.0, height: 0.2, depth: 0.2 },
      this._scene
    );
    sideStreetCurbSouth.position.set(16.5, 0.1, 4.1);
    sideStreetCurbSouth.material = curbMat;
    sideStreetCurbSouth.parent = this._root;

    // North side street sidewalk (X: 8.5 to 24.5, Z: 12.0 to 15.5)
    const sideStreetSidewalkNorth = MeshBuilder.CreateBox(
      "sidewalk_side_north",
      { width: 16.0, height: 0.18, depth: 3.5 },
      this._scene
    );
    sideStreetSidewalkNorth.position.set(16.5, 0.09, 13.75);
    sideStreetSidewalkNorth.material = sidewalkMat;
    sideStreetSidewalkNorth.parent = this._root;

    const sideStreetCurbNorth = MeshBuilder.CreateBox(
      "curb_side_north",
      { width: 16.0, height: 0.2, depth: 0.2 },
      this._scene
    );
    sideStreetCurbNorth.position.set(16.5, 0.1, 11.9);
    sideStreetCurbNorth.material = curbMat;
    sideStreetCurbNorth.parent = this._root;
  }

  /**
   * Road surface markings:
   * - Dashed highway yellow centerline
   * - Solid white lane boundaries
   * - Zebra pedestrian crossings with stop lines
   */
  private buildMarkings(): void {
    const whiteMat = this._materials.get("roadMarkingWhite");
    const yellowMat = this._materials.get("roadMarkingYellow");
    const yMarking = 0.005; // Slightly elevated to prevent z-fighting

    const markingMeshesWhite: Mesh[] = [];
    const markingMeshesYellow: Mesh[] = [];

    // --- 1. Yellow Dashed Centerline (Avenue) ---
    // South segment (Z: -34 to 1)
    for (let z = -34; z <= 0; z += 4) {
      const dash = MeshBuilder.CreatePlane(
        `dash_south_${z}`,
        { width: 0.16, height: 2.2 },
        this._scene
      );
      dash.rotation.x = Math.PI / 2;
      dash.position.set(0, yMarking, z + 1.1);
      markingMeshesYellow.push(dash);
    }

    // North segment (Z: 15 to 34)
    for (let z = 15; z <= 33; z += 4) {
      const dash = MeshBuilder.CreatePlane(
        `dash_north_${z}`,
        { width: 0.16, height: 2.2 },
        this._scene
      );
      dash.rotation.x = Math.PI / 2;
      dash.position.set(0, yMarking, z + 1.1);
      markingMeshesYellow.push(dash);
    }

    // --- 2. Side Street Centerline (X: 8 to 23) ---
    for (let x = 8; x <= 22; x += 4) {
      const dash = MeshBuilder.CreatePlane(
        `dash_side_${x}`,
        { width: 2.2, height: 0.16 },
        this._scene
      );
      dash.rotation.x = Math.PI / 2;
      dash.position.set(x + 1.1, yMarking, 8);
      markingMeshesYellow.push(dash);
    }

    // --- 3. Solid White Shoulder Lines (Avenue) ---
    // West shoulder line (X = -4.3, full length Z: -35 to +35)
    const westShoulder = MeshBuilder.CreatePlane(
      "shoulder_west",
      { width: 0.12, height: 70 },
      this._scene
    );
    westShoulder.rotation.x = Math.PI / 2;
    westShoulder.position.set(-4.3, yMarking, 0);
    markingMeshesWhite.push(westShoulder);

    // East shoulder south (X = 4.3, Z: -35 to 2.5)
    const eastShoulderSouth = MeshBuilder.CreatePlane(
      "shoulder_east_south",
      { width: 0.12, height: 37.5 },
      this._scene
    );
    eastShoulderSouth.rotation.x = Math.PI / 2;
    eastShoulderSouth.position.set(4.3, yMarking, -16.25);
    markingMeshesWhite.push(eastShoulderSouth);

    // East shoulder north (X = 4.3, Z: 13.5 to 35)
    const eastShoulderNorth = MeshBuilder.CreatePlane(
      "shoulder_east_north",
      { width: 0.12, height: 21.5 },
      this._scene
    );
    eastShoulderNorth.rotation.x = Math.PI / 2;
    eastShoulderNorth.position.set(4.3, yMarking, 24.25);
    markingMeshesWhite.push(eastShoulderNorth);

    // --- 4. Zebra Pedestrian Crossings ---
    // South Crossing across main avenue at Z = 2.5
    for (let x = -3.8; x <= 3.8; x += 0.85) {
      const stripe = MeshBuilder.CreatePlane(
        `zebra_south_${x.toFixed(1)}`,
        { width: 0.5, height: 2.5 },
        this._scene
      );
      stripe.rotation.x = Math.PI / 2;
      stripe.position.set(x, yMarking, 2.5);
      markingMeshesWhite.push(stripe);
    }

    // North Crossing across main avenue at Z = 13.5
    for (let x = -3.8; x <= 3.8; x += 0.85) {
      const stripe = MeshBuilder.CreatePlane(
        `zebra_north_${x.toFixed(1)}`,
        { width: 0.5, height: 2.5 },
        this._scene
      );
      stripe.rotation.x = Math.PI / 2;
      stripe.position.set(x, yMarking, 13.5);
      markingMeshesWhite.push(stripe);
    }

    // Side Street Crossing at X = 6.0 (across the 8m side street, Z from 4.5 to 11.5)
    for (let z = 4.6; z <= 11.4; z += 0.85) {
      const stripe = MeshBuilder.CreatePlane(
        `zebra_side_${z.toFixed(1)}`,
        { width: 2.4, height: 0.5 },
        this._scene
      );
      stripe.rotation.x = Math.PI / 2;
      stripe.position.set(6.0, yMarking, z);
      markingMeshesWhite.push(stripe);
    }

    // --- 5. Stop Lines ---
    // Stop line before south crosswalk (at Z = 0.8, X: 0 to 4.2)
    const stopLineSouth = MeshBuilder.CreatePlane(
      "stop_south",
      { width: 4.2, height: 0.4 },
      this._scene
    );
    stopLineSouth.rotation.x = Math.PI / 2;
    stopLineSouth.position.set(2.1, yMarking, 0.8);
    markingMeshesWhite.push(stopLineSouth);

    // Stop line before north crosswalk (at Z = 15.2, X: -4.2 to 0)
    const stopLineNorth = MeshBuilder.CreatePlane(
      "stop_north",
      { width: 4.2, height: 0.4 },
      this._scene
    );
    stopLineNorth.rotation.x = Math.PI / 2;
    stopLineNorth.position.set(-2.1, yMarking, 15.2);
    markingMeshesWhite.push(stopLineNorth);

    // Merge markings to drastically optimize draw calls (all white in 1 mesh, all yellow in 1 mesh)
    const mergedWhite = Mesh.MergeMeshes(
      markingMeshesWhite,
      true, // disposeSource
      true, // allow32BitsIndices
      undefined,
      false,
      false
    );
    if (mergedWhite) {
      mergedWhite.name = "road_markings_white_merged";
      mergedWhite.material = whiteMat;
      mergedWhite.parent = this._root;
    }

    const mergedYellow = Mesh.MergeMeshes(
      markingMeshesYellow,
      true,
      true,
      undefined,
      false,
      false
    );
    if (mergedYellow) {
      mergedYellow.name = "road_markings_yellow_merged";
      mergedYellow.material = yellowMat;
      mergedYellow.parent = this._root;
    }
  }

  /**
   * Builds an inclined 30-degree test ramp to empirically test and verify
   * slope locomotion, slope normal detection, and step transitions without physics jitter.
   */
  private buildTestRamp(): void {
    const rampAngle = Math.PI / 6; // Exactly 30 degrees
    const rampLength = 3.6;
    const rampWidth = 3.0;
    const rampThickness = 0.16;

    // Positioned at the eastern terminus of the side street (X ~ 21.05m, Z = 8.0m)
    // Sloping upward toward +X:
    // deltaX = rampLength * cos(30 deg) = 3.6 * 0.866 = 3.118m
    // deltaY = rampLength * sin(30 deg) = 3.6 * 0.500 = 1.80m
    const ramp = MeshBuilder.CreateBox(
      "ramp_slope_30deg",
      { width: rampLength, height: rampThickness, depth: rampWidth },
      this._scene
    );
    ramp.rotation.z = -rampAngle;
    ramp.position.set(21.05, 0.90, 8.0);
    ramp.material = this._materials.get("concrete");
    ramp.parent = this._root;

    // Small elevated landing platform at the top of the ramp (height 1.80m)
    const landing = MeshBuilder.CreateBox(
      "ramp_landing_platform",
      { width: 3.0, height: 1.80, depth: 3.0 },
      this._scene
    );
    landing.position.set(24.1, 0.90, 8.0);
    landing.material = this._materials.get("concrete");
    landing.parent = this._root;
  }

  public dispose(): void {
    this._root.dispose(false, true);
  }
}

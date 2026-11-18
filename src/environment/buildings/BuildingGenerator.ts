import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Material } from "@babylonjs/core/Materials/material";
import { MaterialLibrary } from "../materials/MaterialLibrary";
import { BuildingConfig } from "../types";

/**
 * Procedural generator for modular urban buildings:
 * - Shopfront ground floors with glass display glazing and entrance alcoves
 * - Rhythmic upper window bays with stone sills
 * - Floor dividing cornices and parapet rooftop caps
 * - Rooftop utilities: elevator penthouses, water towers, and HVAC chillers
 *
 * Meshes sharing materials are merged per building to maintain sub-50 total scene draw calls.
 */
export class BuildingGenerator {
  private readonly _scene: Scene;
  private readonly _materials: MaterialLibrary;

  constructor(scene: Scene, materials: MaterialLibrary) {
    this._scene = scene;
    this._materials = materials;
  }

  public generate(config: BuildingConfig, parentRoot: TransformNode): TransformNode {
    const buildingRoot = new TransformNode(`building_${config.id}`, this._scene);
    buildingRoot.position.copyFrom(config.position);
    if (config.rotationY) {
      buildingRoot.rotation.y = config.rotationY;
    }
    buildingRoot.parent = parentRoot;

    // Component arrays for material-based batching
    const facadeMeshes: Mesh[] = [];
    const trimMeshes: Mesh[] = [];
    const glassMeshes: Mesh[] = [];
    const roofMeshes: Mesh[] = [];
    const darkMetalMeshes: Mesh[] = [];
    const awningMeshes: Mesh[] = [];

    const totalHeight = config.stories * config.floorHeight;
    const halfWidth = config.width / 2;
    const halfDepth = config.depth / 2;

    // --- 1. Main Structural Shell ---
    const mainShell = MeshBuilder.CreateBox(
      `shell_${config.id}`,
      { width: config.width, height: totalHeight, depth: config.depth },
      this._scene
    );
    mainShell.position.set(0, totalHeight / 2, 0);
    facadeMeshes.push(mainShell);

    // --- 2. Ground Floor Shopfront Details ---
    if (config.hasShopfront) {
      // Dark shopfront base frame / plinth (height 0.6m)
      const plinth = MeshBuilder.CreateBox(
        `plinth_${config.id}`,
        { width: config.width - 0.4, height: 0.6, depth: 0.2 },
        this._scene
      );
      plinth.position.set(0, 0.3, -halfDepth - 0.08);
      trimMeshes.push(plinth);

      // Large glass display windows
      const displayWidth = (config.width - 3.0) / 2;
      const window1 = MeshBuilder.CreatePlane(
        `shop_win1_${config.id}`,
        { width: displayWidth, height: 2.4 },
        this._scene
      );
      window1.position.set(-displayWidth / 2 - 0.8, 1.8, -halfDepth - 0.1);
      glassMeshes.push(window1);

      const window2 = MeshBuilder.CreatePlane(
        `shop_win2_${config.id}`,
        { width: displayWidth, height: 2.4 },
        this._scene
      );
      window2.position.set(displayWidth / 2 + 0.8, 1.8, -halfDepth - 0.1);
      glassMeshes.push(window2);

      // Recessed Central Shop Entrance Door
      const entranceDoor = MeshBuilder.CreatePlane(
        `shop_door_${config.id}`,
        { width: 1.4, height: 2.4 },
        this._scene
      );
      entranceDoor.position.set(0, 1.8, -halfDepth - 0.1);
      glassMeshes.push(entranceDoor);

      // Signboard / Fascia beam above shopfront
      const fascia = MeshBuilder.CreateBox(
        `fascia_${config.id}`,
        { width: config.width - 0.2, height: 0.6, depth: 0.25 },
        this._scene
      );
      fascia.position.set(0, config.floorHeight - 0.2, -halfDepth - 0.12);
      trimMeshes.push(fascia);

      // Optional colorful fabric awning
      if (config.hasAwning) {
        const awning = MeshBuilder.CreateBox(
          `awning_${config.id}`,
          { width: config.width - 1.0, height: 0.35, depth: 1.6 },
          this._scene
        );
        awning.rotation.x = 0.25;
        awning.position.set(0, config.floorHeight - 0.4, -halfDepth - 0.8);
        awningMeshes.push(awning);
      }
    }

    // --- 3. Upper Floors Window Arrays & Cornices ---
    for (let floor = 1; floor < config.stories; floor++) {
      const floorBaseY = floor * config.floorHeight;

      // Floor dividing horizontal cornice band
      const cornice = MeshBuilder.CreateBox(
        `cornice_${config.id}_f${floor}`,
        { width: config.width + 0.3, height: 0.22, depth: config.depth + 0.3 },
        this._scene
      );
      cornice.position.set(0, floorBaseY, 0);
      trimMeshes.push(cornice);

      // Window Bays along front facade (-Z)
      const numWindows = Math.max(2, Math.floor(config.width / 2.6));
      const spacing = (config.width - 1.6) / numWindows;
      const startX = -((numWindows - 1) * spacing) / 2;

      for (let w = 0; w < numWindows; w++) {
        const winX = startX + w * spacing;
        const winY = floorBaseY + config.floorHeight * 0.52;

        // Glass pane
        const winPane = MeshBuilder.CreatePlane(
          `win_pane_${config.id}_f${floor}_${w}`,
          { width: 1.1, height: 1.7 },
          this._scene
        );
        winPane.position.set(winX, winY, -halfDepth - 0.05);
        glassMeshes.push(winPane);

        // Window sill
        const sill = MeshBuilder.CreateBox(
          `win_sill_${config.id}_f${floor}_${w}`,
          { width: 1.3, height: 0.12, depth: 0.25 },
          this._scene
        );
        sill.position.set(winX, winY - 0.9, -halfDepth - 0.1);
        trimMeshes.push(sill);

        // Window header / lintel
        const lintel = MeshBuilder.CreateBox(
          `win_lintel_${config.id}_f${floor}_${w}`,
          { width: 1.3, height: 0.15, depth: 0.18 },
          this._scene
        );
        lintel.position.set(winX, winY + 0.9, -halfDepth - 0.08);
        trimMeshes.push(lintel);
      }

      // Optional Balcony on central floor
      if (config.hasBalconies && floor === Math.floor(config.stories / 2)) {
        const balconyFloor = MeshBuilder.CreateBox(
          `balcony_floor_${config.id}`,
          { width: config.width - 2.0, height: 0.18, depth: 1.2 },
          this._scene
        );
        balconyFloor.position.set(0, floorBaseY + 0.1, -halfDepth - 0.6);
        trimMeshes.push(balconyFloor);

        const railing = MeshBuilder.CreateBox(
          `balcony_rail_${config.id}`,
          { width: config.width - 2.0, height: 0.85, depth: 0.08 },
          this._scene
        );
        railing.position.set(0, floorBaseY + 0.55, -halfDepth - 1.15);
        darkMetalMeshes.push(railing);
      }
    }

    // --- 4. Rooftop Parapet & Surface ---
    // Dark roof tar surface
    const roofSurface = MeshBuilder.CreateGround(
      `roof_surface_${config.id}`,
      { width: config.width - 0.4, height: config.depth - 0.4 },
      this._scene
    );
    roofSurface.position.set(0, totalHeight + 0.02, 0);
    roofMeshes.push(roofSurface);

    // Parapet walls surrounding the roof
    const parapetHeight = 0.8;
    const parapetThick = 0.25;

    // Front/Back parapets
    const parapetFront = MeshBuilder.CreateBox(
      `parapet_f_${config.id}`,
      { width: config.width, height: parapetHeight, depth: parapetThick },
      this._scene
    );
    parapetFront.position.set(0, totalHeight + parapetHeight / 2, -halfDepth + parapetThick / 2);
    facadeMeshes.push(parapetFront);

    const parapetBack = MeshBuilder.CreateBox(
      `parapet_b_${config.id}`,
      { width: config.width, height: parapetHeight, depth: parapetThick },
      this._scene
    );
    parapetBack.position.set(0, totalHeight + parapetHeight / 2, halfDepth - parapetThick / 2);
    facadeMeshes.push(parapetBack);

    // Left/Right parapets
    const parapetLeft = MeshBuilder.CreateBox(
      `parapet_l_${config.id}`,
      { width: parapetThick, height: parapetHeight, depth: config.depth },
      this._scene
    );
    parapetLeft.position.set(-halfWidth + parapetThick / 2, totalHeight + parapetHeight / 2, 0);
    facadeMeshes.push(parapetLeft);

    const parapetRight = MeshBuilder.CreateBox(
      `parapet_r_${config.id}`,
      { width: parapetThick, height: parapetHeight, depth: config.depth },
      this._scene
    );
    parapetRight.position.set(halfWidth - parapetThick / 2, totalHeight + parapetHeight / 2, 0);
    facadeMeshes.push(parapetRight);

    // Parapet top decorative stone coping cornice
    const coping = MeshBuilder.CreateBox(
      `coping_${config.id}`,
      { width: config.width + 0.2, height: 0.12, depth: config.depth + 0.2 },
      this._scene
    );
    coping.position.set(0, totalHeight + parapetHeight + 0.06, 0);
    trimMeshes.push(coping);

    // --- 5. Rooftop Infrastructure (Water towers, HVAC, Elevator Penthouses) ---
    if (config.rooftopStyle === "water-tower") {
      this.buildWaterTower(config, totalHeight, trimMeshes, darkMetalMeshes);
      this.buildHvacUnit(config, totalHeight, new Vector3(2.5, 0, 2), trimMeshes, darkMetalMeshes);
    } else if (config.rooftopStyle === "penthouse-hvac") {
      this.buildElevatorPenthouse(config, totalHeight, facadeMeshes, trimMeshes, darkMetalMeshes);
      this.buildHvacUnit(config, totalHeight, new Vector3(3.0, 0, -2.0), trimMeshes, darkMetalMeshes);
      this.buildHvacUnit(config, totalHeight, new Vector3(-3.0, 0, 2.0), trimMeshes, darkMetalMeshes);
    } else if (config.rooftopStyle === "hvac-cluster") {
      this.buildHvacUnit(config, totalHeight, new Vector3(-2.0, 0, -1.5), trimMeshes, darkMetalMeshes);
      this.buildHvacUnit(config, totalHeight, new Vector3(2.0, 0, 1.5), trimMeshes, darkMetalMeshes);
    }

    // --- 6. Batch & Merge Meshes per Material for Maximum GPU Performance ---
    this.mergeMeshList(facadeMeshes, `bld_${config.id}_facade`, this._materials.get(config.facadeMaterialKey), buildingRoot);
    this.mergeMeshList(trimMeshes, `bld_${config.id}_trim`, this._materials.get(config.trimMaterialKey), buildingRoot);
    this.mergeMeshList(glassMeshes, `bld_${config.id}_glass`, this._materials.get("glass"), buildingRoot);
    this.mergeMeshList(roofMeshes, `bld_${config.id}_roof`, this._materials.get("roofTar"), buildingRoot);
    this.mergeMeshList(darkMetalMeshes, `bld_${config.id}_metal`, this._materials.get("metalDark"), buildingRoot);
    if (awningMeshes.length > 0) {
      this.mergeMeshList(awningMeshes, `bld_${config.id}_awning`, this._materials.get("awningCoral"), buildingRoot);
    }

    return buildingRoot;
  }

  private buildWaterTower(
    config: BuildingConfig,
    baseHeight: number,
    trimMeshes: Mesh[],
    metalMeshes: Mesh[]
  ): void {
    const towerY = baseHeight + 0.1;
    // 4 steel support legs
    const legPositions = [
      new Vector3(-1.0, 1.2, -1.0),
      new Vector3(1.0, 1.2, -1.0),
      new Vector3(-1.0, 1.2, 1.0),
      new Vector3(1.0, 1.2, 1.0),
    ];

    for (let i = 0; i < legPositions.length; i++) {
      const leg = MeshBuilder.CreateCylinder(
        `wt_leg_${config.id}_${i}`,
        { height: 2.4, diameter: 0.12 },
        this._scene
      );
      leg.position.set(legPositions[i]!.x, towerY + legPositions[i]!.y, legPositions[i]!.z);
      metalMeshes.push(leg);
    }

    // Cylindrical cedar water tank
    const tank = MeshBuilder.CreateCylinder(
      `wt_tank_${config.id}`,
      { height: 2.2, diameter: 2.5, tessellation: 16 },
      this._scene
    );
    tank.position.set(0, towerY + 3.5, 0);
    trimMeshes.push(tank);

    // Conical tank roof
    const coneRoof = MeshBuilder.CreateCylinder(
      `wt_cone_${config.id}`,
      { height: 0.9, diameterTop: 0, diameterBottom: 2.7, tessellation: 16 },
      this._scene
    );
    coneRoof.position.set(0, towerY + 5.0, 0);
    metalMeshes.push(coneRoof);
  }

  private buildElevatorPenthouse(
    config: BuildingConfig,
    baseHeight: number,
    facadeMeshes: Mesh[],
    trimMeshes: Mesh[],
    metalMeshes: Mesh[]
  ): void {
    const penthouse = MeshBuilder.CreateBox(
      `penthouse_${config.id}`,
      { width: 3.5, height: 2.6, depth: 3.5 },
      this._scene
    );
    penthouse.position.set(0, baseHeight + 1.3, 0);
    facadeMeshes.push(penthouse);

    const door = MeshBuilder.CreatePlane(
      `penthouse_door_${config.id}`,
      { width: 1.0, height: 2.0 },
      this._scene
    );
    door.position.set(0, baseHeight + 1.0, -1.76);
    metalMeshes.push(door);

    const roofCap = MeshBuilder.CreateBox(
      `penthouse_cap_${config.id}`,
      { width: 3.8, height: 0.15, depth: 3.8 },
      this._scene
    );
    roofCap.position.set(0, baseHeight + 2.65, 0);
    trimMeshes.push(roofCap);
  }

  private buildHvacUnit(
    config: BuildingConfig,
    baseHeight: number,
    offset: Vector3,
    trimMeshes: Mesh[],
    metalMeshes: Mesh[]
  ): void {
    const hvacBox = MeshBuilder.CreateBox(
      `hvac_box_${config.id}_${offset.x}`,
      { width: 1.6, height: 1.1, depth: 1.2 },
      this._scene
    );
    hvacBox.position.set(offset.x, baseHeight + 0.55, offset.z);
    metalMeshes.push(hvacBox);

    // Fan exhaust cylinder on top
    const fan = MeshBuilder.CreateCylinder(
      `hvac_fan_${config.id}_${offset.x}`,
      { height: 0.15, diameter: 0.8, tessellation: 12 },
      this._scene
    );
    fan.position.set(offset.x, baseHeight + 1.15, offset.z);
    trimMeshes.push(fan);
  }

  private mergeMeshList(
    meshes: Mesh[],
    mergedName: string,
    material: Material | null,
    parentRoot: TransformNode
  ): void {
    if (meshes.length === 0) return;

    if (meshes.length === 1) {
      const single = meshes[0]!;
      single.name = mergedName;
      single.material = material;
      single.parent = parentRoot;
      return;
    }

    const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
    if (merged) {
      merged.name = mergedName;
      merged.material = material;
      merged.parent = parentRoot;
    }
  }
}

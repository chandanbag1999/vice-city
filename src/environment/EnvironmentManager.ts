import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MaterialLibrary } from "./materials/MaterialLibrary";
import { RoadSystem } from "./roads/RoadSystem";
import { BuildingGenerator } from "./buildings/BuildingGenerator";
import { CITY_BUILDING_PRESETS } from "./buildings/buildingPresets";
import { PropFactory } from "./props/PropFactory";

/**
 * Top-level coordinator for the Phase 2 modular urban environment prototype.
 * Assembles roads, sidewalks, buildings, and instanced street props with explicit lifecycle management.
 */
export class EnvironmentManager {
  private readonly _scene: Scene;
  private readonly _root: TransformNode;
  private readonly _materials: MaterialLibrary;
  private readonly _roads: RoadSystem;
  private readonly _buildingGenerator: BuildingGenerator;
  private readonly _buildingsRoot: TransformNode;
  private readonly _props: PropFactory;

  constructor(scene: Scene) {
    this._scene = scene;
    this._root = new TransformNode("city_environment_root", this._scene);

    // 1. Shared PBR Material Library
    this._materials = new MaterialLibrary(this._scene);

    // 2. Road System (Avenue, T-Intersection, Sidewalks, Curbs, Markings)
    this._roads = new RoadSystem(this._scene, this._materials);
    this._roads.root.parent = this._root;

    // 3. Modular Buildings
    this._buildingsRoot = new TransformNode("buildings_root", this._scene);
    this._buildingsRoot.parent = this._root;
    this._buildingGenerator = new BuildingGenerator(this._scene, this._materials);

    for (const preset of CITY_BUILDING_PRESETS) {
      this._buildingGenerator.generate(preset, this._buildingsRoot);
    }

    // 4. Street Props (Thin Instanced)
    this._props = new PropFactory(this._scene, this._materials);
    this._props.root.parent = this._root;

    console.info(
      `[EnvironmentManager] Modular city block assembled: 1 Road System, ${CITY_BUILDING_PRESETS.length} Buildings, Thin-Instanced Props.`
    );
  }

  public get root(): TransformNode {
    return this._root;
  }

  public get materials(): MaterialLibrary {
    return this._materials;
  }

  public dispose(): void {
    console.info("[EnvironmentManager] Disposing modular city block environment...");
    this._props.dispose();
    this._roads.dispose();
    this._buildingsRoot.dispose(false, true);
    this._root.dispose(false, true);
    this._materials.dispose();
  }
}

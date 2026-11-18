import { Scene } from "@babylonjs/core/scene";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

/**
 * Centralized, shared PBR Material Library for the modular urban environment.
 * Ensures strict material reuse across buildings, roads, and props with zero duplicate shaders.
 */
export class MaterialLibrary {
  private readonly _scene: Scene;
  private readonly _materials: Map<string, PBRMaterial> = new Map();

  constructor(scene: Scene) {
    this._scene = scene;
    this.createAllMaterials();
  }

  private createPbr(
    name: string,
    albedoHex: string,
    roughness: number,
    metallic: number,
    emissiveHex?: string,
    emissiveIntensity = 0
  ): PBRMaterial {
    const mat = new PBRMaterial(`mat_${name}`, this._scene);
    mat.albedoColor = Color3.FromHexString(albedoHex);
    mat.roughness = roughness;
    mat.metallic = metallic;

    if (emissiveHex && emissiveIntensity > 0) {
      mat.emissiveColor = Color3.FromHexString(emissiveHex);
      mat.emissiveIntensity = emissiveIntensity;
    }

    this._materials.set(name, mat);
    return mat;
  }

  private createAllMaterials(): void {
    // 1. Road & Ground Infrastructure (Tuned for balanced contrast and zero specular blowout)
    this.createPbr("asphalt", "#1e2023", 0.90, 0.05);
    this.createPbr("concrete", "#9c998e", 0.82, 0.02);
    this.createPbr("sidewalk", "#b5b1a4", 0.76, 0.02);
    this.createPbr("curb", "#726f66", 0.80, 0.05);
    this.createPbr("roadMarkingWhite", "#e8edf2", 0.45, 0.0);
    this.createPbr("roadMarkingYellow", "#e6a800", 0.45, 0.0);

    // 2. Building Facades
    this.createPbr("plasterWarm", "#d4c7ad", 0.75, 0.0);
    this.createPbr("brickTerracotta", "#964b36", 0.85, 0.0);
    this.createPbr("modernConcrete", "#7c828a", 0.68, 0.02);
    this.createPbr("coastalMint", "#86ad9f", 0.65, 0.0);
    this.createPbr("facadeSandstone", "#c7b897", 0.80, 0.0);

    // 3. Architectural Trim & Details
    this.createPbr("trimStone", "#cac4b7", 0.70, 0.0);
    this.createPbr("trimDark", "#202225", 0.50, 0.15);
    this.createPbr("shopfrontWood", "#3b2616", 0.55, 0.05);
    this.createPbr("awningCoral", "#c4462e", 0.65, 0.0);
    this.createPbr("awningCream", "#ded9cc", 0.65, 0.0);
    this.createPbr("roofTar", "#222325", 0.92, 0.02);

    // 4. Glazing & Glass (Opaque high-reflectivity avoids mobile alpha-depth sorting overhead)
    this.createPbr("glass", "#151e28", 0.08, 0.35);
    this.createPbr("glassStorefront", "#1a2533", 0.06, 0.40);

    // 5. Metals
    this.createPbr("metalDark", "#1f2124", 0.35, 0.85);
    this.createPbr("metalChrome", "#bcc2c9", 0.18, 0.95);
    this.createPbr("metalGalvanized", "#6f7780", 0.45, 0.70);
    this.createPbr("metalCopper", "#965a3c", 0.35, 0.80);

    // 6. Street Props & Vegetation
    this.createPbr("woodBench", "#7d4f24", 0.60, 0.0);
    this.createPbr("treeBark", "#3f2e21", 0.88, 0.0);
    this.createPbr("foliage", "#255428", 0.78, 0.0);
    this.createPbr("foliageDark", "#1a3b1d", 0.78, 0.0);
    this.createPbr("planterSoil", "#2e2318", 0.95, 0.0);

    // 7. Signs & Emissive
    this.createPbr("lampGlow", "#fff2cc", 0.25, 0.1, "#ffe38f", 2.0);
    this.createPbr("signRed", "#b52020", 0.45, 0.1);
    this.createPbr("signBlue", "#185491", 0.45, 0.1);
    this.createPbr("signYellow", "#d99d00", 0.45, 0.1);
  }

  public get(name: string): PBRMaterial {
    const mat = this._materials.get(name);
    if (!mat) {
      console.warn(`[MaterialLibrary] Material '${name}' not found. Falling back to 'concrete'.`);
      return this._materials.get("concrete")!;
    }
    return mat;
  }

  public dispose(): void {
    for (const mat of this._materials.values()) {
      mat.dispose();
    }
    this._materials.clear();
  }
}

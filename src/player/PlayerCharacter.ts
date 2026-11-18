import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PlayerMovementState } from "./PlayerState";

/**
 * Procedural stylized 3D character placeholder model (100% Original IP):
 * - Hierarchical transform structure: root -> visual -> torso/head/limbs
 * - Distinct forward indicator (sunglasses/visor at +Z)
 * - Lightweight procedural limb swing animation during walk/run/jump
 * - Fully modular and cleanly replaceable by future GLB skeletal models
 */
export class PlayerCharacter {
  private readonly _scene: Scene;
  private readonly _rootNode: TransformNode;
  private readonly _visualNode: TransformNode;

  // Limb pivot nodes for procedural animation
  private readonly _leftArmPivot: TransformNode;
  private readonly _rightArmPivot: TransformNode;
  private readonly _leftLegPivot: TransformNode;
  private readonly _rightLegPivot: TransformNode;

  // Meshes & Materials for disposal
  private readonly _meshes: Mesh[] = [];
  private readonly _materials: PBRMaterial[] = [];

  private _walkCycle = 0;

  constructor(scene: Scene) {
    this._scene = scene;

    // 1. Root transform node positioned at character feet in world space
    this._rootNode = new TransformNode("player_root", this._scene);

    // 2. Visual container rotating to face movement heading
    this._visualNode = new TransformNode("player_visual", this._scene);
    this._visualNode.parent = this._rootNode;

    // 3. Shared PBR materials for the stylized character
    const shirtMat = this.createMaterial("char_shirt", "#1e968a", 0.65, 0.05); // Retro teal Cuban shirt
    const pantsMat = this.createMaterial("char_pants", "#232b38", 0.75, 0.05); // Charcoal trousers
    const skinMat = this.createMaterial("char_skin", "#d9a584", 0.70, 0.0); // Warm skin tone
    const hairMat = this.createMaterial("char_hair", "#2b221a", 0.80, 0.0); // Dark brown hair
    const visorMat = this.createMaterial("char_visor", "#111417", 0.15, 0.90); // Dark sunglasses
    const shoeMat = this.createMaterial("char_shoes", "#e2e8f0", 0.50, 0.1); // White sneakers

    // 4. Torso / Upper Body (Center at Y = 1.15m)
    const torso = MeshBuilder.CreateBox(
      "char_torso",
      { width: 0.50, height: 0.60, depth: 0.28 },
      this._scene
    );
    torso.position.set(0, 1.15, 0);
    torso.material = shirtMat;
    torso.parent = this._visualNode;
    this._meshes.push(torso);

    // 5. Hips / Pelvis (Center at Y = 0.82m)
    const hips = MeshBuilder.CreateBox(
      "char_hips",
      { width: 0.44, height: 0.22, depth: 0.26 },
      this._scene
    );
    hips.position.set(0, 0.82, 0);
    hips.material = pantsMat;
    hips.parent = this._visualNode;
    this._meshes.push(hips);

    // 6. Neck & Head (Neck Y = 1.48m, Head Y = 1.62m)
    const neck = MeshBuilder.CreateCylinder(
      "char_neck",
      { height: 0.12, diameter: 0.16, tessellation: 10 },
      this._scene
    );
    neck.position.set(0, 1.48, 0);
    neck.material = skinMat;
    neck.parent = this._visualNode;
    this._meshes.push(neck);

    const head = MeshBuilder.CreateBox(
      "char_head",
      { width: 0.28, height: 0.30, depth: 0.28 },
      this._scene
    );
    head.position.set(0, 1.66, 0);
    head.material = skinMat;
    head.parent = this._visualNode;
    this._meshes.push(head);

    // Hair Top
    const hair = MeshBuilder.CreateBox(
      "char_hair",
      { width: 0.30, height: 0.12, depth: 0.30 },
      this._scene
    );
    hair.position.set(0, 1.77, -0.02);
    hair.material = hairMat;
    hair.parent = this._visualNode;
    this._meshes.push(hair);

    // Sunglasses / Visor on Front Face (+Z) - clearly establishes forward heading
    const visor = MeshBuilder.CreateBox(
      "char_visor",
      { width: 0.26, height: 0.08, depth: 0.06 },
      this._scene
    );
    visor.position.set(0, 1.68, 0.14);
    visor.material = visorMat;
    visor.parent = this._visualNode;
    this._meshes.push(visor);

    // 7. Arms with Shoulder Pivots (Y = 1.38m)
    // Left Arm
    this._leftArmPivot = new TransformNode("char_left_arm_pivot", this._scene);
    this._leftArmPivot.position.set(-0.32, 1.40, 0);
    this._leftArmPivot.parent = this._visualNode;

    const leftArm = MeshBuilder.CreateBox(
      "char_left_arm",
      { width: 0.14, height: 0.54, depth: 0.14 },
      this._scene
    );
    leftArm.position.set(0, -0.24, 0);
    leftArm.material = skinMat;
    leftArm.parent = this._leftArmPivot;
    this._meshes.push(leftArm);

    // Right Arm
    this._rightArmPivot = new TransformNode("char_right_arm_pivot", this._scene);
    this._rightArmPivot.position.set(0.32, 1.40, 0);
    this._rightArmPivot.parent = this._visualNode;

    const rightArm = MeshBuilder.CreateBox(
      "char_right_arm",
      { width: 0.14, height: 0.54, depth: 0.14 },
      this._scene
    );
    rightArm.position.set(0, -0.24, 0);
    rightArm.material = skinMat;
    rightArm.parent = this._rightArmPivot;
    this._meshes.push(rightArm);

    // 8. Legs with Hip Pivots (Y = 0.72m)
    // Left Leg
    this._leftLegPivot = new TransformNode("char_left_leg_pivot", this._scene);
    this._leftLegPivot.position.set(-0.14, 0.72, 0);
    this._leftLegPivot.parent = this._visualNode;

    const leftLeg = MeshBuilder.CreateBox(
      "char_left_leg",
      { width: 0.16, height: 0.62, depth: 0.18 },
      this._scene
    );
    leftLeg.position.set(0, -0.31, 0);
    leftLeg.material = pantsMat;
    leftLeg.parent = this._leftLegPivot;
    this._meshes.push(leftLeg);

    const leftShoe = MeshBuilder.CreateBox(
      "char_left_shoe",
      { width: 0.17, height: 0.11, depth: 0.28 },
      this._scene
    );
    leftShoe.position.set(0, -0.66, 0.05);
    leftShoe.material = shoeMat;
    leftShoe.parent = this._leftLegPivot;
    this._meshes.push(leftShoe);

    // Right Leg
    this._rightLegPivot = new TransformNode("char_right_leg_pivot", this._scene);
    this._rightLegPivot.position.set(0.14, 0.72, 0);
    this._rightLegPivot.parent = this._visualNode;

    const rightLeg = MeshBuilder.CreateBox(
      "char_right_leg",
      { width: 0.16, height: 0.62, depth: 0.18 },
      this._scene
    );
    rightLeg.position.set(0, -0.31, 0);
    rightLeg.material = pantsMat;
    rightLeg.parent = this._rightLegPivot;
    this._meshes.push(rightLeg);

    const rightShoe = MeshBuilder.CreateBox(
      "char_right_shoe",
      { width: 0.17, height: 0.11, depth: 0.28 },
      this._scene
    );
    rightShoe.position.set(0, -0.66, 0.05);
    rightShoe.material = shoeMat;
    rightShoe.parent = this._rightLegPivot;
    this._meshes.push(rightShoe);
  }

  private createMaterial(
    name: string,
    albedoHex: string,
    roughness: number,
    metallic: number
  ): PBRMaterial {
    const mat = new PBRMaterial(`mat_${name}`, this._scene);
    mat.albedoColor = Color3.FromHexString(albedoHex);
    mat.roughness = roughness;
    mat.metallic = metallic;
    this._materials.push(mat);
    return mat;
  }

  public get rootNode(): TransformNode {
    return this._rootNode;
  }

  public get visualNode(): TransformNode {
    return this._visualNode;
  }

  /**
   * Updates lightweight procedural limb oscillations based on movement state and speed.
   */
  public updateAnimation(state: PlayerMovementState, speed: number, deltaTime: number): void {
    if (state === PlayerMovementState.WALK || state === PlayerMovementState.RUN || state === PlayerMovementState.SPRINT) {
      // Advance walk cycle proportional to speed
      const cadence = state === PlayerMovementState.SPRINT ? 3.2 : 2.5;
      this._walkCycle += deltaTime * Math.max(1.0, speed) * cadence;

      // Limb oscillation amplitude scales with speed
      const maxArmSwing = state === PlayerMovementState.SPRINT ? 0.75 : 0.50;
      const maxLegSwing = state === PlayerMovementState.SPRINT ? 0.85 : 0.60;

      const armSwing = Math.sin(this._walkCycle) * maxArmSwing;
      const legSwing = Math.sin(this._walkCycle) * maxLegSwing;

      // Arm swings opposite to leg (contra-lateral movement)
      this._leftArmPivot.rotation.x = armSwing;
      this._rightArmPivot.rotation.x = -armSwing;
      this._leftLegPivot.rotation.x = -legSwing;
      this._rightLegPivot.rotation.x = legSwing;
    } else if (state === PlayerMovementState.JUMP || state === PlayerMovementState.FALL) {
      // In-air jump posture: arms raised slightly, legs bent back
      const blend = Math.min(1.0, deltaTime * 10.0);
      this._leftArmPivot.rotation.x += (-0.6 - this._leftArmPivot.rotation.x) * blend;
      this._rightArmPivot.rotation.x += (-0.6 - this._rightArmPivot.rotation.x) * blend;
      this._leftLegPivot.rotation.x += (0.35 - this._leftLegPivot.rotation.x) * blend;
      this._rightLegPivot.rotation.x += (0.35 - this._rightLegPivot.rotation.x) * blend;
    } else {
      // Idle / Land: Smoothly damp limbs back to neutral resting pose
      const blend = Math.min(1.0, deltaTime * 12.0);
      this._leftArmPivot.rotation.x += (0 - this._leftArmPivot.rotation.x) * blend;
      this._rightArmPivot.rotation.x += (0 - this._rightArmPivot.rotation.x) * blend;
      this._leftLegPivot.rotation.x += (0 - this._leftLegPivot.rotation.x) * blend;
      this._rightLegPivot.rotation.x += (0 - this._rightLegPivot.rotation.x) * blend;
    }
  }

  public dispose(): void {
    for (const mesh of this._meshes) {
      mesh.dispose(false, true);
    }
    this._meshes.length = 0;

    for (const mat of this._materials) {
      mat.dispose();
    }
    this._materials.length = 0;

    this._leftArmPivot.dispose();
    this._rightArmPivot.dispose();
    this._leftLegPivot.dispose();
    this._rightLegPivot.dispose();
    this._visualNode.dispose();
    this._rootNode.dispose();
  }
}

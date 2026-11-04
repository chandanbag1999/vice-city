# 3D Asset Pipeline & Standards Specification — Vice-City Engine

> **Document Type:** Asset Creation, Optimization & Pipeline Standard  
> **Status:** `[VERIFIED]` / Project Standard  
> **Repository Location:** `/docs/ASSET_PIPELINE.md`  
> **Tools:** Blender 4.x, glTF 2.0, gltfpack, glTF-Transform, Babylon.js  
> **Last Verified Date:** 2026-11-04  

---

## 1. Asset Creation Philosophy & Originality Guarantee

All 3D assets, textures, rigs, and audio used in the Vice-City engine must adhere strictly to original IP and commercial safety standards:

> [!IMPORTANT]
> **Zero Copyrighted Assets:** Reverse-engineering, extracting, ripping, or importing models, textures, animations, or sounds from commercial games (e.g., *Grand Theft Auto*, *Saints Row*, *Mafia*, etc.) is strictly prohibited. All assets must be authored from scratch or sourced from verified CC0 / commercial-permissive repositories with complete attribution records.

---

## 2. Modeling Standards (Blender 4.x DCC)

### 2.1 Units & Coordinate Orientation
- **System Units:** Metric.
- **Unit Scale:** `1.0` (1 Blender Unit = 1.0 Meter).
- **Coordinate System:**
  - Export orientation: **+Y Up, +Z Forward** (Standard glTF 2.0 coordinate system).
  - Babylon.js natively aligns with glTF coordinate handedness.
- **Pivot / Origin Points:**
  - **Characters & Pedestrians:** Center-bottom between the feet $(0, 0, 0)$.
  - **Vehicles:** Center of mass at ground level directly beneath the chassis center $(0, 0, 0)$.
  - **Modular Buildings & Roads:** Bottom-left or center-bottom snapped to a strict 1-meter or 4-meter grid for modular tile alignment.
  - **Props & Street Furniture:** Center-bottom $(0, 0, 0)$ for easy ground placement.

### 2.2 Transform Normalization
- Before export, all objects in Blender must have transforms applied:
  - `Location: (0, 0, 0)`
  - `Rotation: (0, 0, 0)`
  - `Scale: (1.0, 1.0, 1.0)` (`Ctrl + A` -> Apply All Transforms).

---

## 3. Geometry & Polygon Budgets

To ensure stable 60 FPS performance on the reference Intel Core i3 laptop and mid-tier mobile devices, models must adhere to the following polygon ceilings:

| Asset Category | LOD 0 (Near / Hero) | LOD 1 (Medium, 30–80m) | LOD 2 (Distant, > 80m) |
|---|---|---|---|
| **Player Character** | 8,000 – 12,000 tris | 3,000 – 5,000 tris | 1,000 tris / Impostor |
| **Pedestrian NPC** | 2,500 – 4,000 tris | 1,200 – 2,000 tris | 500 tris |
| **Drivable Vehicle** | 6,000 – 10,000 tris | 2,500 – 4,000 tris | 800 tris |
| **Traffic Vehicle** | 2,500 – 4,000 tris | 1,200 – 2,000 tris | 400 tris |
| **Standard Building Block** | 1,500 – 3,500 tris | 600 – 1,200 tris | 120 tris (Box Impostor) |
| **Street Furniture (Lamps, Bins)** | 200 – 600 tris | 80 – 200 tris | Merged / Culled |
| **Foliage / Palm Trees** | 800 – 1,500 tris | 300 – 600 tris | 50 tris (Crossed Quad) |

---

## 4. Materials & Texture Pipeline

### 4.1 PBR Metallic-Roughness Standard
All assets use the standard Khronos glTF PBR Metallic-Roughness material model:
- **Base Color (Albedo):** sRGB color map.
- **ORM Packed Map (Linear):**
  - **Red Channel:** Occlusion (Ambient Occlusion)
  - **Green Channel:** Roughness
  - **Blue Channel:** Metallic
- **Normal Map:** Tangent space, OpenGL format (+Y Up).

### 4.2 Texture Resolution & VRAM Budgets
Uncompressed textures rapidly consume the 8 GB shared system memory. Maximum texture sizes are capped as follows:

| Asset Type | Albedo Max | ORM Packed Max | Normal Map Max |
|---|---|---|---|
| Hero Vehicles & Player | 1024 × 1024 | 1024 × 1024 | 1024 × 1024 |
| Building Facades (Shared) | 1024 × 1024 | 512 × 512 | 512 × 512 |
| Street Props & Signs | 512 × 512 | 512 × 512 | 256 × 256 |
| Foliage & Small Accents | 512 × 512 | 256 × 256 | Optional |

### 4.3 GPU Texture Compression (KTX2 / Basis Universal)
For production distribution, textures are encoded into **KTX 2.0 (`.ktx2`)** containers via `KHR_texture_basisu`:
- **Albedo / Base Color:** ETC1S (maximum compression) or UASTC (higher color accuracy).
- **Normal Maps & ORM Maps:** UASTC (prevents compression artifacts on vector directions and roughness values).
- Transcoded at runtime by Babylon.js KTX2 decoder directly into hardware-native GPU formats (ASTC for mobile, BC7 for desktop).

---

## 5. Animation & Rigging Standards

### 5.1 Skeletal Rigging
- **Armature Hierarchy:** Single root bone at $(0, 0, 0)$ (`Root` / `Pelvis`).
- **Bone Count Limit:**
  - Player Character: Maximum **48 to 64 bones**.
  - Pedestrians: Maximum **24 to 32 bones**.
- **Vertex Weights:** Maximum 4 bone weights per vertex (enforced by glTF 2.0 standard).

### 5.2 Animation Naming Conventions
Animations must be stored in Blender NLA tracks and exported as separate named actions:
- `char_loco_idle`
- `char_loco_walk`
- `char_loco_run`
- `char_loco_sprint`
- `char_loco_jump_start`
- `char_loco_jump_air`
- `char_loco_jump_land`
- `char_veh_enter_driver`
- `char_veh_exit_driver`
- `char_veh_drive_idle`

---

## 6. Export Settings (Blender glTF 2.0 Exporter)

When exporting models from Blender to the engine:
- **Format:** `glTF Binary (.glb)`
- **Include:** Selected Objects, Custom Properties.
- **Transform:**
  - `+Y Up` enabled.
- **Geometry:**
  - `Apply Modifiers` checked.
  - `UVs` checked.
  - `Normals` checked.
  - `Tangents` checked (required for normal mapping).
- **Animation:**
  - `Group by NLA Track` checked.
  - `Sample Animations` checked.
  - `Optimize Animation Size` checked.

---

## 7. Directory Organization & Asset Structure

Assets are organized inside the `/public/assets` directory:

```text
public/assets/
│
├── characters/
│   ├── player/
│   │   ├── player_hero.glb
│   │   └── textures/
│   └── pedestrians/
│       ├── ped_male_01.glb
│       └── ped_female_01.glb
│
├── vehicles/
│   ├── sports_coupe_01.glb
│   ├── sedan_taxi_01.glb
│   └── pickup_truck_01.glb
│
├── environment/
│   ├── modular_roads/
│   │   ├── road_straight_4lane.glb
│   │   ├── road_intersection_4way.glb
│   │   └── road_curve_90.glb
│   ├── buildings/
│   │   ├── building_office_glass_01.glb
│   │   ├── building_hotel_neon_01.glb
│   │   └── building_residential_01.glb
│   └── props/
│       ├── street_lamp_01.glb
│       ├── palm_tree_01.glb
│       └── traffic_light_01.glb
│
└── audio/
    ├── sfx/
    └── music/
```

---

## 8. Optimization & Post-Processing Pipeline

Before committing assets to production, raw `.glb` files are processed through the `gltfpack` CLI tool:

```bash
# Example optimization command compressing geometry and converting textures to KTX2:
gltfpack -i raw_model.glb -o optimized_model.glb -cc -tc
```

- `-cc`: Meshopt geometry compression (`EXT_meshopt_compression`).
- `-tc`: KTX2 Basis Universal texture compression (`KHR_texture_basisu`).

---

## 9. Asset Validation & CI Quality Gates

Every asset added to the project must pass validation:
1. **glTF Validator:** Run official Khronos `gltf-validator` to ensure zero validation errors or specification violations.
2. **Babylon.js Sandbox Check:** Load asset into Babylon Sandbox ([sandbox.babylonjs.com](https://sandbox.babylonjs.com/)) to inspect draw calls, materials, and animation loops.
3. **Licensing Manifest:** Every external asset must be recorded in an accompanying `ATTRIBUTIONS.md` file detailing the author, license type, and source link.

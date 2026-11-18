# Project Development Roadmap — Vice-City Engine

> **Document Type:** Dependency-Aware Milestone & Engineering Roadmap  
> **Status:** Authoritative Multi-Phase Plan  
> **Current Phase:** Phase 2 Complete / Transitioning to Phase 3 (Player Locomotion & Input Abstraction)  
> **Last Verified Date:** 2026-11-18  

---

## 1. Roadmap Architecture & Dependency Graph

Development progresses strictly through sequential technical verification gates. Downstream phases may not begin until upstream gates have satisfied their completion criteria.

```mermaid
flowchart TD
    P0["Phase 0: Engineering Foundation & Memory System [COMPLETED]"] --> P1["Phase 1: Minimal Rendering & Device Compatibility [COMPLETED]"]
    P1 --> P2["Phase 2: Small Optimized 3D Environment [COMPLETED]"]
    P2 --> P3["Phase 3: Player Movement, Camera & Input Abstraction [NEXT APPROVED]"]
    P3 --> P4["Phase 4: Havok Physics V2 & Interactive Objects"]
    P4 --> P5["Phase 5: Drivable Vehicle Simulation"]
    P5 --> P6["Phase 6: Ambient Traffic & Pedestrian AI"]
    P6 --> P7["Phase 7: Spatial World Streaming & LOD"]
    P7 --> P8["Phase 8: Missions, Interactions & Objectives"]
    P8 --> P9["Phase 9: Atmospheric Graphics & Advanced Optimization"]
    P9 --> P10["Phase 10: Content Polish, Release & Packaging"]
```

---

## 2. Milestone Phase Breakdown

### Phase 0: Project Foundation & Engineering Memory
- **Status:** `[COMPLETED]` (Verified in Task 001)
- **Objective:** Establish the complete architectural baseline, technical research library, project requirements, risk register, and AI operating protocol (`AGENTS.md` & `brain.md`).
- **Prerequisites:** Clean workspace, Git repository initialized.
- **Expected Deliverables:** Root documentation (`AGENTS.md`, `brain.md`, `README.md`) and complete specification suite in `/docs`.
- **Technical Risks:** Contradictory specifications or unverified technical assumptions.
- **Verification Method:** Manual and automated document audit, link integrity checks, git tracking check.
- **Completion Criteria:** All 12 core documents exist, are fully cross-referenced, and contain zero hallucinated implementation claims.

---

### Phase 1: Minimal Browser Rendering & Device Compatibility
- **Status:** `[COMPLETED]` / `[VERIFIED]` (Verified in Task 002 & Task 002.1 Audit)
- **Objective:** Scaffold the TypeScript + Vite build toolchain, integrate Babylon.js, and establish an asynchronous dual-engine bootstrapper (`WebGPUEngine` with automatic WebGL 2 fallback).
- **Prerequisites:** Phase 0 completion.
- **Completed Deliverables:**
  - `package.json` with pinned stable dependencies (`@babylonjs/core` 9.35.0, `typescript` 7.0.2, `vite` 8.3.7) and `pnpm-lock.yaml`.
  - `tsconfig.json` with strict mode enabled (`strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`).
  - `index.html` with responsive fullscreen canvas container and floating telemetry HUD.
  - `styles/main.css` with responsive full-viewport styles and telemetry overlay theme.
  - `src/core/EngineFactory.ts` with asynchronous WebGPU probing, WebGPUEngine init, error handling, explicit partial-failure resource disposal, and WebGL 2 fallback.
  - `src/scene/createTestScene.ts` with 3D ground plane, rotating hero cube, sphere, cylinder, pillar, and dual lights.
  - `src/ui/Telemetry.ts` displaying live backend, instant/rolling average FPS, active meshes, resolution, DPR, and lifecycle status.
  - `src/main.ts` with graphics context loss and restoration lifecycle observers, duplicate render loop prevention, and graceful teardown.
- **Verification Results:**
  - `pnpm install --frozen-lockfile`: 0 changes, clean lockfile.
  - `pnpm exec tsc --noEmit`: 0 errors.
  - `pnpm run build`: Success in 3.73s.
  - Chrome 157 headless CDP runtime test: **WebGPU engine verified running at 60 FPS (54 FPS rolling average, 5 meshes)**.
  - Chrome 157 simulated fallback test (WebGPU unsupported environment): **WebGL 2 engine verified running at 60 FPS (59 FPS rolling average, 5 meshes)**.
- **Completion Criteria:** Met in full for desktop browser rendering; both WebGPU and WebGL 2 backends empirically verified. Physical mobile-device testing remains `[UNVERIFIED]` pending mobile hardware profiling.

---

### Phase 2: Small Optimized 3D Environment (Test District)
- **Status:** `[COMPLETED]` / `[VERIFIED]` (Verified in Task 003)
- **Objective:** Construct and render a modular single-block urban prototype featuring roads, sidewalks, modular buildings, and instanced street furniture.
- **Prerequisites:** Phase 1 completion.
- **Completed Deliverables:**
  - `src/environment/materials/MaterialLibrary.ts`: Centralized, shared PBR material palette (asphalt, concrete, sidewalks, curbs, markings, plaster, terracotta brick, modern concrete, glass, metals, foliage, wood, and emissive lamp glow).
  - `src/environment/roads/RoadSystem.ts`: 72m × 9m main asphalt avenue, 20m × 8m T-intersection side street, elevated concrete sidewalks and curbs (0.18m), dashed highway yellow centerlines, solid white lane borders, zebra pedestrian crosswalks, and stop lines.
  - `src/environment/buildings/BuildingGenerator.ts` & `buildingPresets.ts`: Procedural generation of 7 distinct modular buildings with commercial ground-floor shopfronts, display glazing, fabric awnings, upper floor cornices, window sills, balconies, and rooftop infrastructure (parapets, elevator penthouses, water towers, and HVAC units). Shared materials are batched and merged per building.
  - `src/environment/props/PropFactory.ts` & `propLayout.ts`: 48 urban street props (street lamps with emissive glow lenses, trees in concrete planters, benches, waste bins, traffic signs, and roadside planters) rendered via Babylon.js Thin Instances in only 12 GPU draw calls.
  - `src/environment/EnvironmentManager.ts`: Top-level orchestrator with complete `.dispose()` lifecycle cleanup.
  - `src/scene/createCityScene.ts`: Natural daylight setup (Directional sunlight + Hemispheric sky fill) and 360-degree ArcRotateCamera orbit controls.
- **Technical Risks & Mitigations:** Avoided excessive draw calls via mesh batching and Thin Instances (~45-55 draw calls, 63 active meshes); prevented VRAM exhaustion via procedural PBR materials; verified GLB pipeline deferred to subsequent external DCC pipeline phase.
- **Verification Results:**
  - `pnpm exec tsc --noEmit`: 0 errors.
  - `pnpm run build`: Success in 1.46s (729 modules).
  - Headless Chrome CDP tests: WebGPU (60 FPS instant, 60 FPS 60-frame rolling average, 63 meshes), WebGL 2 (59-60 FPS instant, 60 FPS 60-frame rolling average, 63 meshes).
  - 60-second sustained stress test: 60 FPS locked, 12.8–13.6 MB flat JS heap, zero memory leaks.
- **Completion Criteria:** Met in full. Modular urban district verified in both WebGPU and WebGL 2 backends.

---

### Phase 3: Player Movement, Camera & Input Abstraction
- **Status:** `[NOT_STARTED]`
- **Objective:** Implement a responsive third-person character locomotion system with input abstraction supporting keyboard, mouse, and mobile touch.
- **Prerequisites:** Phase 2 environment in place.
- **Expected Deliverables:**
  - `InputService` normalizing Keyboard/Mouse and Touch/Virtual Joysticks.
  - Animated 3D character model with state machine (Idle, Walk, Run, Jump).
  - Third-person spring-arm camera with pitch/yaw orbit and wall-collision detection.
  - Mobile touch virtual stick HUD overlay.
- **Technical Risks:** Input latency on touch devices; camera clipping through building geometry.
- **Verification Method:** Manual movement testing across desktop and touch simulation; wall collision boundary checks.
- **Completion Criteria:** Character traverses terrain, climbs 30° slopes, stops at walls, and orbits camera smoothly without clipping.

---

### Phase 4: Havok Physics V2 & Interactive Objects
- **Status:** `[NOT_STARTED]`
- **Objective:** Integrate `@babylonjs/havok` WASM, establish scene physics, and migrate character locomotion to `PhysicsCharacterController`.
- **Prerequisites:** Phase 3 locomotion prototype.
- **Expected Deliverables:**
  - Asynchronous Havok WASM initialization pipeline.
  - Static environment collision meshes (roads, curbs, buildings).
  - Dynamic rigid-body physics for props (crates, barrels, traffic cones).
  - Collision filtering layers and physics debug visualization toggle.
- **Technical Risks:** Vite WASM bundling MIME-type errors; CPU thread overload from too many active dynamic bodies.
- **Verification Method:** Havok debug viewer; stress test dropping 50 dynamic boxes onto terrain; confirm rigid-body sleep state.
- **Completion Criteria:** Havok ticks at steady 60 Hz; physics CPU time < 3.0ms per frame on reference laptop.

---

### Phase 5: Drivable Vehicle Simulation
- **Status:** `[NOT_STARTED]`
- **Objective:** Implement a responsive, drivable 3D vehicle utilizing raycast suspension physics, steering mechanics, and enter/exit state transitions.
- **Prerequisites:** Phase 4 physics integration.
- **Expected Deliverables:**
  - Vehicle entity with chassis rigid body and 4 raycast wheel suspension springs.
  - Driving mechanics: throttle acceleration, reverse, steering, and handbrake braking.
  - Contextual vehicle enter/exit trigger system (`F` key / touch button).
  - Vehicle third-person camera mode with velocity-dependent FOV expansion.
- **Technical Risks:** Physics instability (jittering, launching into air on collision) with discrete raycasts.
- **Verification Method:** Test vehicle driving across road surfaces, taking 90° corners, hitting curbs, and smooth entry/exit transitions.
- **Completion Criteria:** Vehicle drives stably at high speed, collides with obstacles realistically, and transfers control seamlessly between foot and vehicle.

---

### Phase 6: Ambient Traffic & Pedestrian AI
- **Status:** `[NOT_STARTED]`
- **Objective:** Populate the city grid with autonomous ambient vehicles conforming to road lanes and wandering sidewalk pedestrians.
- **Prerequisites:** Phase 5 vehicle system.
- **Expected Deliverables:**
  - Road network waypoint graph with lane directions.
  - Pooled traffic vehicle spawner (max 10–12 active within 150m radius).
  - Simple forward obstacle detection raycasts for traffic braking.
  - Pedestrian wander state machine using low-poly pooled models.
- **Technical Risks:** CPU overhead from AI pathing; crowd simulation GC allocations.
- **Verification Method:** Profiler audit checking CPU frame time impact with 10 cars and 20 pedestrians active simultaneously.
- **Completion Criteria:** Total traffic/pedestrian tick < 2.0ms per frame; zero runtime GC spikes.

---

### Phase 7: Spatial World Streaming & LOD Management
- **Status:** `[NOT_STARTED]`
- **Objective:** Expand the urban environment beyond a single block into a multi-district city using 64m × 64m grid chunks with asynchronous streaming and LOD.
- **Prerequisites:** Phase 6 simulation systems.
- **Expected Deliverables:**
  - Spatial Chunk Manager tracking player position on a 2D grid.
  - Asynchronous chunk load, activate, cache, and dispose lifecycle.
  - LOD 0 (high detail) to LOD 2 (low poly / billboard impostors).
  - Distance fog masking chunk streaming boundaries.
- **Technical Risks:** Hitching/stuttering during chunk glTF loading and GPU buffer creation.
- **Verification Method:** Drive at top vehicle speed across 6 city blocks; monitor frame time variance and memory growth.
- **Completion Criteria:** Memory usage stays below 900 MB across continuous traversal; frame drops remain under 16ms.

---

### Phase 8: Missions, Interactions & Game Objectives
- **Status:** `[NOT_STARTED]`
- **Objective:** Build an event-driven mission system with checkpoints, delivery runs, interactive NPCs, and narrative objectives.
- **Prerequisites:** Phase 7 world streaming.
- **Expected Deliverables:**
  - Mission state graph (Start, Checkpoints, Fail, Complete).
  - Spatial checkpoint triggers with visual 3D rings and HUD waypoints.
  - Mini-map rendering objective icons and route compass.
  - Interactive dialogue / mission accept prompts.
- **Technical Risks:** Complex state synchronization across streaming chunk boundaries.
- **Verification Method:** Complete a full 3-checkpoint timed vehicle mission; verify restart on failure.
- **Completion Criteria:** 3 distinct test missions playable from start to finish with accurate HUD tracking and rewards.

---

### Phase 9: Atmospheric Graphics & Advanced Optimization
- **Status:** `[NOT_STARTED]`
- **Objective:** Polish visual immersion through dynamic day/night cycles, PBR materials, KTX2 texture transcoding, and post-processing.
- **Prerequisites:** Phase 8 gameplay systems.
- **Expected Deliverables:**
  - Rotating sun/moon directional light with atmospheric color shifts.
  - Streetlamps, neon building signs, and vehicle headlights at night.
  - KTX2 / Basis Universal compressed textures in production builds.
  - Meshopt geometry compression via `EXT_meshopt_compression`.
  - Cascaded shadow maps with distance falloff.
- **Technical Risks:** Performance degradation on integrated Intel GPU from high fill-rate lighting.
- **Verification Method:** Benchmark FPS in day and night modes; verify texture VRAM reduction via KTX2.
- **Completion Criteria:** Stable 60 FPS maintained in night scene on reference laptop; initial bundle < 25 MB.

---

### Phase 10: Content Polish, Release Packaging & Distribution
- **Status:** `[NOT_STARTED]`
- **Objective:** Package the engine and vertical slice for public web deployment with cross-device audio, persistence, and automated CI.
- **Prerequisites:** Phase 9 graphical optimization.
- **Expected Deliverables:**
  - Complete Web Audio implementation (engine audio, ambient city noise, original music).
  - IndexedDB save/load system for progress persistence.
  - Mobile touch polish and full-screen PWA support.
  - GitHub Actions CI pipeline running typecheck, build, and automated tests.
  - Production deployment to static web hosting (e.g., Cloudflare Pages / Vercel).
- **Technical Risks:** Audio autoplay blocking on mobile Safari; storage quota restrictions.
- **Verification Method:** Clean run on live URL across desktop (Windows, Mac, Linux) and mobile (iPhone, Android).
- **Completion Criteria:** Publicly accessible URL loading under 5 seconds with zero external dependencies.

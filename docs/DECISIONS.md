# Architecture Decision Records (ADRs) — Vice-City Engine

> **Document Type:** Architectural Decision Records (ADRs)  
> **Status:** Authoritative Decision Log  
> **Repository Location:** `/docs/DECISIONS.md`  
> **Last Verified Date:** 2026-11-04  

---

## Index of Architectural Decisions

- [ADR-001: Selection of Babylon.js as Core 3D Web Engine](#adr-001-selection-of-babylonjs-as-core-3d-web-engine)
- [ADR-002: Dual Rendering Backend: WebGPU Primary with WebGL 2 Fallback](#adr-002-dual-rendering-backend-webgpu-primary-with-webgl-2-fallback)
- [ADR-003: Selection of Havok Physics V2 via `@babylonjs/havok`](#adr-003-selection-of-havok-physics-v2-via-babylonjshavok)
- [ADR-004: Build Toolchain: Vite with Strict TypeScript](#adr-004-build-toolchain-vite-with-strict-typescript)
- [ADR-005: 3D Asset Standard: glTF 2.0 / GLB with KTX2 Basis Universal & Meshopt](#adr-005-3d-asset-standard-gltf-20--glb-with-ktx2-basis-universal--meshopt)
- [ADR-006: Lightweight Composition Architecture over Monolithic ECS](#adr-006-lightweight-composition-architecture-over-monolithic-ecs)
- [ADR-007: Raycast Suspension Architecture for Vehicles](#adr-007-raycast-suspension-architecture-for-vehicles)
- [ADR-008: Progressive Touch & Gamepad Input Abstraction Layer](#adr-008-progressive-touch--gamepad-input-abstraction-layer)
- [ADR-009: Target Hardware Baseline (Lenovo IdeaPad Slim 3i & Mobile Baseline)](#adr-009-target-hardware-baseline-lenovo-ideapad-slim-3i--mobile-baseline)
- [ADR-010: Persistent AI Memory Protocol via AGENTS.md and brain.md](#adr-010-persistent-ai-memory-protocol-via-agentsmd-and-brainmd)

---

### ADR-001: Selection of Babylon.js as Core 3D Web Engine

- **Date:** 2026-11-04
- **Status:** `[VERIFIED]` / Accepted
- **Context:** An ambitious open-world 3D browser game requires a robust rendering engine, mature scene graph, WebGPU support, complete physics integration, glTF loaders, and active maintenance.
- **Options Considered:**
  1. *Babylon.js:* Comprehensive full-featured 3D web engine backed by Microsoft, native WebGPU, built-in Havok V2 plugin.
  2. *Three.js:* Popular rendering library, but lacks built-in physics abstraction, character controller, and requires stitching multiple third-party libraries.
  3. *PlayCanvas:* High quality, but engine/editor coupling and licensing complexities make standalone local TypeScript development less seamless.
- **Decision:** Select Babylon.js (`@babylonjs/core`) as the core 3D engine.
- **Rationale:** Babylon.js provides complete out-of-the-box infrastructure for WebGPU/WebGL 2 dual-backend rendering, Havok physics integration, glTF 2.0 extensions (KTX2/Meshopt), and modular ES6 tree-shaking under the Apache 2.0 license.
- **Advantages:** Single unified ecosystem; first-class WebGPU support; native Havok plugin.
- **Disadvantages:** Monolithic namespace if not importing granular ES6 paths; larger raw download size than bare Three.js.
- **Consequences:** All scene graph, mesh, material, and camera logic must adhere strictly to Babylon.js conventions.
- **Supporting Evidence:** [Babylon.js Official Documentation](https://doc.babylonjs.com/)

---

### ADR-002: Dual Rendering Backend: WebGPU Primary with WebGL 2 Fallback

- **Date:** 2026-11-04
- **Status:** `[VERIFIED]` / Accepted
- **Context:** WebGPU provides modern low-overhead rendering and compute capabilities, but is not yet available on 100% of devices (e.g., Linux configurations, older iOS/Android devices).
- **Options Considered:**
  1. *WebGPU Only:* Limits user reach, fails on older mobile devices.
  2. *WebGL 2 Only:* Misses substantial performance benefits of compute shaders, low CPU driver overhead, and modern graphics pipelines.
  3. *Dual Backend (WebGPU Primary + WebGL 2 Fallback):* Delivers next-gen performance to modern browsers while preserving universal accessibility.
- **Decision:** Use `EngineFactory.CreateAsync(canvas, options)` to initialize WebGPU if supported, automatically falling back to WebGL 2.
- **Rationale:** Delivers optimal performance to modern clients without excluding users on WebGL 2 devices.
- **Advantages:** Broadest possible audience reach; future-proof rendering architecture.
- **Disadvantages:** Shaders and rendering pipelines must maintain compatibility with WebGL 2 limitations (avoiding WebGPU-exclusive features unless wrapped in feature guards).
- **Consequences:** All graphics features must be verified on both WebGPU and WebGL 2 backends.
- **Supporting Evidence:** [Babylon.js EngineFactory Documentation](https://doc.babylonjs.com/)

---

### ADR-003: Selection of Havok Physics V2 via `@babylonjs/havok`

- **Date:** 2026-11-04
- **Status:** `[VERIFIED]` / Accepted
- **Context:** An open-world action game demands reliable rigid-body physics, vehicle suspension simulation, and responsive character collision without glitching through terrain.
- **Options Considered:**
  1. *Cannon.js / Cannon-es:* Outdated, slow, lacks modern continuous collision detection (CCD), unsuited for complex urban environments.
  2. *Ammo.js (Bullet port):* Heavy, complex memory management, legacy architecture.
  3. *Havok Physics V2 (`@babylonjs/havok`):* Production AAA physics solver compiled to WASM, officially integrated into Babylon.js, distributed under MIT license.
- **Decision:** Select Havok Physics V2 via `@babylonjs/havok`.
- **Rationale:** Havok provides superior performance, sub-step stability, native `PhysicsCharacterController`, and reliable collision filtering.
- **Advantages:** High speed WASM execution, zero-jitter character-slope handling, permissive MIT license.
- **Disadvantages:** Requires asynchronous WASM loading during engine startup; running WASM physics on a 2-core CPU requires strict body sleep optimization.
- **Consequences:** Build toolchain must handle `.wasm` binary serving properly.
- **Supporting Evidence:** [Havok npm package](https://www.npmjs.com/package/@babylonjs/havok) & [BabylonJS/havok GitHub](https://github.com/BabylonJS/havok) (MIT License verified).

---

### ADR-004: Build Toolchain: Vite with Strict TypeScript

- **Date:** 2026-11-04
- **Status:** `[VERIFIED]` / Accepted
- **Context:** Fast development feedback loops and strict type verification are vital when engineering a multi-subsystem game engine.
- **Options Considered:**
  1. *Webpack:* Slower cold starts, complex configuration.
  2. *Vite:* Native ESM in dev, instant HMR, Rollup production bundling, low memory overhead.
- **Decision:** Use Vite with strict TypeScript configuration (`noImplicitAny`, `strictNullChecks`).
- **Rationale:** Vite's development server starts instantly and uses minimal CPU/memory, critical for the reference laptop (8 GB RAM).
- **Advantages:** Sub-second HMR updates; clean static asset handling.
- **Disadvantages:** Requires explicit plugin setup for WebAssembly top-level imports.
- **Consequences:** All modules must be authored as clean ES modules.
- **Supporting Evidence:** [Vite Documentation](https://vite.dev/)

---

### ADR-005: 3D Asset Standard: glTF 2.0 / GLB with KTX2 Basis Universal & Meshopt

- **Date:** 2026-11-04
- **Status:** `[VERIFIED]` / Accepted
- **Context:** Open-world games require vast quantities of textures and geometry. Raw PNG/JPG textures consume hundreds of megabytes of GPU VRAM when decompressed.
- **Options Considered:**
  1. *Raw PNG/JPG + uncompressed glTF:* Rapidly exceeds browser tab memory and GPU fill limits.
  2. *Draco compression:* Excellent geometry compression, but high CPU decompression cost on mobile/budget CPUs.
  3. *glTF 2.0 / GLB with KTX2 (Basis Universal) & Meshopt:* Textures stay compressed in GPU memory (ASTC, BC7, ETC2); Meshopt decodes geometry with near-zero CPU overhead.
- **Decision:** Standardize on glTF 2.0 Binary (`.glb`) with `KHR_texture_basisu` (KTX2) and `EXT_meshopt_compression`.
- **Rationale:** Reduces download size by 60–80% and slashes runtime VRAM footprint by 75%.
- **Advantages:** Fast loading, low memory consumption on integrated GPUs.
- **Disadvantages:** Requires preprocessing assets with `gltfpack` or `glTF-Transform` during content authoring.
- **Consequences:** All production models must pass asset validation before inclusion.
- **Supporting Evidence:** [Khronos glTF Specification](https://www.khronos.org/gltf/) & [meshoptimizer](https://meshoptimizer.org/)

---

### ADR-006: Lightweight Composition Architecture over Monolithic ECS

- **Date:** 2026-11-04
- **Status:** `[PROPOSED]` / Accepted
- **Context:** Evaluating whether to introduce a heavy external Entity-Component-System (ECS) framework (e.g., bitECS, Miniplex) versus lightweight object composition.
- **Options Considered:**
  1. *Full Pure ECS (bitECS / archetypes):* Maximum theoretical iteration speed for millions of simple particles, but high mental overhead, difficult integration with Babylon's object-oriented scene graph, and unnecessary for a single-player urban sandbox with ~50 active entities.
  2. *Lightweight Service & Composition Architecture:* Decoupled services (`InputService`, `PhysicsManager`, `WorldManager`) managing cohesive entities implementing `IGameEntity`.
- **Decision:** Adopt lightweight service and composition architecture.
- **Rationale:** Keeps codebase readable, maintainable, and aligned with Babylon's native scene graph while eliminating unnecessary abstractions.
- **Advantages:** Fast development, zero external ECS dependencies, straightforward debugging.
- **Disadvantages:** Less suited for simulating tens of thousands of simultaneous agents (mitigated by spatial pooling).
- **Consequences:** All entity logic follows uniform lifecycle methods (`update()`, `dispose()`).
- **Supporting Evidence:** Babylon.js architectural design patterns.

---

### ADR-007: Raycast Suspension Architecture for Vehicles

- **Date:** 2026-11-04
- **Status:** `[PROPOSED]` / Accepted
- **Context:** Open-world vehicle simulation requires responsive driving physics, drifting, and obstacle collisions.
- **Options Considered:**
  1. *Full Rigid Body Multi-Joint Rig (6DoF Havok Joints):* Physically realistic, but computationally intensive (4 extra rigid bodies and 4 complex constraints per car), prone to solver instability at high speed.
  2. *Raycast Vehicle Model:* Single chassis rigid body with 4 downward raycasts simulating spring/damper compression and lateral tire friction.
- **Decision:** Implement a Raycast Suspension Vehicle System.
- **Rationale:** Drastically lower CPU overhead (only 4 ray queries per vehicle frame), proven stability in arcade and open-world games, easily tunable handling characteristics.
- **Advantages:** Rock-solid stability; negligible CPU footprint; easily supports 10+ active traffic vehicles on 2-core CPUs.
- **Disadvantages:** Wheels are visual meshes positioned via ray hits rather than physical colliders (acceptable for open-world games).
- **Consequences:** Vehicle chassis must use a simplified box or convex hull collision body.
- **Supporting Evidence:** Industry-standard arcade vehicle physics architecture.

---

### ADR-008: Progressive Touch & Gamepad Input Abstraction Layer

- **Date:** 2026-11-04
- **Status:** `[PROPOSED]` / Accepted
- **Context:** The game must be fully playable across desktop (keyboard/mouse) and mobile (touchscreens).
- **Decision:** Create an `InputService` that aggregates hardware inputs into normalized analog axes and discrete action booleans.
- **Rationale:** Eliminates device-specific branching inside gameplay systems (locomotion, driving, camera).
- **Advantages:** Seamless touch and gamepad support without polluting player/vehicle code.
- **Disadvantages:** Requires maintaining a virtual touch UI overlay.
- **Consequences:** All future mechanics must define an abstract action in `InputService`.

---

### ADR-009: Target Hardware Baseline (Lenovo IdeaPad Slim 3i & Mobile Baseline)

- **Date:** 2026-11-04
- **Status:** `[VERIFIED]` / Accepted
- **Context:** Establishing the engineering baseline for resource budgets, draw-call limits, and performance profiling.
- **Decision:** Design explicitly for a primary reference workstation: Lenovo IdeaPad Slim 3i (Intel Core i3-1005G1, 2C/4T, 8 GB RAM, Intel UHD G1, Windows 11) and mid-tier mobile devices.
- **Rationale:** If the engine maintains 60 FPS on this budget machine, it will run effortlessly on high-end gaming rigs and modern phones.
- **Consequences:** Strict budget caps: < 150 draw calls, < 1.0 GB tab memory, aggressive instancing, and no uncompressed textures.

---

### ADR-010: Persistent AI Memory Protocol via AGENTS.md and brain.md

- **Date:** 2026-11-04
- **Status:** `[VERIFIED]` / Accepted
- **Context:** Long-term development with AI coding agents suffers from context loss, hallucinations, and unverified implementation claims across sessions.
- **Decision:** Implement a mandatory AI operating protocol via root `AGENTS.md` and a central memory index `brain.md`.
- **Rationale:** Forces every AI session to read project memory, check disk reality, verify tests, and document progress before and after modifying code.
- **Advantages:** Absolute consistency across sessions; zero hallucinated progress; total project transparency.
- **Consequences:** All AI agents must follow the 8-step startup protocol and 4-step wrap-up protocol.

# Technical Research Bibliography & Evidence Library — Vice-City Engine

> **Document Type:** Research Library & Evidence Repository  
> **Status:** `[VERIFIED]` / Authoritative Reference Base  
> **Repository Location:** `/docs/RESEARCH_SOURCES.md`  
> **Verification Date:** 2026-11-04  

---

## 1. Babylon.js Documentation & Engine Architecture

### 1.1 Babylon.js Core Architecture & API
- **Title:** Babylon.js Official Documentation
- **URL:** [https://doc.babylonjs.com/](https://doc.babylonjs.com/)
- **Publisher / Maintainer:** Microsoft & Babylon.js Community
- **Date Accessed:** 2026-11-04
- **Relevance:** Foundation for scene graph, rendering loops, camera controls, materials, and asset loading.
- **Architectural Impact:** Confirms the core 3D engine choice (ADR-001).
- **Status:** `[VERIFIED]`

### 1.2 WebGPU Engine Initialization & Fallback
- **Title:** Babylon.js WebGPU Support & EngineFactory.CreateAsync
- **URL:** [https://doc.babylonjs.com/setup/support/webGPU](https://doc.babylonjs.com/setup/support/webGPU)
- **Publisher / Maintainer:** Babylon.js Documentation Team
- **Date Accessed:** 2026-11-04
- **Relevance:** Confirms `EngineFactory.CreateAsync(canvas, options)` signature and asynchronous initialization for WebGPUEngine with graceful fallback to WebGL 2 Engine.
- **Architectural Impact:** Directly supports ADR-002 (Dual Rendering Backend).
- **Status:** `[VERIFIED]`

### 1.3 Thin Instances & Hardware Instancing
- **Title:** Babylon.js Thin Instances Documentation
- **URL:** [https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances)
- **Publisher / Maintainer:** Babylon.js Documentation Team
- **Date Accessed:** 2026-11-04
- **Relevance:** Details high-performance hardware instancing using raw transformation buffer matrices to render thousands of props (street lamps, trees, barriers) in a single draw call.
- **Architectural Impact:** Supports the low-draw-call requirement for the integrated Intel UHD GPU (PRD Section 6.2).
- **Status:** `[VERIFIED]`

---

## 2. Physics & Simulation (Havok Physics V2)

### 2.1 Havok Physics Plugin in Babylon.js
- **Title:** Babylon.js Physics V2 & Havok Plugin Overview
- **URL:** [https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin](https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin)
- **Publisher / Maintainer:** Babylon.js Team
- **Date Accessed:** 2026-11-04
- **Relevance:** Details `HavokPlugin`, `PhysicsBody`, `PhysicsShape`, and `PhysicsMotionType`.
- **Architectural Impact:** Confirms Havok V2 as the official, supported physics engine for Babylon (ADR-003).
- **Status:** `[VERIFIED]`

### 2.2 Havok Physics Character Controller
- **Title:** Babylon.js PhysicsCharacterController API & Guide
- **URL:** [https://doc.babylonjs.com/features/featuresDeepDive/physics/characterController](https://doc.babylonjs.com/features/featuresDeepDive/physics/characterController)
- **Publisher / Maintainer:** Babylon.js Team
- **Date Accessed:** 2026-11-04
- **Relevance:** Verifies built-in `PhysicsCharacterController` supporting ground support queries (`checkSupport`), slope climbing, and sliding integration without jitter.
- **Architectural Impact:** Foundation for Player Locomotion system design (PRD Section 5.1 & SYS-LOC).
- **Status:** `[VERIFIED]`

### 2.3 Havok NPM Package & Licensing
- **Title:** `@babylonjs/havok` on npm & GitHub
- **URL:** [https://www.npmjs.com/package/@babylonjs/havok](https://www.npmjs.com/package/@babylonjs/havok) | [https://github.com/BabylonJS/havok](https://github.com/BabylonJS/havok)
- **Publisher / Maintainer:** Microsoft / BabylonJS
- **Date Accessed:** 2026-11-04
- **Relevance:** Confirms official package distribution, WebAssembly binary delivery, and **MIT License** verification for the web module.
- **Architectural Impact:** Eliminates licensing ambiguity; confirms commercial web safety (ADR-003).
- **Status:** `[VERIFIED]`

---

## 3. Web Graphics Specifications & Browser Compatibility

### 3.1 W3C WebGPU Specification
- **Title:** WebGPU W3C Candidate Recommendation
- **URL:** [https://www.w3.org/TR/webgpu/](https://www.w3.org/TR/webgpu/)
- **Publisher / Maintainer:** W3C GPU for the Web Working Group
- **Date Accessed:** 2026-11-04
- **Relevance:** Authoritative specification for WebGPU APIs, adapters, devices, command buffers, and compute pipelines.
- **Architectural Impact:** Underpins primary rendering pipeline (ADR-002).
- **Status:** `[VERIFIED]`

### 3.2 Khronos WebGL 2.0 Specification
- **Title:** WebGL 2.0 Specification
- **URL:** [https://www.khronos.org/registry/webgl/specs/latest/2.0/](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- **Publisher / Maintainer:** Khronos Group
- **Date Accessed:** 2026-11-04
- **Relevance:** Fallback graphics API specification supported by 99%+ of devices.
- **Architectural Impact:** Underpins universal compatibility fallback (ADR-002).
- **Status:** `[VERIFIED]`

### 3.3 MDN WebGPU API & Browser Support Matrix
- **Title:** MDN Web Docs: WebGPU API
- **URL:** [https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- **Publisher / Maintainer:** Mozilla Developer Network
- **Date Accessed:** 2026-11-04
- **Relevance:** Validates desktop and mobile browser compatibility (Chromium 113+, Safari 16+, Firefox 141+).
- **Architectural Impact:** Validates dual-backend architecture and target browser list (PRD Section 3.1).
- **Status:** `[VERIFIED]`

---

## 4. Build Toolchain & Language

### 4.1 Vite Official Documentation
- **Title:** Vite: Next Generation Frontend Tooling
- **URL:** [https://vite.dev/](https://vite.dev/)
- **Publisher / Maintainer:** Yuxi (Evan) You & Vite Core Team
- **Date Accessed:** 2026-11-04
- **Relevance:** Config, HMR lifecycle, Rollup bundling, WebAssembly asset handling.
- **Architectural Impact:** Confirms build toolchain (ADR-004).
- **Status:** `[VERIFIED]`

### 4.2 TypeScript Official Documentation
- **Title:** TypeScript Language Specification & Handbook
- **URL:** [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **Publisher / Maintainer:** Microsoft
- **Date Accessed:** 2026-11-04
- **Relevance:** Type system rules, strict configuration flags, ES module compilation.
- **Architectural Impact:** Establishes strict type safety rules across the engine codebase (ADR-004).
- **Status:** `[VERIFIED]`

---

## 5. 3D Asset Formats & Optimization

### 5.1 Khronos glTF 2.0 Specification
- **Title:** glTF 2.0 Specification (ISO/IEC 12113:2022)
- **URL:** [https://www.khronos.org/gltf/](https://www.khronos.org/gltf/)
- **Publisher / Maintainer:** Khronos Group 3D Formats Working Group
- **Date Accessed:** 2026-11-04
- **Relevance:** Universal runtime 3D asset transmission format.
- **Architectural Impact:** Primary 3D container for all city meshes, characters, and vehicles (ADR-005).
- **Status:** `[VERIFIED]`

### 5.2 KTX2 & Basis Universal Texture Compression
- **Title:** KTX 2.0: Reliable 3D Texture Transmission & Basis Universal
- **URL:** [https://www.khronos.org/ktx/](https://www.khronos.org/ktx/)
- **Publisher / Maintainer:** Khronos Group
- **Date Accessed:** 2026-11-04
- **Relevance:** Supercompressed texture format that transcodes at runtime to GPU native compressed formats (BC7, ASTC, ETC2).
- **Architectural Impact:** Prevents VRAM exhaustion on 8 GB shared-memory Intel GPU (PRD Section 6.2, ADR-005).
- **Status:** `[VERIFIED]`

### 5.3 Meshopt Geometry Compression
- **Title:** Meshoptimizer: Fast 3D Geometry Processing & Decompression
- **URL:** [https://meshoptimizer.org/](https://meshoptimizer.org/)
- **Publisher / Maintainer:** Arseny Kapoulkine
- **Date Accessed:** 2026-11-04
- **Relevance:** High-efficiency geometry compression format (`EXT_meshopt_compression`) decoded rapidly on CPU without memory overhead.
- **Architectural Impact:** Slashes glTF asset download size by 60%+ (ADR-005).
- **Status:** `[VERIFIED]`

### 5.4 Blender glTF 2.0 Exporter Manual
- **Title:** Blender 4.x glTF 2.0 Add-on Manual
- **URL:** [https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
- **Publisher / Maintainer:** Blender Foundation
- **Date Accessed:** 2026-11-04
- **Relevance:** Details standard export settings (transform axes, materials, PBR texture packing, skinning, animation).
- **Architectural Impact:** Dictates Blender-to-engine asset export standards (ASSET_PIPELINE.md).
- **Status:** `[VERIFIED]`

---

## 6. Open-Source AI Agent Instruction Specifications

### 6.1 OpenCode & AGENTS.md Standardization
- **Title:** AGENTS.md: Standard Instructions for AI Coding Agents
- **URL:** [https://agents.md/](https://agents.md/) | [https://opencode.ai/docs/](https://opencode.ai/docs/)
- **Publisher / Maintainer:** OpenCode & AI Engineering Community
- **Date Accessed:** 2026-11-04
- **Relevance:** Details the discovery hierarchy, precedence order, and live-update behavior of `AGENTS.md` in OpenCode workspaces.
- **Architectural Impact:** Foundation for persistent AI memory and startup protocol (AGENTS.md & ADR-010).
- **Status:** `[VERIFIED]`

# Vice-City: Web Open World 3D Game Engine

[![Language](https://img.shields.io/badge/Language-TypeScript%205.x-blue.svg)](https://www.typescriptlang.org/)
[![Engine](https://img.shields.io/badge/3D%20Engine-Babylon.js%209.x-orange.svg)](https://doc.babylonjs.com/)
[![Graphics](https://img.shields.io/badge/Graphics-WebGPU%20%7C%20WebGL%202-green.svg)](https://www.w3.org/TR/webgpu/)
[![Physics](https://img.shields.io/badge/Physics-Havok%20V2-red.svg)](https://github.com/BabylonJS/havok)
[![Build](https://img.shields.io/badge/Bundler-Vite%208.x-purple.svg)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

An ambitious, highly optimized, browser-native 3D open-world action-adventure game engine and vertical slice. Built from the ground up with **TypeScript**, **Babylon.js**, **WebGPU** (with **WebGL 2** graceful fallback), and **Havok Physics V2**, delivering a rich open-world sandbox directly inside modern desktop and mobile web browsers without installations or plugins.

---

## 1. Project Vision & Originality Mandate

Vice-City is an **original intellectual property** inspired by the freedom, exploration, vehicular action, and dynamic gameplay of urban open-world classics. 

> [!IMPORTANT]
> **Strict Original IP Mandate:** Vice-City is developed under clean-room engineering standards. It contains **no** copyrighted maps, characters, dialogue, audio, radio stations, textures, or branding from existing commercial franchises (e.g., Grand Theft Auto / Rockstar Games titles). All environments, vehicles, mechanics, audio, and narratives are original or sourced under commercial open-source licenses.

---

## 2. Core Technology Stack

| Domain | Technology | Rationale |
|---|---|---|
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict static typing, compile-time validation, refactoring safety |
| **3D Engine** | [Babylon.js](https://doc.babylonjs.com/) (`@babylonjs/core`) | Production web engine, native WebGPU, complete physics abstraction |
| **Graphics API** | [WebGPU](https://www.w3.org/TR/webgpu/) (Primary) & [WebGL 2](https://www.khronos.org/webgl/) (Fallback) | Next-generation compute/render pipeline with universal fallback |
| **Physics** | [Havok Physics V2](https://github.com/BabylonJS/havok) (`@babylonjs/havok`) | High-performance WASM physics simulation, character controller, MIT license |
| **Bundler** | [Vite](https://vite.dev/) | Instant HMR, lightweight ES modules, rapid development cycle |
| **Asset Pipeline** | [Blender](https://www.blender.org/) + [glTF 2.0 / GLB](https://www.khronos.org/gltf/) | Industry standard, KTX2/Basis Universal textures, Meshopt compression |

---

## 3. Target Hardware Profile

The engine is engineered specifically to run smoothly on constrained consumer hardware:

- **Reference Workstation:** Lenovo IdeaPad Slim 3i
  - **CPU:** Intel Core i3-1005G1 (2 Cores / 4 Threads @ 1.20 GHz – 3.40 GHz)
  - **RAM:** 8 GB DDR4 (shared with GPU; ~3.5 GB available for browser)
  - **GPU:** Integrated Intel UHD Graphics G1 (32 EUs)
  - **Storage:** 128 GB NVMe SSD (~80 GB free)
  - **OS:** Windows 11 Home
- **Mobile Target:** Mid-tier Android (Chrome 121+ / Vulkan) & iOS (Safari 16+ / Metal WebGPU)

---

## 4. Documentation Index

The project maintains comprehensive engineering documentation under the [`docs/`](docs/) directory and the persistent project memory system:

| Document | Description |
|---|---|
| [**brain.md**](brain.md) | **Central Project Memory & Navigation Hub** (Must-read for every session) |
| [**AGENTS.md**](AGENTS.md) | **Mandatory AI Coding Agent Operating Protocol & Rules** |
| [**docs/PRD.md**](docs/PRD.md) | Product Requirements Document: features, scope, acceptance criteria |
| [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) | System architecture, engine lifecycle, loop design, memory management |
| [**docs/SYSTEM_DESIGN.md**](docs/SYSTEM_DESIGN.md) | Detailed specifications for locomotion, vehicles, traffic, AI, audio |
| [**docs/TECH_STACK.md**](docs/TECH_STACK.md) | Dependency matrix, licensing records, versioning, technical rationale |
| [**docs/ROADMAP.md**](docs/ROADMAP.md) | Multi-phase development roadmap from Phase 0 to Phase 10 |
| [**docs/DECISIONS.md**](docs/DECISIONS.md) | Architecture Decision Records (ADRs) tracking all key technical choices |
| [**docs/RESEARCH_SOURCES.md**](docs/RESEARCH_SOURCES.md) | Authoritative technical research bibliography and official links |
| [**docs/RISKS.md**](docs/RISKS.md) | Risk register with severity, likelihood, and mitigation strategies |
| [**docs/DEVELOPMENT_WORKFLOW.md**](docs/DEVELOPMENT_WORKFLOW.md) | 10-step development cycle, code standards, verification procedures |
| [**docs/ASSET_PIPELINE.md**](docs/ASSET_PIPELINE.md) | Blender-to-glTF export rules, texture budgets, LOD standards |

---

## 5. Repository Structure

```text
Vice-City/
│
├── AGENTS.md                  # Mandatory AI Agent instructions & startup checklist
├── brain.md                   # Central persistent memory & current state
├── README.md                  # Project overview and navigation hub
├── index.html                 # Main application entry canvas & telemetry mount
├── package.json               # Pinned dependencies & scripts
├── pnpm-lock.yaml             # Pinned package lockfile
├── tsconfig.json              # Strict TypeScript compiler options
├── vite.config.ts             # Vite development & build configuration
│
├── src/                       # TypeScript engine and gameplay source
│   ├── core/                  # Core engine lifecycle & backends
│   │   └── EngineFactory.ts   # Dual WebGPU / WebGL 2 bootstrapper with fallback
│   ├── scene/                 # Scene creation & geometry management
│   │   └── createTestScene.ts # 3D geometric test environment & orbit camera
│   ├── ui/                    # UI & diagnostic telemetry
│   │   └── Telemetry.ts       # Live performance HUD (FPS, backend, mesh count)
│   └── main.ts                # Application bootstrap & lifecycle handling
│
├── styles/                    # Application styling & HUD overlay CSS
│   └── main.css               # Fullscreen canvas styling & telemetry theme
│
└── docs/                      # Core architectural & requirements documentation
    ├── PRD.md                 # Product Requirements Document
    ├── ARCHITECTURE.md        # Global software & engine architecture
    ├── SYSTEM_DESIGN.md       # Individual game system designs
    ├── TECH_STACK.md          # Technical stack evaluations & licenses
    ├── ROADMAP.md             # Dependency-aware development milestones
    ├── DECISIONS.md           # Architecture Decision Records (ADRs)
    ├── RESEARCH_SOURCES.md    # Bibliography of verified technical sources
    ├── RISKS.md               # Technical & project risk register
    ├── DEVELOPMENT_WORKFLOW.md# Step-by-step development process
    └── ASSET_PIPELINE.md      # 3D modeling, texture budgets & glTF export specs
```

---

## 6. Development Workflow Quickstart

> [!NOTE]
> The engine rendering prototype is active (**Phase 1: Minimal Browser Rendering Prototype `[VERIFIED]`**). Both WebGPU primary rendering and WebGL 2 fallback have been verified in Chrome.

Standard developer workflows using `pnpm`:

```bash
# Install pinned dependencies
pnpm install

# Start local Vite development server with HMR
pnpm run dev

# Strict TypeScript type check (zero emit)
pnpm run typecheck

# Production build (TypeScript check + Vite bundler)
pnpm run build

# Preview production distribution bundle locally
pnpm run preview
```

---

## 7. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.  
All third-party libraries (Babylon.js, Havok WASM, Vite) are verified under permissive open-source licenses (Apache 2.0 / MIT).

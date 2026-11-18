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
│   ├── camera/                # Third-person follow camera & spring-arm collision
│   │   ├── CameraConfig.ts    # Camera parameters (distance, damping, cushions)
│   │   └── ThirdPersonCamera.ts # Spherical orbit & geometry obstruction probe
│   ├── core/                  # Core engine lifecycle & backends
│   │   └── EngineFactory.ts   # Dual WebGPU / WebGL 2 bootstrapper with fallback
│   ├── environment/           # Modular 3D urban environment subsystem
│   │   ├── buildings/         # Procedural modular buildings & presets
│   │   ├── materials/         # Central shared PBR material library (32 materials)
│   │   ├── props/             # Thin-instanced street furniture (lamps, trees, benches)
│   │   ├── roads/             # Avenue, intersections, sidewalks, curbs, markings & 30° ramp
│   │   ├── EnvironmentManager.ts # Environment orchestrator and lifecycle disposal
│   │   └── types.ts           # Building and prop interface specifications
│   ├── input/                 # Unified input abstraction subsystem
│   │   ├── GamepadInput.ts    # HTML5 Gamepad API polling & deadzones
│   │   ├── InputService.ts    # Aggregator with diagonal vector normalization
│   │   ├── InputTypes.ts      # Normalized InputState contract
│   │   ├── KeyboardMouseInput.ts # WASD, sprint, jump, pointer lock & blur protection
│   │   └── TouchInput.ts      # Multi-touch virtual joystick & button integration
│   ├── player/                # Player character and locomotion kinematics
│   │   ├── PlayerCharacter.ts # Stylized procedural 3D character & limb swing
│   │   ├── PlayerConfig.ts    # Kinematic movement constants (speeds, step-up, slopes)
│   │   ├── PlayerController.ts# Kinematic controller, wall sliding, curb step-up, FSM
│   │   └── PlayerState.ts     # Movement state enum (IDLE, WALK, RUN, SPRINT, JUMP, FALL, LAND)
│   ├── scene/                 # Scene creation & geometry management
│   │   ├── createCityScene.ts # Controllable city block scene assembly
│   │   └── createTestScene.ts # 3D geometric test environment & orbit camera
│   ├── ui/                    # UI & diagnostic telemetry
│   │   ├── Telemetry.ts       # Live performance HUD (FPS, player state, speed, pos)
│   │   └── VirtualJoystick.ts # Responsive floating virtual thumbstick & HUD buttons
│   └── main.ts                # Application bootstrap & lifecycle handling
│
├── styles/                    # Application styling & HUD overlay CSS
│   └── main.css               # Fullscreen canvas styling & telemetry theme
│
├── screenshots/               # Verified automated test screenshots
│   ├── screenshot-webgpu.png  # WebGPU render capture
│   └── screenshot-webgl2.png  # WebGL 2 render capture
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

## 6. Development Workflow & Gameplay Controls

> [!NOTE]
> **Phase 3: Player Movement, Camera & Input Abstraction `[VERIFIED]`** is complete and operational. Both WebGPU primary rendering and WebGL 2 fallback run at locked 60 FPS in Chrome, featuring a controllable third-person player with procedural animations, curb step-up (0.18m), 30° slope traversal, wall-sliding, spring-arm camera obstruction avoidance, and multi-input support (Keyboard/Mouse, Gamepad, Touch).

### Gameplay Controls:
- **Desktop (Keyboard & Mouse):**
  - **Click Canvas:** Acquire Pointer Lock for first/third-person mouse-look
  - **W / A / S / D:** Camera-relative directional movement
  - **Shift (Hold):** Sprint (up to 8.8 m/s)
  - **Space:** Jump (vertical impulse with gravity simulation)
  - **Mouse:** Spherical orbit camera view
  - **Esc:** Release pointer lock
- **Mobile Touch (Touchscreen Devices):**
  - **Bottom-Left Area:** Dynamic floating virtual joystick for locomotion
  - **Right Half of Screen:** Swipe to orbit third-person follow camera
  - **On-Screen Buttons:** Dedicated Sprint (👟) and Jump (⬆️) action touch buttons
- **Gamepad (Controllers):**
  - **Left Analog Stick:** Smooth omnidirectional character movement
  - **Right Analog Stick:** Spherical camera orbit
  - **Button A / South:** Jump
  - **Right Trigger / Left Stick Click:** Sprint

### Standard Developer Commands (pnpm):

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

# Run automated headless Chrome CDP test suite (WebGPU & WebGL 2 fallback)
pnpm run test:cdp

# Run 60-second sustained stress profiling test (flat memory verification)
pnpm run test:sustained
```

---

## 7. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.  
All third-party libraries (Babylon.js, Havok WASM, Vite) are verified under permissive open-source licenses (Apache 2.0 / MIT).

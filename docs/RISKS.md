# Project Risk Register & Mitigation Strategy — Vice-City Engine

> **Document Type:** Technical & Operational Risk Register  
> **Status:** Active Project Governance  
> **Repository Location:** `/docs/RISKS.md`  
> **Last Verified Date:** 2026-11-04  

---

## 1. Risk Evaluation Matrix

Risks are categorized by **Severity** (Impact on project viability) and **Likelihood** (Probability of occurrence):

| Risk ID | Risk Category & Description | Severity | Likelihood | Mitigation Strategy | Verification Requirement |
|---|---|---|---|---|---|
| **RSK-001** | **Target Hardware Memory Ceiling (8 GB Shared RAM)**: Windows 11 + IDE + Browser tab causes memory pressure and tab crashing. | High | High | Enforce strict < 1.0 GB tab memory budget; aggressive mesh disposal on chunk unload; zero memory leaks in render loop. | Profiler check: Run 30-min continuous movement test; verify heap remains flat. |
| **RSK-002** | **CPU Throttling on 2-Core / 4-Thread Laptop**: Sustained 100% CPU loads trigger thermal clock drops on slim chassis. | High | Medium | Decouple physics at fixed 60 Hz; raycast vehicle model; cap active traffic to 12 vehicles; clamp maximum delta time to 0.1s. | Measure CPU temperature and frame time stability during prolonged 15-min driving stress test. |
| **RSK-003** | **Integrated GPU Draw Call Bottleneck**: Intel UHD G1 integrated graphics suffers severe fill-rate and draw-call drops above 150 calls. | High | High | Merge static block geometry; utilize Babylon Thin Instances for all trees, street lamps, and barriers; aggressive frustum culling. | Frame debugger inspection: Draw calls must remain < 150 in dense city center. |
| **RSK-004** | **Texture VRAM Exhaustion**: Decompressed raw PNG/JPG textures exhaust shared system memory and crash the graphics driver. | High | High | Mandatory glTF KTX2 / Basis Universal compressed textures (`KHR_texture_basisu`); max texture dimensions 1024×1024 for buildings, 512×512 for props. | Texture memory profiler audit verifying VRAM usage stays < 128 MB. |
| **RSK-005** | **WebGPU Driver & Platform Fragmentation**: Certain Linux distros, older Androids, and older iOS versions fail to initialize WebGPU. | Medium | High | Automatic fallback to WebGL 2 via `EngineFactory.CreateAsync`; feature-guard any WebGPU-specific compute shaders. | Dual-browser automated test: Verify clean launch in Chrome (WebGPU) and Firefox default (WebGL 2). |
| **RSK-006** | **Browser Context Loss / Tab Suspension**: Mobile OS or desktop sleep triggers WebGL context loss or WebGPU device loss. | Medium | Medium | Register `webglcontextlost` and `device.lost` observers; pause simulation when `document.hidden`; gracefully reload assets on restore. | Simulate context loss via `WEBGL_lose_context` extension; verify clean recovery. |
| **RSK-007** | **Physics Simulation CPU Stutter (Havok WASM)**: Large numbers of dynamic rigid bodies overwhelm single WASM thread. | Medium | Medium | Enable aggressive rigid-body sleeping (`PhysicsMotionType.DYNAMIC` sleeps when kinetic energy < threshold); limit dynamic props to 30. | Havok debug viewer audit verifying 90%+ of resting props enter sleep state within 2.0s. |
| **RSK-008** | **World Streaming Stutter / Hitching**: Loading glTF chunks on the fly creates noticeable frame drops (garbage collection / shader compilation). | High | Medium | Asynchronous chunk fetching; distribute mesh instantiation over multiple frames; pre-warm shared PBR shader materials. | Frame time histogram: 99% of frames must remain under 22ms during high-speed transit. |
| **RSK-009** | **Mobile Touch Latency & High-DPI Overhead**: Rendering at native 3x retina resolution melts mobile batteries and drops FPS to < 20. | High | High | Clamp device pixel ratio (`Math.min(window.devicePixelRatio, 1.5)`); implement dedicated touch virtual stick with pointer events. | Test on iPhone and mid-tier Android; confirm 30–60 FPS with responsive touch steering. |
| **RSK-010** | **Intellectual Property Infringement**: Accidental inclusion of copyrighted names, vehicle models, or audio from commercial franchises (GTA). | Critical | Low | Strict clean-room policy; original IP naming guidelines; all external assets checked against CC0/MIT licenses before inclusion. | Code & asset audit: Scan all strings and assets for trademarked names. |
| **RSK-011** | **Scope Creep & Premature Complexity**: Attempting to implement multiplayer, massive procedural cities, or complex physics prematurely. | High | Medium | Rigid milestone progression (Phases 0–10); strict PRD boundaries; no downstream phase code permitted until current phase passes quality gates. | Milestone review prior to approving each new task. |
| **RSK-012** | **AI Agent Hallucination & Drift**: Coding agents claiming features are implemented when no code exists on disk. | High | High | Mandatory startup protocol in `AGENTS.md`; central persistent memory in `brain.md`; strict verification tags (`[VERIFIED]`, `[PROPOSED]`, `[UNVERIFIED]`). | Mandatory Git status, source inspection, and build checks at the start and end of every task. |

---

## 2. Risk Mitigation Protocols

### 2.1 The "Low-End First" Testing Protocol
No performance feature is accepted based on high-end desktop testing. All frame time and memory validations must be executed on the **Lenovo IdeaPad Slim 3i** baseline machine with background applications running, reflecting real-world player constraints.

### 2.2 Clean-Room Asset Verification Protocol
Before any 3D model, sound sample, or texture is added to the repository:
1. Verify license is CC0, MIT, or commercial-safe CC-BY.
2. Confirm the model does not reproduce real-world automotive trademarks (e.g., Ferrari, Porsche) or copyrighted game designs.
3. Record the license, author, and URL in `docs/ASSET_PIPELINE.md`.

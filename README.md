# Hooke's Law QWOP 🪑

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue.svg)](https://www.typescriptlang.org/)
[![Babylon.js](https://img.shields.io/badge/Babylon.js-9.8.0-purple.svg)](https://www.babylonjs.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0.13-yellow.svg)](https://vitejs.dev/)

A hyper-casual physics game inspired by QWOP, built on a custom MVC framework using Babylon.js and the Havok physics engine. Developed in 2026 as the ninth simulation of the SHIFT series, with AI-assisted code generation for the physics and game logic layers.

### [🎮 Play Now!](https://fisicagames.com.br)

---

## 📄 Table of Contents

* [About the Game](#-about-the-game)
* [Key Features](#-key-features)
* [How to Play](#-how-to-play)
* [Tech Stack](#-tech-stack)
* [Installation and Setup](#-installation-and-setup)
* [Architecture and Technical Highlights](#-architecture-and-technical-highlights)
* [License](#-license)
* [Author](#-author)

---

## 📖 About the Game

**Hooke's Law QWOP** is an interactive simulation and physics-based challenge in which the player controls the four spring-connected feet of a table, trying to push it as far as possible without letting it fall over.

Each foot is connected to the tabletop by a configurable helical spring. The player can tune physical parameters — spring stiffness, damper coefficient, foot mass, table mass, and gravity — using in-game sliders, making the simulation a hands-on exploration of classical mechanics concepts such as spring-mass systems, damped oscillations, and rigid-body dynamics.

The project serves as an educational tool for Physics and Engineering courses, making Newtonian dynamics and Havok's rigid-body physics tangible and playable.

---

## ✨ Key Features

* **Havok Rigid-Body Physics:** Full 3D rigid-body simulation powered by the Havok physics engine (v2 API), including spring forces, damping, and mass properties configurable at runtime.
* **Tunable Physical Parameters:** Five in-game sliders let players adjust spring stiffness `k` (N/m), damping coefficient `b` (N·s/m), foot mass (kg), table mass (kg), and gravitational acceleration (m/s²) in real time.
* **Key & Lock Progression:** Collectible keys appear along the track every 10 meters; each key unlocks one slider, enabling parameter tweaking as a reward mechanic.
* **Live Distance & Velocity HUD:** The HUD displays current distance, current velocity, personal best distance, and personal best velocity, all updated every frame.
* **Persistence:** Best distance and best velocity are automatically saved via `localStorage` and restored across sessions.
* **Sound Design:** Background music activates on the first user interaction; a dedicated impact sound effect plays when the table falls, while the music pauses until the player restarts or returns to the menu.
* **Responsive and Multilingual:** Fully optimized for desktop and mobile browsers, with native support for Portuguese and English. Language detection is automatic and can be toggled in-game.

---

## 🕹 How to Play

**Objective:** Push the table as far down the track as possible before it tips over.

#### Controls

💻 **On PC / Keyboard:**

* **[ Q ]** : Push the front-left foot upward.
* **[ W ]** : Push the front-right foot upward.
* **[ O ]** : Push the rear-left foot upward.
* **[ P ]** : Push the rear-right foot upward.
* **[ Space ]** : Reset the table to its starting position.

📱 **On Mobile / Touch:**

* **[ Q ] [ W ] [ O ] [ P ]** buttons: on-screen touch buttons mirroring the keyboard layout for each foot.
* **[ ↺ Reset ]** button: resets the table and resumes background music.

#### Tips

* Alternate foot pushes rhythmically to create a stable forward propulsion.
* Collect 🔑 keys scattered along the track to unlock parameter sliders.
* Use a higher damping coefficient to stabilize wobble; reduce it for faster, riskier runs.
* Lowering gravity (slider) creates a slow-motion experience useful for learning the timing.

---

## 🛠 Tech Stack

| Tool                                             | Version | Description                                                                    |
| ------------------------------------------------ | ------- | ------------------------------------------------------------------------------ |
| [TypeScript](https://www.typescriptlang.org/)    | 6.0.3   | Core language, providing type safety and robust architecture.                  |
| [Babylon.js](https://www.babylonjs.com/)         | 9.8.0   | Graphics engine for 3D rendering, particles, GUI, and AudioV2.                 |
| [@babylonjs/havok](https://www.babylonjs.com/)   | 1.3.12  | Havok rigid-body physics engine (WebAssembly), v2 API.                         |
| [Vite.js](https://vitejs.dev/)                   | 8.0.13  | Build tool with Rolldown, ES module tree-shaking, and single-bundle output.    |
| [Node.js](https://nodejs.org/en)                 | 26.1.0  | Development environment and runtime.                                           |
| [pnpm](https://pnpm.io/)                         | 10.33.0 | Fast, disk-efficient package manager.                                          |

Developed in a **Linux Arch (Kernel 7.0.9-arch1-1)** environment with **KDE Plasma**.

---

## 🚀 Installation and Setup

**Prerequisites:** Node.js (v20+), pnpm (v10+).

**Steps:**

1. Clone the repository.
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Start the development server:
   ```sh
   pnpm dev
   ```
4. Build for production (generates the `dist` folder):
   ```sh
   pnpm build
   ```

> **Note on the Havok WASM:** The file `HavokPhysics.wasm` must be present at `public/assets/wasm/HavokPhysics.wasm`. It is copied from `node_modules/@babylonjs/havok` and served as a static asset so the production bundle can locate it via a document-relative URL, bypassing Rolldown's asset hashing.

---

## 🏗 Architecture and Technical Highlights

The technological cornerstone of this project is its **custom MVC Framework written in TypeScript**, refined by the author across the SHIFT series and consolidating the **callback-based Mediator pattern** introduced in earlier simulations. This architecture allows the simulation to run natively in mobile browsers without requiring full-screen APIs or third-party app installations.

Data flow is strictly organized using the **Model-View-Controller (MVC)** pattern via callbacks:

* **Model:** A render-agnostic layer that manages game state, best-score persistence via `localStorage`, and music lifecycle (play, pause, game-pause, game-resume). Exposes `pauseMusic()` and `resumeMusic()` hooks consumed by the Controller on GAMEOVER and restart events.
* **View:** Constructs the dual-layer GUI — a JSON-driven menu GUI layer (Babylon GUI Loader) overlaid with a runtime-built HUD layer for the QWOP game. Manages a reactive translation chain (`LanguageSwitcher`) and fires `onLanguageChange` events consumed by the active `QWOPGame` instance.
* **Controller:** Registers all user-interaction callbacks, wires the game-over and game-resume music hooks to `QWOPGame`, and orchestrates scene lifecycle (launch, dispose, menu transitions).

#### Physics Architecture

The `QWOPGame` class is fully self-contained:

* Initializes its own **Havok plugin** with a document-relative WASM URL, avoiding Rolldown's `import.meta.url` path-resolution issues in production.
* Registers `RegisterJoinedPhysicsEngineComponent()` explicitly at runtime to counter Rolldown's aggressive tree-shaking of BabylonJS side-effect modules.
* Applies spring forces (`F = -k·Δx`) and damping (`F = -b·v_rel`) each frame using pre-allocated `Vector3` scratch vectors to minimize garbage collection pressure.
* Helical spring meshes are updated via parametric `CreateTube` with an `instance` reference, avoiding mesh recreation per frame.

#### Audio Architecture

Background music uses **BabylonJS AudioV2** (`CreateSoundAsync`), which requires an explicit user gesture to unlock the audio context. The music starts as enabled by default and uses `engine.unlockAsync()` internally, so it begins on the player's first click (the Start button). A separate `gamePause()` / `gameResume()` state — independent of the user's mute toggle — allows GAMEOVER to pause music without losing the user's preference.

#### AI-Assisted Code Generation

This simulation continues the AI-assisted workflow established in the SHIFT series. The Havok physics integration, spring-damper game loop, GUI architecture, and audio state machine were developed through iterative prompts to **Claude Sonnet 4.6 (Anthropic)**, with the developer validating behavior and physics correctness at each step.

---

## 📸 Screenshots

<!-- Add screenshots here when available, e.g.:
<p align="center">
  <img src="image/README/screenshot1.png" width="30%" alt="Hooke's Law QWOP screenshot 1" />
  <img src="image/README/screenshot2.png" width="30%" alt="Hooke's Law QWOP screenshot 2" />
</p>
-->

---

## 📜 License

### Source Code

The source code in this repository is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file.

### Visual Assets

3D models, textures, and original visual content created by the author are licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

### Audio Assets

Music and sound effects in this project are sourced from [Pixabay](https://pixabay.com/) under the [Pixabay Content License](https://pixabay.com/service/license-summary/), which permits free use including for commercial purposes.

### Third-Party Libraries

* **Babylon.js** — Apache License 2.0
* **Havok Physics** — See [@babylonjs/havok](https://www.npmjs.com/package/@babylonjs/havok) license terms
* **Vite.js** — MIT License

**Copyright © 2026 Rafael João Ribeiro.**

---

## 👨‍🔬 Author

Developed by:
**Prof. Dr. Rafael João Ribeiro**
Federal Institute of Paraná (IFPR)
[www.fisicagames.com.br](https://www.fisicagames.com.br)

---

## 📊 Commit Types — Verb Cheat Sheet

This table summarizes the commit types used in the project, along with common verbs to start commit messages following best practices (imperative mood, present tense).

| Type         | Purpose                                                              | Common verbs (imperative)                   |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------- |
| **feat**     | Introduce a new feature or functionality                             | add, implement, introduce, create           |
| **fix**      | Fix a bug or incorrect behavior                                      | fix, correct, resolve, prevent              |
| **perf**     | Improve performance (CPU, GPU, memory, bundle size)                  | optimize, improve, reduce, enhance          |
| **refactor** | Restructure code without changing external behavior                  | refactor, reorganize, simplify, restructure |
| **style**    | Adjust visual aspects (UI, colors, layout, fonts)                    | adjust, update, tweak, refine               |
| **docs**     | Documentation updates (README, comments, license)                    | add, update, improve, clarify               |
| **build**    | Build system, bundler (Vite/Rolldown), dependencies, configuration   | configure, update, adjust, setup            |
| **chore**    | Maintenance tasks, cleanup, assets, non-functional changes           | clean, remove, update, organize             |
| **balance**  | Gameplay tuning (physics parameters, difficulty, progression)        | adjust, rebalance, tune, update             |
| **physics**  | Changes to the Havok integration or spring-damper mechanics          | tune, fix, update, reconfigure              |

### ✅ Examples

```text
feat(game): add key & lock progression mechanic
fix(wasm): resolve HavokPhysics path in production build
perf(physics): preallocate Vector3 scratch vectors to reduce GC
refactor(audio): separate game-pause from user mute state
style(hud): reduce font size in top stats bar
build(vite): configure wasm asset path without hash
chore(assets): add impact sound effect for table fall
balance(physics): adjust default spring stiffness to 60 N/m
physics(havok): register joinedPhysicsEngineComponent explicitly
```

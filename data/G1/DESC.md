# Project G1 — 3D Anti-Gravity Space Tunnel Racing Engine

> **Role:** Lead Graphics & Engine Programmer  
> **Company:** PT. Technology & Engineering Simulation (T&E)  
> **Domain:** 3D Graphics Engines, Real-Time Physics, Procedural Geometry, Custom Shaders  
> **Tech Stack:** C++, Microsoft DirectX 9, HLSL (High-Level Shader Language), Win32 API  

---

![Project G1: Real-time Anti-Gravity Space Tunnel Racing Engine Prototype (DirectX 9 / C++)](G1.mp4)

## 1. The R&D Sandbox: Pushing PC Silicon to the Limit

Before throwing our engineering team into high-stakes military defense contracts, the leadership at **PT. Technology & Engineering Simulation (T&E)** commissioned an open R&D exploration initiative. 

The mandate was clear:
- Build a cutting-edge real-time 3D simulation engine completely from scratch.
- Master direct GPU pipeline programming through **DirectX 9** and **HLSL**.
- Implement advanced vehicle kinematics, procedural geometry generation, and high-frame-rate rendering without relying on commercial off-the-shelf game engines.

The result of this intensive sandbox was **Project G1**—a futuristic, high-velocity anti-gravity space tunnel racing prototype.

---

## 2. Core Technical Architecture

### 2.1 Direct Hardware Pipeline (C++ & DirectX 9)
Project G1 was engineered directly against the Win32 API and DirectX 9 graphics pipeline:
- Zero dependency on third-party frameworks or bloated middleware.
- Custom math library executing 3D vector, matrix, and quaternion transformations.
- Optimized vertex buffer and index buffer memory management to minimize draw calls and state switches.

### 2.2 Procedural Tunnel Geometry & Spline Interpolation
- **Continuous Tunnel Extrusion:** Rather than static polygonal corridors, the tunnel structure was generated procedurally along 3D mathematical space curves (cubic Hermite / Catmull-Rom splines).
- **Camera Spline Dynamics:** The virtual cockpit camera executed smooth velocity-dependent spline interpolation with authentic centrifugal roll and bank angles as the craft negotiated supersonic turns.
- **Dynamic Energy Rails:** Luminescent wireframe guidance rails and segmented translucent canopies rendered using custom HLSL pixel shaders with additive alpha blending.

### 2.3 Cockpit Avionics & HUD Rendering
- Real-time projected heads-up display (HUD) rendered in screen space:
  - Velocity vector indicators and longitudinal acceleration cues.
  - Dynamic 3D targeting reticles and orientation rings aligned with the track horizon.
  - Multi-layered cockpit framing providing depth perception during high-speed traversal.

---

## 3. Heritage & Impact

Project G1 was the crucible that validated our engineering foundation. The algorithms, shader architecture, and mathematical discipline developed during G1 directly empowered our team to tackle complex military defense programs:
- The custom 3D rendering pipeline and coordinate transformation math formed the core of our early synthetic vision Image Generators (IG).
- The high-speed networking and state extrapolation concepts fed directly into our IEEE 1278 **`libDIS`** distributed simulation engine for the **ACV-300 Adnan** armored combat vehicle.
- It cemented our team's reputation as engineers who could build complex, low-level real-time software systems from raw mathematical first principles.

---

*Preserved Demonstration: `data/G1/G1.mp4` (Transcoded from original archival production master `23.G1.R6.flv`)*  
*Author: Uray Meiviar*

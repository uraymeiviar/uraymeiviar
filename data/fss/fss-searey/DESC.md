# SeaRey Elite Light Sport Amphibian Seaplane (MSFS)

**Role:** Avionics & Systems Integration Engineer  
**Domain / Tags:** MSFS SDK, Avionics Integration, Garmin G3X, Systems Simulation, Flight Sim  
**Timeline:** 2022  
**Organization:** FlightSim Studio AG  

## Executive Summary
Avionics and systems integration for the **SeaRey Elite**, an amphibious light sport aircraft developed for Microsoft Flight Simulator (MSFS). Serving as an early foundational stepping stone during the team's platform transition from X-Plane to the modern MSFS engine, this project involved integrating MSFS built-in avionics frameworks, configuring custom glass cockpit displays, and engineering the electrical and sub-system logic of the amphibious aircraft.

![SeaRey Elite cockpit in Microsoft Flight Simulator showing custom Garmin G3X glass instrumentation, engine telemetry, and Indonesian registration PK-FSS](Screenshot%202026-09-09%20005332.webp)

## Key Technical Highlights
- **Avionics & Glass Cockpit Integration:** Integrated Microsoft Flight Simulator's built-in avionics framework with custom glass panel instruments, configuring the Garmin G3X primary flight display and engine indication system.
- **Electrical & Subsystem Modeling:** Implemented the aircraft's multi-switch electrical bus distribution, master battery, alternator, bilge pump switches, and amphibious landing gear retraction actuators.
- **Cockpit Ergonomics & Interaction:** Configured interactive 3D cockpit clickspots, rotary knobs, and flight deck ergonomics (including the cockpit kneeboard flight plan display shown above with Indonesian registration `PK-FSS`).

---

## Detailed System Architecture & Engineering Notes

### 1. Requirements & Engineering Context
Following the transition from X-Plane scenery and plugin development to the next-generation Microsoft Flight Simulator platform, FlightSim Studio (FSS) established a strategic roadmap: before embarking on complex, multi-crew commercial airliners (such as the Embraer E-Jets program), the engineering team needed to master the intricacies of the modern MSFS SDK, CoherentGT rendering runtime, WebAssembly (Wasm) architecture, and flight model configuration.

The **SeaRey Elite**—a popular two-seat single-engine amphibious light sport aircraft manufactured by Progressive Aerodyne—was selected as an ideal agile project. Its versatile operating envelope (land and water takeoffs/landings) and modern glass cockpit provided an ideal crucible to build and refine the studio's aircraft integration pipeline.

### 2. Implementation Details & Systems Engineering
- **Glass Cockpit Instrumentation:** Integrated modern Garmin G3X touchscreen avionics, binding airspeed, barometric altimeter tape, vertical speed indicator, attitude director indicator, and moving map GPS navigation to the MSFS simulation variables (SimVars).
- **Engine Indication & Rotax Telemetry:** Mapped Rotax 912/914 engine parameters (manifold pressure, RPM, oil temperature, oil pressure, cylinder head temperature, and fuel flow) to digital gauge readouts with calibrated green/yellow/red operating bands.
- **Amphibious Operations & Water Handling:** Supported hydrodynamic hull parameters, gear-warning alarms for water landings, and bilge pump logic.

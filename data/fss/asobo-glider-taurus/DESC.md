# Pipistrel Taurus Motorized Glider (Official MSFS / Asobo Studio)

**Role:** Subsystems & Retraction Mechanism Engineer  
**Domain / Tags:** MSFS SDK, Asobo Studio, Pipistrel Taurus, Glider Systems, Mechanical Animation, Flight Sim  
**Timeline:** 2022  
**Organization:** FlightSim Studio AG (Co-Development with Asobo Studio)  

## Executive Summary
Co-developed the official **Pipistrel Taurus** motorized self-launching glider for Microsoft Flight Simulator (MSFS) under contract with **Asobo Studio**. 

The Pipistrel Taurus is an advanced two-seat side-by-side composite motorglider featuring an auxiliary engine mounted on a retractable dorsal mast behind the cockpit. For this official MSFS aircraft, I engineered key mechanical and electrical subsystems—focusing particularly on the electro-mechanical retraction/extension mechanism of the engine mast, propeller brake alignment logic, and cockpit engine management instrumentation.

![Pipistrel Taurus motorized glider soaring in Microsoft Flight Simulator with dorsal engine and propeller mast extended](Screenshot%202026-09-09%20005452.webp)

## Key Technical Highlights
- **Retractable Mast State Sequencer:** Engineered the multi-phase deployment and retraction logic: bay door opening, mast electrical actuator extension, ignition interlocks, propeller positioning brake, and aerodynamic drag penalties.
- **Engine Control & Interlock Safety Logic:** Implemented engine management logic preventing engine start until the mast is 100% locked upright, and preventing mast retraction until the propeller is stopped in the exact vertical orientation to clear fuselage doors.
- **Cockpit Instrumentation Integration:** Coupled engine RPM, cylinder head temperature, exhaust gas temperature, and battery telemetry to the glider's instrument panel.

---

## Detailed System Architecture & Engineering Notes

### 1. Requirements & Engineering Context
For the historic 40th Anniversary expansion of Microsoft Flight Simulator, Microsoft and Asobo Studio introduced official glider and soaring aerodynamics into the simulator. To offer pilots the ability to self-launch without a tow plane or winch, Asobo contracted FlightSim Studio to co-develop the **Pipistrel Taurus**.

While other team members handled 3D modeling and visual texturing, my focus was on the complex mechanical and electrical sub-system simulation required to operate the motorized mast.

### 2. Mechanical Sequencer Implementation Details
In a real Pipistrel Taurus, extending and retracting the engine is not an instantaneous toggle switch; it is a delicate multi-stage mechanical sequence:
1. **Extension Sequence:**
   - Pilot commands `MAST EXTEND`.
   - Fuselage dorsal bay doors unlatch and swing open.
   - Electric spindle drive raises the motor mast through an 8-second arc.
   - Limit microswitch triggers `MAST LOCKED UP`, illuminating an indicator lamp on the instrument panel.
   - Decompresses the engine, connects ignition power, and enables the electric starter.
2. **Retraction Sequence:**
   - Pilot cuts engine ignition.
   - Airflow windmills the propeller until airspeed drops or the pilot engages the mechanical propeller brake.
   - An optical sensor / microswitch detects when the propeller blades align vertically along the mast axis.
   - Propeller brake locks the shaft rigidly in place.
   - Actuator pulls the mast into the fuselage recess.
   - Bay doors close flush against the composite skin, restoring laminar low-drag soaring glide ratios.

I engineered the state machine and SimVar animation drivers that executed this sequence with high mechanical fidelity, ensuring that emergency bailouts, partial extensions, and electrical failures behaved with complete physical realism.

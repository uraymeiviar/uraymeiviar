# AIR Avionics / Dittel ACD-57 Multi-Function Radio & Altimeter (Official MSFS / Asobo)

**Role:** Avionics Device Software Engineer  
**Domain / Tags:** Avionics, MSFS SDK, Asobo Studio, Radio Navigation, C++ / JS, Altimeter  
**Timeline:** 2022  
**Organization:** FlightSim Studio AG (Contracted to Asobo Studio)  

## Executive Summary
Engineered the official **AIR Avionics / Dittel ACD-57** multi-function 57mm round cockpit instrument under contract from **Asobo Studio** (the primary developers of Microsoft Flight Simulator) for integration into official default aircraft. 

The ACD-57 is a compact, high-precision European avionics instrument that combines a VHF communications transceiver (with 8.33 kHz channel spacing), a certified precision barometric altimeter, and a transponder display into a single standard 57mm (2.25-inch) round instrument panel cutout.

![AIR Avionics ACD-57 main operational display in MSFS: Active VHF 118.200, Standby 121.500, moving vertical altimeter tape, baro setting 1013.3 hPa, and transponder FL000](Screenshot%202026-09-09%20003849.webp)

## Key Technical Highlights
- **Multi-Function Gauge Architecture:** Faithfully reproduced the multi-subsystem architecture of the physical hardware: VHF radio communication, precision altimetry, and transponder control integrated into one round display.
- **Precision Altimeter & Barometric Modeling:** Implemented the moving digital altimeter tape, digital readout, QNH barometric setting adjustment in both hectopascals (hPa) and inches of mercury (inHg), and standard pressure setting (1013.25 hPa / 29.92 inHg).
- **8.33 kHz / 25 kHz VHF Transceiver:** Programmed dual-channel frequency handling, active/standby flip-flop switching, emergency quick-tune (121.500 MHz), audio volume, and squelch control.
- **Sub-Menu Hierarchy & Calibration:** Implemented the full hardware menu tree—including altimeter calibration, display brightness, transponder squawk integration, and frequency channel presets.

![ACD-57 configuration and setup sub-menus: display options, altimeter zeroing, and frequency memory banks](Screenshot%202026-09-09%20004035.webp)

---

## Detailed System Architecture & Engineering Notes

### 1. The Asobo Studio Contract & Requirements
As Microsoft Flight Simulator expanded its fleet of gliders, light-sport aircraft, and European general aviation planes, Asobo Studio required authentic, real-world European avionics instruments that matched the exact visual and operational behavior of certified hardware. 

FlightSim Studio AG was contracted to deliver turnkey avionics instruments for default simulator aircraft. I personally led the software engineering of the instrument logic, rendering, and MSFS SimVar integration for the **ACD-57**.

```
=============================================================================
                  AIR AVIONICS ACD-57 ARCHITECTURAL TOPOLOGY
=============================================================================
  [ MSFS SimVars / Core ]             [ Hardware Inputs / 3D Knobs ]
   ├── COM 1 Active / Standby          ├── Dual Concentric Rotary Knobs
   ├── Indicated Altitude / QNH        ├── Push-to-Select / Flip-Flop Button
   └── Transponder Mode / Squawk       └── Menu / Power Button
             │                                     │
             ▼                                     ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                   ACD-57 CORE LOGIC & STATE MACHINE                     │
 │                                                                         │
 │   [ Radio Engine ]            [ Altimeter Engine ]    [ Transponder ]   │
 │   • 8.33 kHz Frequency Math   • Moving Tape Spline    • Squawk Sync     │
 │   • Active/Standby Flip-Flop  • QNH Conversion (hPa)  • Mode (SBY/ALT)  │
 │   • 121.5 Emergency Toggle    • Altitude Alert Buzzer • Flight Level    │
 └─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                       [ Vector Canvas Rendering ]
                        57mm Circular Glass Panel
=============================================================================
```

### 2. Implementation Details
- **Vector Graphics Rendering:** Rendered within MSFS using high-performance vector elements, ensuring crisp fonts, anti-aliased tape lines, and realistic LCD contrast across 4K displays and VR headsets.
- **Altimeter Tape Dynamics:** Modeled non-linear tape smoothing and damping to reflect pneumatic sensor lag without introducing visual stuttering.
- **Flight Level (FL) & Pressure Altitude:** Implemented Mode S flight level derivation directly from pressure altitude for the transponder sub-display.

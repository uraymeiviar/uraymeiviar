# Becker AR6201 VHF Transceiver (Official MSFS / Asobo)

**Role:** Avionics Device Software Engineer  
**Domain / Tags:** Avionics, MSFS SDK, Asobo Studio, VHF Radio, 8.33 kHz, C++ / JS  
**Timeline:** 2022  
**Organization:** FlightSim Studio AG (Contracted to Asobo Studio)  

## Executive Summary
Engineered the official **Becker Avionics AR6201** compact VHF transceiver under contract from **Asobo Studio** for integration into official default aircraft across Microsoft Flight Simulator (MSFS). 

Manufactured in Germany, the Becker AR6201 is one of the most widely deployed VHF communication radios in worldwide soaring, light sport, and general aviation. It features both 25 kHz and modern European 8.33 kHz channel spacing, dual concentric rotary tuning, built-in memory channels, battery voltage monitoring, and integrated intercom modes.

![Becker AR6201 VHF transceiver display in MSFS showing active frequency 121.600 MHz on channel 08, standby frequency, dual concentric rotary control, and mode status](Screenshot%202026-09-09%20004716.webp)

## Key Technical Highlights
- **Certified 8.33 kHz / 25 kHz Frequency Management:** Implemented full channel spacing selection adhering to European Commission regulations for 8.33 kHz channel separation alongside legacy 25 kHz tuning.
- **Dual Concentric Rotary Dial Interface:** Replicated the authentic two-speed tuning behavior—outer ring for MHz stepping and inner knob for kHz fractional channel increments.
- **Channel Memory & Quick-Select:** Modeled memory storage banks (such as channel `08` shown above storing `121.600 MHz`), direct frequency swap, and scan functions.
- **Diagnostics & Telemetry:** Modeled internal supply battery voltage monitoring, squelch adjustment (`SQL`), intercom volume (`IC`), and low-voltage alerts.

![Becker AR6201 operational states: memory channel recall, active frequency monitoring, and system configuration menus](Screenshot%202026-09-09%20004451.webp)

---

## Detailed System Architecture & Engineering Notes

### 1. Requirements & Engineering Context
When Asobo Studio prepared the glider and general aviation fleet for Microsoft Flight Simulator, they required high-fidelity, compact European radio avionics. As part of our studio contract with Asobo, I engineered the digital logic, LCD character matrix rendering, and state machines for the Becker AR6201.

### 2. Implementation Details
- **Dual-Tier State Machine:** Modeled the real-world operational states: Standard Frequency Mode, Direct Tune Mode, Memory Channel Mode, and Setup Configuration.
- **8.33 kHz Channel Numbering Math:** Implemented the standardized ICAO Annex 10 frequency-to-channel identification formulas, mapping displayed 6-digit channel labels to true RF transmission frequencies.
- **MSFS SimVar Synchronization:** Maintained continuous, jitter-free two-way synchronization between the virtual 3D cockpit knobs, radio hardware simulation, and Microsoft Flight Simulator's internal radio stack.

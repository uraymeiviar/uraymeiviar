# CodeGraph — In-House Visual Node-Based Integration Protocol & Middleware

> **Role:** Core Architecture & Middleware Designer  
> **Company:** PT. Technology & Engineering Simulation (T&E)  
> **Domain:** Distributed Middleware, Visual Programming, Hardware-in-the-Loop (HIL) Integration, Network Protocols  
> **Tech Stack:** C++, Network Sockets (Unicast/Multicast), Node-Graph Engine, Shared Memory IPC, Device Drivers  
> **Programs Deployed:** STMR Armored Platoon, BO-105 Testbed, CommSystem, F-16 FTD, SOYUT  

---

![Uray Meiviar inspecting the comprehensive CodeGraph node network connecting simulation subsystems; in the background sits the STMR armored cabin on its motion base](IMG_20130624_114947.webp)

## 1. The Integration Nightmare of Defense Simulators

In a complex mission simulator—whether a multi-crew tank, a supersonic fighter, or a tactical helicopter—dozens of disparate subsystems must exchange data in real time:
- The **Physics Engine** calculates 6-DOF accelerations and vehicle chassis velocities.
- The **Motion Platform** needs those accelerations converted into actuator leg stroke lengths.
- The **Control Loading System** needs aerodynamic hinge moments to drive stick motors.
- The **Avionics & Displays** require engine temperatures, hydraulic pressures, and navigation vectors.
- The **Hardware I/O** reads analog potentiometers, digital toggle switches, and circuit breaker relays.
- The **Acoustic Engine (`CommSystem`)** tracks vehicle speed, engine RPM, weapon fire triggers, and crew intercom voice.

Historically at T&E, linking these subsystems meant writing endless custom C++ glue code, hardcoded point-to-point network packets, and tangled shared-memory pointers. If a developer changed a variable name or added a new instrument, half the simulator codebase broke.

To eliminate this architectural fragility once and for all, I architected **CodeGraph**: a **core in-house communication protocol and visual node-based integration middleware**.

---

## 2. The Node, Pin & Socket Architecture

CodeGraph converted all simulator integration into a unified, visual data-flow architecture inspired by circuit schematics.

![CodeGraph visual nodes connecting audio device pins, volume gains, crosstalk feeds, and VHF radio channels](../commSystem/IMG-20131023-WA0004.webp)

### Standardized Typed "Pins" & "Sockets"
Every subsystem in the simulator was wrapped as an independent CodeGraph **Module Node**:
- A developer could write their module in isolation, exposing standard **Input Sockets** and **Output Pins**.
- Pins and sockets conformed strictly to the CodeGraph specification and could transport any arbitrary payload:
  - **High-Bandwidth Continuous Streams:** Audio buffers for `CommSystem`.
  - **Physical Dynamics Vectors:** 6-DOF linear accelerations ($\ddot{x}, \ddot{y}, \ddot{z}$) and angular rates ($p, q, r$) destined for motion platforms.
  - **Discrete Control Signals:** Simple boolean triggers for physical power relays, solenoids, or landing gear microswitches.
  - **Analog Telemetry:** High-precision floating-point values representing turbine torque, engine RPM, fuel flow, and airspeed.

---

## 3. Network Transparency: Unicast, Multicast & Hardware-to-Hardware

The true power of CodeGraph was its **total topological and network transparency**:
- Connecting an output pin of Node A to an input socket of Node B was purely declarative.
- **Local vs. Distributed:** If Node A and Node B resided on the same physical computer, CodeGraph routed the data via zero-copy shared memory. If Node A was on the flight dynamics server and Node B was on an instrument workstation across the room, CodeGraph automatically serialized the packet and transmitted it over the network via **Unicast or Multicast UDP**.
- **Device-to-Device Integration:** CodeGraph was not limited to software variable-to-variable passing: it bridged **physical devices directly to software logic and other physical hardware**. 
  - An input pin from an Arduino reading an analog potentiometer could be wired directly to a flight model throttle socket.
  - A flight model engine fire output pin could be wired directly to a physical relay driver node that tripped an emergency circuit breaker on the cockpit electrical wall.

---

## 4. Visual Authoring & Operational Impact

The visual editor allowed systems engineers to inspect, route, and debug the entire simulator's nervous system live on screen:
- **Live Visual Telemetry:** Data flowing across green connection wires could be monitored in real time, making troubleshooting instant—if a gauge didn't move, an engineer could see immediately whether the output pin was firing.
- **Hot-Swapping Subsystems:** Modules could be disconnected and re-routed without recompiling the simulator core.
- **Decoupled Team Collaboration:** The avionics team, flight dynamics team, audio team, and mechanical motion team could work completely in parallel, agreeing only on pin contracts.

CodeGraph became the invisible operational highway that tied PT. T&E Simulation's disparate technologies into a cohesive, rock-solid whole—powering the **STMR tank simulators, the BO-105 lab testbeds, the F-16 platform foundations, and the SOYUT strategic command system.**

---

*Document Author: Uray Meiviar*  
*Repository: [`uraymeiviar/data/T&E/codegraph`](https://github.com/uraymeiviar/uraymeiviar/tree/main/data/T&E/codegraph)*

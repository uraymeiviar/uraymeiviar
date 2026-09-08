# nvstat: High-Performance Linux NVIDIA GPU State & BIOS Telemetry Utility

**Architect & Engineer:** Uray Meiviar  
**Role:** Systems Programmer & Linux Infrastructure Engineer  
**Period:** 2017 – 2018  
**Domain:** Linux Systems Programming, GPU Kernel Interfaces, Hardware Telemetry, Cluster Management  
**Core Technologies:** Linux (x86_64), C/C++, NVIDIA NVML & Kernel Driver IOCTL (`/dev/nvidia*`), PCIe Configuration Space (`/sys/bus/pci`), VBIOS Subsystem Decoding, ANSI Terminal Graphics, CryptoSlax

---

## Executive Summary

Operating a 330 kVA industrial computing facility with hundreds of graphics cards distributed across high-density 12-GPU compute rigs (such as GTX 1080 Ti clusters pulling 3,000 Watts per node) required continuous, high-frequency hardware health monitoring.

The standard vendor tool, `nvidia-smi`, was inefficient for automated watchdog loops: it suffered from substantial process execution overhead (~200–500ms latency), heavy memory allocation, and generic device reporting that identified every board merely as `"GeForce GTX 1080 Ti"` without distinguishing board partner manufacturers.

To solve this, I engineered **`nvstat`**—a standalone, lightweight C/C++ Linux command-line utility. By interfacing directly with NVIDIA kernel driver ioctl endpoints, NVML, and PCIe sysfs descriptors, `nvstat` provides a sub-5-millisecond status matrix displaying power, thermal thresholds, fan speeds, core/memory clocks, and exact manufacturer names parsed directly from the GPU VBIOS.

---

## 1. The Bottlenecks of Standard Vendor Tooling

In high-density GPU mining facilities, seconds matter:
1. **Watchdog Invocation Overhead:** Automated bash and Python watchdogs queried GPU states every few seconds to prevent thermal runaway. Spawning `nvidia-smi` repeatedly created high context-switching overhead and CPU spikes that interfered with real-time mining threads.
2. **Ambiguous Hardware Reporting:** Commercial mining racks routinely mixed graphics cards from different AIB (Add-In Board) manufacturers—such as MSI, ZOTAC, EVGA, Gigabyte, and NVIDIA Founders Edition. Because each vendor utilized distinct cooler designs, VRM layouts, and stock fan curves, a generic `"GeForce GTX 1080 Ti"` readout failed to identify which physical card was overheating on the rack.
3. **Slow Diagnostics Over SSH:** System administrators connecting over remote SSH sessions needed an instantaneous, high-density readout that fit comfortably within a standard terminal window without scrolling.

---

## 2. Low-Level Architecture & Implementation

```
=============================================================================
                     NVSTAT ARCHITECTURE & TELEMETRY
=============================================================================
  [ Terminal Command: nvstat ] (Invoked via SSH / Automated Watchdog)
                │
                ├──> [ PCIe Configuration Space: /sys/bus/pci/devices/ ]
                │     ├── Read Subsystem Vendor ID (e.g., 0x1462 = MSI, 0x19da = ZOTAC)
                │     ├── Read Subsystem Device ID (Board Revision / SKU)
                │     └── Match against PCI ID Database ──> Board Partner Name
                │
                └──> [ NVIDIA Kernel Driver IOCTL / NVML ] (/dev/nvidiactl, /dev/nvidia*)
                      ├── Query Clocks (Current & Max Core / Memory MHz)
                      ├── Query Power (Current Draw, Power Limit, Max Limit)
                      ├── Query Thermals & Fan Tachometer Speed (%)
                      └── Query P-State & GPU / Memory Controller Load (%)
                │
                ▼
  [ ANSI Color-Coded Terminal Formatter ] ──> Output generated in < 5ms
=============================================================================
```

`nvstat` bypasses heavy userland abstractions:
- **Direct IOCTL Queries:** Interacts directly with the `/dev/nvidia*` character devices to poll hardware sensor registers with near-zero CPU overhead.
- **VBIOS Subsystem Parsing:** Reads the PCIe configuration space directly from Linux `sysfs` (`/sys/bus/pci/devices/0000:<bus>/subsystem_vendor` and `subsystem_device`). By cross-referencing these 16-bit IDs, it accurately discloses the actual board partner:
  - `Micro-Star International Co., Ltd. [MSI] GP102 [GeForce GTX 1080 Ti]`
  - `ZOTAC International (MCO) Ltd. GP102 [GeForce GTX 1080 Ti]`
  - `NVIDIA Corporation GP102 [GeForce GTX 1080 Ti]` (Founders Edition)
- **Zero Dependencies:** Statically compiled into an ultra-lean binary (< 200 KB) with no external library requirements, making it seamlessly embeddable into RAM-booted Linux distributions.

![nvstat terminal output across a 12-GPU GTX 1080 Ti cluster showing power, clocks, thermals, fan speeds, and exact VBIOS hardware names](nvstat-screenshot.webp)

---

## 3. High-Density Telemetry Matrix

As shown in the live cluster capture on node `NV236` (`192.168.1.236`), `nvstat` formats complex multi-GPU states into an intuitive single-screen matrix:

| Column | Metric | Engineering Purpose |
| :--- | :--- | :--- |
| `#:Bus` | GPU Index & PCIe Bus ID | Maps the card directly to the physical motherboard riser slot (e.g., `0:0x01` to `11:0x0D`). |
| `Pwr` | Real-Time Power Draw | Measures actual wattage consumption (e.g., 206W–228W). |
| `PL` | Power Limit Set | Displays the active software-enforced TDP cap (e.g., 220W, 194W, 156W). |
| `PM` | Power Maximum Ceiling | The hardware limit defined by the VBIOS (e.g., 300W, 330W, 350W). |
| `PS` | Performance State | Verifies that GPUs operate in the `P2` compute performance state without throttling to `P5`/`P8`. |
| `CU` | Compute Core Load (%) | Confirms compute saturation across CUDA cores (consistently 93%–100%). |
| `MU` | Memory Controller Load (%) | Measures GDDR5X memory controller bus utilization (typically 14%–17%). |
| `F` | Fan Tachometer Speed (%) | Verifies active cooling (e.g., 99%–100%). |
| `T` | Core Temperature (°C) | Real-time thermal telemetry with color-coded ANSI warning thresholds. |
| `Core` / `CM` | Core Clock (Actual / Max) | Live core frequency vs. maximum boost target (e.g., 1657 MHz / 1974 MHz). |
| `Mem` / `MM` | Memory Clock (Actual / Max) | Live memory clock vs. maximum frequency (e.g., 5005 MHz / 5505 MHz). |
| `Name` | Board Partner & VBIOS SKU | Discloses exact AIB partner identity and GPU silicon die stepping (`GP102`). |

### 3.1 Instant Hardware Fault Identification
The dense matrix provides immediate visual cues during hardware anomalies:
- **Failed Cooling Fan Detection:** In the live screenshot, **GPU 8 (`8:0x0A`)** shows a fan speed of **`0`%** with an elevated temperature of **`79°C`**, while neighboring cards run between 51°C and 72°C with fans at 99%. `nvstat` immediately flagged the stalled fan blade, allowing technicians to replace the defective cooler before thermal degradation occurred.
- **Power Throttling Diagnostics:** **GPU 10 (`10:0x0C`)** shows power draw capped at **`156W`** with clock throttled to **`1569 MHz`**, instantly revealing an aggressive undervolt limit.

---

## 4. CryptoSlax Integration & Deployment

`nvstat` was integrated natively into the **CryptoSlax** stateless operating system:
- Embedded on the master PXE boot server, `nvstat` was automatically available on `$PATH` across all cluster nodes (`NV001` through `NV250+`).
- Used as the core sensor probe for local automated daemon watchdogs, triggering hardware power relay cycles if temperatures exceeded 85°C or if GPU compute load dropped below 50%.

---

## 5. Key Engineering Takeaways

- **Low-Level Hardware Access:** Mastered direct interaction with NVIDIA proprietary kernel drivers and PCIe configuration space without relying on heavy third-party SDKs.
- **Diagnostic Efficiency:** Replaced slow vendor tools with a sub-5ms binary that accelerated cluster monitoring by two orders of magnitude.
- **Industrial Telemetry Design:** Designed ANSI-formatted terminal visualization engineered specifically for rapid human triage in mission-critical computing environments.

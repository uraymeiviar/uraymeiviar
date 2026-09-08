# netEngine — High-Performance Reliable UDP Networking Engine for Unity

> **Role:** Network Architect & Engine Developer (Consultant for Agate Studio)  
> **Customer:** Agate Studio (Bandung, Indonesia)  
> **Domain:** Real-Time Multiplayer Networking, Low-Latency Protocols, Zero-Allocation Memory  
> **Timeline:** 2019 – 2020  
> **Tech Stack:** C#, Unity Engine, UDP Sockets, Sliding-Window Reliability, Zero-GC Buffer Pools, WebAssembly (Emscripten)  

---

![Live multiplayer match running netEngine: synchronizing native desktop client (DESKTOP-0NGJB) with WebAssembly browser client (emscripten/web)](105551411-452a9300-5d35-11eb-807a-d721e8954bb9.webp)

## 1. The Agate Connection: Bringing Defense Networking to Commercial Games

Following the collapse and indefinite layoffs at PT. T&E Simulation, my network engineering background opened new freelance doors. One of the co-founders of **Agate Studio**—Indonesia’s largest and most successful video game development company, headquartered in Bandung—was a longtime friend. 

Agate was scaling up production of real-time multiplayer titles in Unity, but they had hit an architectural wall common across the game development industry: **Unity’s networking solutions were notoriously inadequate.**
- Unity's built-in networking library (**UNet**) was bloated, prone to mysterious connection drops, and was officially being deprecated.
- Commercial third-party networking solutions (like Photon) were expensive, relied on closed cloud relays, and imposed strict concurrency pricing models.
- **TCP was fundamentally unusable:** TCP’s guaranteed in-order stream semantics introduce fatal **head-of-line blocking**. If a single packet drops on a mobile cellular connection, TCP halts all subsequent packets until the missing frame is retransmitted, causing catastrophic latency spikes in fast-paced action games.
- Raw **UDP** avoids head-of-line blocking, but it is raw, connectionless, and unordered: packets can arrive duplicate, scrambled, or disappear completely.

Agate needed a bespoke, rock-solid multiplayer networking engine tailored for Unity. They asked me to architect and build it: **`netEngine`**.

---

## 2. Core Protocol Architecture: Custom Reliable UDP

Drawing upon the mathematical and protocol lessons I had mastered while developing **`libDIS`** for military simulators, I designed `netEngine` as a custom protocol layer executing over raw UDP sockets in C#.

```
=============================================================================
                      NETENGINE PACKET HEADER ARCHITECTURE
=============================================================================
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Protocol ID          |          Packet Type          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      Ack (Latest Received)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   Ack Bitfield (Previous 32)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Payload Channel (Reliable/Unreliable) |   Payload Data ...    |
=============================================================================
```

### Sliding-Window ACK Bitfield
Rather than sending discrete ACK packets—which doubles network overhead—`netEngine` embedded a **32-bit sliding acknowledgment bitfield** into every single outgoing packet header:
- Each packet carried the sequence number of the most recently received packet (`Ack`), followed by a 32-bit integer bitfield representing the receipt status of the previous 32 packets.
- This allowed `netEngine` to acknowledge up to 33 incoming packets with zero dedicated ACK packets, providing continuous, low-overhead round-trip telemetry.

### Dual Channel Multiplexing
Games require different transmission guarantees for different types of data:
1. **Unreliable / Unsequenced Channel:** Used for continuous, high-frequency state updates (player movement vectors, rotational heading, throttle inputs). If packet #102 is lost, it is irrelevant because packet #103 is already in transit. Drops are silently discarded without retransmission.
2. **Reliable / Sequenced Channel:** Used for discrete, mission-critical gameplay events (weapon firing, damage application, player death, round start/end, item pickup). If an ACK is not received within the dynamically calculated round-trip window, `netEngine` immediately resends the packet.

---

## 3. The Zero-Allocation Memory Architecture (Zero GC)

In game development with C# and Unity, dynamic heap allocations (`new byte[]`, object instantiation) are catastrophic. 

Managed memory allocations trigger the Mono / IL2CPP **Garbage Collector (GC)**. When the garbage collector runs its mark-and-sweep cycle, it causes a momentary CPU freeze—a noticeable **micro-stutter** or dropped frame. In competitive multiplayer games, a 50ms GC freeze will cause a player to miss an opponent's shot and lose a match.

I engineered `netEngine` with an uncompromising **zero-allocation architecture**:
- **Fixed Circular Ring Buffers:** Outgoing and incoming packet queues were pre-allocated in unmanaged or pinned memory pools upon client initialization.
- **Reusable Byte Buffers:** Network serialization and deserialization reused fixed byte buffers passed by reference, completely banishing `new` allocations from the active network loop.
- **Result:** During high-intensity 60 FPS multiplayer firefights with dozens of players exchanging packets, **`netEngine` generated exactly 0 bytes of garbage collection overhead per frame.**

---

## 4. Cross-Platform Execution & WebAssembly (Emscripten)

Modern commercial games must run everywhere. I architected `netEngine` to be completely platform-agnostic:
- **Native Desktop & Mobile:** Executing over high-throughput C# asynchronous socket abstractions on Windows, macOS, iOS, and Android.
- **WebAssembly (Emscripten / WebGL):** Because web browsers do not permit raw UDP socket access due to security sandboxing, I engineered a seamless transport fallback that bridged the packet pipeline to WebSockets or WebRTC data channels when compiling to WebAssembly.

As demonstrated in the test match screenshot above, `netEngine` effortlessly synchronized native desktop clients (`DESKTOP-0NGJB`) with in-browser WebAssembly clients (`emscripten/web`), ensuring deterministic gameplay across completely different runtime environments.

![netEngine: Real-time Multi-Client Network Synchronization Demo (Desktop & Browser)](netengine.mp4)

---

## 5. Engineering Legacy

Building `netEngine` was a satisfying return to pure protocol design. It proved that the mathematical principles governing real-time military simulation—deterministic bandwidth conservation, sliding-window reliability, and zero-allocation memory discipline—translate directly into high-performance commercial video game architectures.

---

*Document Author: Uray Meiviar*  
*Repository: [`uraymeiviar/data/netengine`](https://github.com/uraymeiviar/uraymeiviar/tree/main/data/netengine)*

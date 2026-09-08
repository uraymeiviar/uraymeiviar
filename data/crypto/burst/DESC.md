# Burstcoin Ecosystem & Cloud Infrastructure: Proof-of-Capacity, Explorers & Mining Pools

**Architect & Engineer:** Uray Meiviar  
**Role:** Core Contributor & Cloud Infrastructure Architect  
**Period:** 2014 – 2017  
**Domain:** Blockchain Consensus (Proof-of-Capacity), Distributed Systems, Cloud Architecture, High-Availability Web Services  
**Core Technologies:** AWS (EC2, VPC, Route 53), Google Cloud Platform (GCP), Node.js, JavaScript, Shabal-256 Hash Function, Proof-of-Capacity (PoC), Nginx, Redis

---

## Executive Summary

During the peak evolution of the cryptocurrency landscape, the **Burstcoin** project introduced a groundbreaking alternative to energy-intensive Proof-of-Work (PoW): **Proof-of-Capacity (PoC)**. Rather than burning gigawatts of electricity executing SHA-256 or Scrypt hashes on GPUs and ASICs, PoC utilized pre-computed cryptographic plot files stored on hard drives using the Shabal-256 hashing algorithm.

Fascinated by the mathematical efficiency of Proof-of-Capacity, I joined the project as a core ecosystem contributor, collaborating directly with the pseudonymous core developer. I engineered:
1. **The Official Burstcoin Blockchain Explorer:** A high-throughput web platform parsing real-time blockchain telemetry, asset transfers, and address balances.
2. **The Web-Based Online Wallet:** A client-side browser wallet allowing global users to manage private keys and broadcast transactions without downloading the entire blockchain.
3. **High-Availability Burst Mining Pool:** An automated multi-tenant mining pool orchestrating deadline submissions and reward distributions for hundreds of miners globally.

Crucially, operating these public mission-critical services served as my **gateway into enterprise cloud architecture (AWS and Google Cloud Platform)**, migrating infrastructure away from unstable residential internet in Indonesia to fault-tolerant global cloud availability zones.

---

## 1. The Proof-of-Capacity Paradigm

Unlike Bitcoin and Ethereum which calculate hashes in real time, Burstcoin traded computation time for storage space:
- **Plotting Phase:** Hard drives were filled with pre-computed hashes using the 256-bit **Shabal** cryptographic algorithm, structured into nonces containing 4,096 scoops.
- **Mining Phase:** For each new block (every ~4 minutes), miners read only a single 64-byte scoop per nonce from disk, computing a numerical "deadline" (the time elapsed before a block can be forged). The miner with the lowest deadline wins the right to forge the block.
- **Power Efficiency:** Hard drives consumed a fraction of the power required by multi-GPU racks, enabling green, silent decentralized consensus.

---

## 2. Subsystem Architecture & Implementation

### 2.1 The Burstcoin Blockchain Explorer
To make the blockchain transparent and accessible, I engineered the public **Blockchain Explorer**:
- **Real-Time Block Ingestion:** Built on Node.js, the backend continuously polled the Burst daemon RPC socket, deserialized raw binary block payloads, and indexed transaction inputs/outputs into a fast in-memory cache.
- **Rich Telemetry:** Visualized block generation deadlines, total network plot capacity (measured in Petabytes), block reward halving schedules, and token transfer history.
- **Asset Exchange Tracking:** Decoded on-chain smart tokens and decentralized asset trades directly from transaction payloads.

![Burstcoin Blockchain Explorer Dashboard showing live blocks, network capacity, and transaction metrics](burstExplorer/0A5BOVN.webp)

### 2.2 The Browser-Based Web Wallet
Prior to web wallets, users were forced to download the full Java-based client and synchronize hundreds of thousands of blocks locally.
- I co-developed an ultra-responsive **Web-Based Wallet** enabling instant onboarding.
- **Client-Side Cryptography:** Private keys were generated and kept strictly in browser memory using client-side JavaScript passphrase hashing (`SHA-256` / `Curve25519`). Unsigned transactions were constructed locally and only the cryptographically signed bytecode was transmitted to the backend node, ensuring zero-trust security.

### 2.3 Operating the High-Availability Mining Pool
Individual miners with small hard drives (e.g., 2 TB to 10 TB) faced extreme variance in winning solo block rewards. I architected and operated a global **Burst Mining Pool**:
- **Deadline Aggregation:** Miners pointed their local plot-reader software (such as `burst-miner` or `gpu-plot-checker`) to my pool endpoint.
- **Lowest-Deadline Tracking:** The pool evaluated incoming deadlines, submitted the lowest deadline to the Burst blockchain network, and collected block rewards.
- **Proportional Payout Engine:** Automated payout scripts distributed block rewards among miners proportionally based on the difficulty of the shares they submitted, maintaining a provably fair ledger.

![High-Availability Burst Mining Pool dashboard displaying active miners, hash capacity, and share deadlines](burstPool/udFKiTX.webp)

---

## 3. The Cloud Crucible: Migrating to AWS & Google Cloud

```
=============================================================================
             HIGH-AVAILABILITY CLOUD INFRASTRUCTURE (AWS / GCP)
=============================================================================
 [ Global Miners & Users ] ──> Cloudflare Anycast CDN & DDoS Mitigation
                                            │
                                            ▼
 [ Amazon Route 53 ] ─────────> Geo-DNS Routing / Automated Health Checks
                                            │
                                            ▼
 [ AWS Elastic Load Balancer ] > SSL/TLS Termination & Reverse Proxy
                                            │
                 ┌──────────────────────────┴──────────────────────────┐
                 ▼                                                     ▼
   [ AWS EC2 Compute Node ]                              [ GCP Compute Engine Node ]
   - Burst P2P Full Daemon                               - Web Wallet & Explorer API
   - Mining Pool Socket Server                           - Redis In-Memory State Cache
   - Automated Payout Engine                             - Hot Standby RPC Failover
=============================================================================
```

### 3.1 The Failure of Residential Hosting
When I initially launched the mining pool and explorer, I attempted to host them on physical servers inside my residential workshop in Bandung. While the local compute was powerful and the electrical supply was backed by my 330 kVA industrial drop, **the residential telecommunications infrastructure was a fatal bottleneck:**
- Indonesian residential broadband connections suffered frequent intermittent disconnections, packet loss, and latency spikes.
- Upstream routing anomalies to North America and Europe caused miners to miss critical 4-minute block deadlines, resulting in rejected shares and lost revenue.
- A public-facing web wallet and mining pool require strict **99.99% network availability**. A home fiber connection simply could not deliver that standard.

### 3.2 Transitioning to Enterprise Cloud Architecture
To guarantee zero packet loss and worldwide low latency, I made the decisive leap to modern enterprise cloud infrastructure:
1. **Amazon Web Services (AWS):**
   - Deployed high-performance **AWS EC2** compute instances inside isolated **VPCs (Virtual Private Clouds)**.
   - Configured **Amazon Route 53** with latency-based DNS routing and automated health-check failover.
   - Employed **AWS Elastic Load Balancing (ELB)** with Nginx reverse-proxy frontends for TLS termination and WebSocket connection pooling.
2. **Google Cloud Platform (GCP):**
   - Deployed secondary mirror nodes on **GCP Compute Engine** across distinct geographic regions (US-East, Europe-West, Asia-East).
   - Built a distributed Redis caching cluster to synchronize live mining share states across cloud providers.
3. **Operational Impact:**
   - Reduced latency for European and American miners from >350ms to <25ms against regional endpoints.
   - Achieved unbroken 99.99% service availability, establishing the pool as one of the premier trusted nodes in the global Burstcoin ecosystem.

---

## 4. Key Engineering Takeaways

- **Proof-of-Capacity Pioneer:** Gained deep mathematical and architectural understanding of storage-based consensus protocols years before modern storage networks (such as Chia or Filecoin) gained mainstream prominence.
- **Enterprise Cloud Mastery:** Transitioned from bare-metal local servers to cloud-native architectures on AWS and GCP, mastering VPC networking, subnets, load balancing, and multi-region fault tolerance.
- **High-Concurrency Distributed State:** Engineered real-time WebSocket and RPC pipelines capable of aggregating millions of cryptographic shares without race conditions or memory leaks.

# Burstcoin Web Wallet & Decentralized Asset Exchange: Zero-Trust Client-Side Cryptography

**Architect & Engineer:** Uray Meiviar  
**Role:** Full-Stack Web3 Engineer & Cryptographic Architect  
**Period:** 2014 – 2016  
**Domain:** Client-Side Cryptography, Web3 Application Architecture, Decentralized Asset Exchange (DEX), On-Chain Escrow & Messaging  
**Core Technologies:** JavaScript, Curve25519, SHA-256, Node.js, WebSockets, HTML5/CSS3, AWS EC2, Nginx

---

## Executive Summary

During the initial growth phase of the **Burstcoin** Proof-of-Capacity cryptocurrency in 2014, mainstream adoption was severely limited by user friction. Participating in the ecosystem required downloading a cumbersome Java-based desktop client and waiting hours or days to synchronize hundreds of thousands of blocks locally.

To eliminate this barrier, I co-developed and hosted the official **Burstcoin Web Wallet and Decentralized Asset Exchange** (`burstcoin.io`). 

The application pioneered **zero-trust client-side cryptography**: users accessed their accounts directly inside modern web browsers without ever trusting the backend server with their secret passphrases. Key derivation, address generation, and transaction signing occurred strictly within local browser memory using **Curve25519** elliptic-curve cryptography, transmitting only cryptographically signed bytecode to the backend daemon nodes.

---

## 1. Zero-Trust Cryptographic Architecture

```
=============================================================================
             CLIENT-SIDE ZERO-TRUST TRANSACTION LIFECYCLE
=============================================================================
  [ User Browser / Local Memory ]
   ├── Input: Secret Passphrase (e.g., 12 random words)
   ├── SHA-256 Hashing ──> 256-bit Private Seed
   ├── Curve25519 Scalar Multiplication ──> Public Key
   ├── Reed-Solomon Address Encoding ──> BURST-XXXX-XXXX-XXXX-XXXXX
   │
   │  [ Transaction Intent ] (Recipient, Amount, Fee, DEX Order Data)
   │               │
   │               ▼
   ├── Construct Unsigned Transaction Bytecode
   ├── In-Memory Cryptographic Signing (Curve25519 Signature)
   └── Output: 64-Byte Signed Hex String
               │
               ▼ (HTTPS POST / TLS WebSocket)
  [ Backend Node.js / Nginx Gateway ] (Zero Access to Private Keys)
               │
               ▼ (Loopback JSON-RPC)
  [ Burst Full Daemon Node ] ──> Broadcasts Signed Tx to Global P2P Mempool
=============================================================================
```

### 1.1 Non-Custodial Key Security
The fundamental tenet of the web wallet was **zero custody**:
- **Local Key Derivation:** When a user entered their passphrase on the landing screen, the secret never crossed the network. The client-side JavaScript engine passed the raw string through SHA-256 to generate the 32-byte scalar seed, followed by Curve25519 point multiplication to derive the public key.
- **Client-Side Signature:** Transactions (payments, DEX buy/sell orders, alias registrations, or encrypted messages) were packaged and signed entirely in browser memory.
- **Server Agnosticism:** The backend server only received the raw signed bytecode string. Even in the event of an adversary compromising the web server or database, user private keys and funds remained completely uncompromised.

![Burstcoin Web Wallet landing interface featuring passphrase entry and full feature roster](uidAvpZ%20-%20Imgur.webp)

---

## 2. On-Chain Decentralized Asset Exchange (DEX)

Beyond simple token transfers, the Burstcoin protocol incorporated an on-chain **Decentralized Asset Exchange (DEX)**—a pioneer of modern DeFi orderbooks years ahead of Uniswap or Serum.

I engineered the frontend trading interface allowing users to issue custom tokens, manage liquidity, and execute limit orders directly against the blockchain state:
- **Orderbook Engine:** Users submitted on-chain buy and sell limit orders. Matches were resolved deterministically by protocol consensus inside block generation rounds.
- **Token Issuance:** Permitted any account to mint fractional, transferrable tokens with configurable total supplies and decimal precision.
- **Trade History & Telemetry:** Visualized market depth, volume, and open orders with real-time UI updates via daemon polling.

![Burstcoin Web Wallet Asset Exchange trading BCPT tokens against BURST with full orderbook and trade history](BEE5I2k.webp)

### 2.1 The BCPT Tokenized Dividend Innovation
As demonstrated in the live wallet interface (`BURST-8E8K-WQ2F-ZDZ5-FQWHX`), I issued the **Burst Cryptoport Pool Token (BCPT)** (`Asset ID: 12791182347560578640`), introducing one of the earliest models of tokenized cloud revenue sharing:
- **Underlying Asset:** Backed by operating revenues from my high-availability mining pool (`burst-pool.cryptoport.io`).
- **Automated Monthly Dividends:** 50% of all monthly mining pool fees were paid out proportionally to BCPT token holders as direct BURST distributions.
- **Secondary Market Liquidity:** Users bought and sold shares of the mining pool's future cash flows on the open DEX orderbook, establishing an active, transparent secondary market.

---

## 3. Comprehensive Web3 Ecosystem Features

The web wallet served as an all-in-one decentralized operating dashboard:
1. **Encrypted Messaging:** Symmetric payload encryption (using ephemeral Diffie-Hellman shared secrets computed via Curve25519) enabling end-to-end private communication between wallet addresses.
2. **Decentralized Alias System:** On-chain mapping resolving human-readable names (e.g., `@uray`) to alphanumeric account addresses or arbitrary data URIs.
3. **Escrow & Crowdfunding:** Native protocol support for multi-signature escrow holding funds until conditions or timeout deadlines were met.
4. **Automated Reward Assignment:** Permitted miners to assign their forging reward recipients to mining pools without relinquishing custody of their primary wallets.
5. **Decentralized Marketplace:** Built-in storefront capabilities allowing peer-to-peer digital and physical goods trading directly within the wallet interface.

---

## 4. Key Takeaways & Architectural Legacy

- **Early DeFi & DEX Pioneer:** Implemented and traded on-chain orderbooks, dividend distribution tokens, and liquidity pools in 2014, long before the ERC-20 standard and Ethereum DeFi took shape.
- **Zero-Trust Client Cryptography:** Successfully engineered browser-based cryptography ensuring strict non-custodial security for thousands of worldwide users holding millions of BURST.
- **High-Availability Cloud Backends:** Scaled the underlying node RPC infrastructure across AWS EC2 and Google Cloud, maintaining seamless response times under high-frequency trading and block propagation loads.

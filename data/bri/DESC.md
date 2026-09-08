# RKB Mobile Application (Bank Rakyat Indonesia)

> **Role:** Mobile Architect & Core Developer (Freelance Team)  
> **Customer:** Bank Rakyat Indonesia (PT Bank Rakyat Indonesia Tbk — BRI)  
> **Initiative:** Rumah Kreatif BUMN (RKB) / Micro, Small & Medium Enterprise (MSME / UMKM) Empowerment  
> **Domain:** Enterprise Mobile Architecture, Reactive State, Secure Fintech Integrations  
> **Timeline:** 2019 – 2020  
> **Tech Stack:** Flutter, Dart, iOS (Swift/Xcode), Android, RESTful APIs, OAuth 2.0, Google Maps SDK  

---

![Live testing of the BRI RKB Flutter application on an iOS device tethered to Xcode development workspace](IMG_20191107_170846.webp)

## 1. The Post-T&E Diaspora: Banding Together for Survival

Following the sudden operational freeze and indefinite layoffs at PT. T&E Simulation—triggered by defense budget redirection, political leadership shifts, and the onset of the COVID-19 pandemic—our tight-knit cohort of systems engineers was cast adrift into the freelance market.

We were accustomed to building supersonic fighter jet avionics, armored cavalry tank networks, and national war game command platforms. Suddenly, that entire world was put on ice. 

Rather than scattering individually, several former T&E colleagues and I banded together to pursue enterprise software contracts as an independent freelance engineering team. One of the first significant contracts we secured was with **Bank Rakyat Indonesia (BRI)**—Indonesia's largest state-owned bank, world-renowned for its microfinance operations—to develop their **Rumah Kreatif BUMN (RKB)** mobile application.

While building a mobile application felt technically modest compared to real-time 6-DOF aircraft dynamics or kernel-level network stacks, it was an essential lifeline that kept our team active, united, and funded during an unprecedented global crisis.

---

## 2. Project Scope & Business Context

**Rumah Kreatif BUMN (RKB)** is a nationwide Indonesian government initiative designed to empower Micro, Small, and Medium Enterprises (MSMEs / *UMKM*). 

BRI required a high-performance, cross-platform mobile application that allowed hundreds of thousands of local artisans, food producers, and small business owners across the Indonesian archipelago to:
- Register and verify their business profiles with state-owned enterprise incubators.
- Access educational business mentoring modules, financial literacy workshops, and digital marketing courses.
- Showcase their local artisanal products to broader consumer and corporate procurement markets.
- Locate nearby physical RKB training centers via interactive mapping.

---

## 3. Architecture & Technical Implementation

We architected the RKB application using **Flutter and Dart**, delivering a single, unified codebase that executed natively on both iOS and Android with pixel-perfect consistency.

### Reactive State Management & Component Hierarchy
- Designed a clean, decoupled **BLoC (Business Logic Component)** reactive architecture, separating pure Dart business logic from Flutter presentation widgets.
- Implemented cached network image pipelines and optimistic UI updates, ensuring smooth performance even for rural MSME users operating on low-end Android smartphones over spotty 3G/4G cellular connections.

### Secure Enterprise Banking API Integration
- Integrated the mobile client with BRI's enterprise backend infrastructure via secure HTTPS REST APIs.
- Implemented **OAuth 2.0 authentication flows**, token refresh cycles, and encrypted secure local storage (Keychain on iOS, Keystore on Android) to safeguard user credentials and business records.
- Integrated the **Google Maps SDK** to provide geolocated mapping of provincial RKB consultation hubs.

---

## 4. Engineering Takeaway

The BRI RKB project was living proof of engineering adaptability:
- Systems engineers forged in the furnace of low-level C++, assembly, and real-time defense networks can master modern mobile stacks (Flutter/Dart) and enterprise application workflows in days.
- It cemented a vital lesson in humility and resilience: when macroeconomic and political tides wash away your primary industry, true engineering craftsmanship is about delivering solid, dependable solutions wherever you are called to serve.

---

*Document Author: Uray Meiviar*  
*Repository: [`uraymeiviar/data/bri`](https://github.com/uraymeiviar/uraymeiviar/tree/main/data/bri)*

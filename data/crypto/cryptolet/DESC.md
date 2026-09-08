# Cryptolet: Embedded ESP32 Cryptocurrency Ticker & Portfolio Hardware Monitor

**Architect & Engineer:** Uray Meiviar  
**Role:** Embedded Systems Engineer & Hardware Maker  
**Period:** 2019 – 2020  
**Domain:** Embedded Systems, IoT Hardware, Financial Telemetry, Microcontroller Firmware  
**Core Technologies:** ESP32 (Tensilica Xtensa LX6 dual-core @ 240MHz), Embedded C/C++, FreeRTOS, SPIFFS Flash Filesystem, ST7789 Color TFT LCD, Wi-Fi SoftAP Captive Portal, HTTP REST Client, JSON Streaming Parser, NTP

---

## Executive Summary

Monitoring cryptocurrency market velocity, price breakouts, and mining revenue typically requires keeping open resource-heavy desktop browser tabs or battery-draining smartphone applications. 

To create an autonomous, distraction-free market telemetry appliance, I engineered **Cryptolet**—a dedicated, low-power (~0.5W) desktop and pocket hardware device powered by the dual-core **ESP32** microcontroller.

Equipped with an integrated color TFT LCD and tactile hardware navigation buttons, Cryptolet connects directly to local Wi-Fi, fetches real-time market data from configurable exchange endpoints (such as Indodax and Bitfinex), and renders multi-pair price tickers and dynamic OHLC candlestick charts directly in microcontroller display memory.

---

## 1. Hardware Architecture & Physical Controls

```
=============================================================================
                       CRYPTOLET HARDWARE SUBSYSTEMS
=============================================================================
             [ 5V USB Type-C Power & Serial Programming ]
                                  │
                                  ▼
        [ Low-Dropout Voltage Regulator (3.3V System Rail) ]
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │          ESP32 SoC (Tensilica Xtensa Dual-Core 240MHz) │
      │  ├── Core 0: Wi-Fi Networking & FreeRTOS HTTP Tasks    │
      │  ├── Core 1: Display Rendering & Candlestick Graphics  │
      │  └── 4MB SPI Flash: Firmware Binary + SPIFFS Storage   │
      └───────┬────────────────────────────────────────┬───────┘
              │ (SPI Bus: MOSI, SCK, CS, DC, RST)      │ (GPIO Pull-Ups)
              ▼                                        ▼
    [ Color TFT LCD Display ]                [ 4x Tactile Buttons ]
    - 240x320 RGB Pixels                      - GPIO 38: MENU (Green)
    - Hardware Backlight PWM                  - GPIO 37: UP   (Cyan)
    - ST7789 High-Speed Controller            - GPIO 39: DOWN (Magenta)
                                              - EN:      RESET (Red)
=============================================================================
```

Cryptolet was designed as a compact, self-contained hardware unit:
- **Compute:** Dual-core 32-bit Xtensa LX6 processor clocked at 240MHz with 520 KB SRAM and 4 MB external SPI flash memory.
- **Display Interface:** High-density color TFT panel driven via high-speed SPI (clocked up to 40MHz for tear-free screen refresh).
- **Physical Controls:** Four discrete tactile push-buttons mounted along the right PCB edge, providing tactile control for menu navigation, ticker switching, time-frame selection, and system reset.
- **Energy Footprint:** Consumed less than 100mA during active Wi-Fi transmission and display rendering, making it fully portable when connected to a small 500mAh LiPo battery or powered 24/7 on a desk via USB.

![Cryptolet hardware monitor displaying real-time cryptocurrency tickers, multi-exchange prices, and live candlestick charts](IMG_0040.webp)

---

## 2. Firmware & Captive Portal Bootstrapping

A critical user-experience requirement was **zero-hardcoded credentials**: the device had to operate seamlessly across different Wi-Fi environments without recompiling firmware.

```
=============================================================================
                  CRYPTOLET BOOT & CONFIGURATION FLOW
=============================================================================
   [ Power On / Hardware Reset ]
                 │
                 ▼
   [ Initialize SPIFFS Partition ] (Mounts flash filesystem: 1.3 MB)
                 │
                 ▼
   [ Scan 2.4 GHz Wi-Fi Channels ]
                 │
         ┌───────┴───────┐
   (Known AP Found?)     (Network Missing / New Location)
         │                       │
         ▼                       ▼
   [ Connect & Sync ]      [ Launch SoftAP & Captive Portal ]
   ├── DHCP & RSSI Check   ├── SSID: "cryptoletbff172fc" (Chip MAC)
   ├── NTP Time Sync       ├── DNS Redirect & Web Server (192.168.4.1)
   └── Start Ticker Tasks  └── User Configures SSID, Password & API Endpoints
                                 │
                                 ▼
                           [ Save to SPIFFS & Reboot ]
=============================================================================
```

### 2.1 Boot Sequence Telemetry
Upon boot, Cryptolet outputs its diagnostic boot log directly to the TFT display:
- Displays CPU frequency (`240MHz`) and unique network hostname generated from the ESP32 silicon MAC address (e.g., `cryptoletbff172fc`).
- Mounts the **SPIFFS (SPI Flash File System)** partition (allocating ~1.37 MB for JSON configuration profiles and cached historical market data).
- Performs an active Wi-Fi channel scan, listing nearby SSIDs and signal strength in dBm.

### 2.2 SoftAP Captive Portal (`192.168.4.1`)
If no configured Wi-Fi access point is reachable:
1. The ESP32 switches into dual AP mode, broadcasting an open Wi-Fi network named `cryptolet<mac>`.
2. An embedded DNS responder intercepts all outgoing client requests and redirects connecting smartphones or laptops to the local web server at `http://192.168.4.1`.
3. Through this web portal, users enter Wi-Fi credentials, select target cryptocurrency pairs, set custom REST API endpoints, configure portfolio holding amounts, and define polling intervals.
4. Settings are serialized into JSON and committed to SPIFFS flash, surviving hard power-cycles.

![Cryptolet boot diagnostic and captive portal Wi-Fi configuration setup screen](IMG_0041.webp)

---

## 3. Real-Time Market Telemetry & Candlestick Graphics

Once connected to the internet, Cryptolet launches asynchronous FreeRTOS worker tasks:
- **NTP Time Synchronization:** Contacts global NTP servers to synchronize the internal real-time clock down to the second, rendering the live timestamp in the status header.
- **Wi-Fi Health Monitoring:** Continually evaluates link quality, displaying the active SSID (`CX128-LT1-N`) and live RSSI signal strength (`-63db`).
- **REST Ingestion Engine:** Periodically polls configured exchange REST API endpoints (supporting multiple public APIs such as Indodax, Bitfinex, and custom user endpoints).
- **Streaming JSON Parsing:** Employs memory-efficient streaming JSON deserialization to extract ticker prices, 24-hour highs/lows, and recent trading volumes without exhausting the ESP32's SRAM heap.
- **High-Performance Candlestick Graphics Engine:**
  - Implements custom rasterization routines to draw multi-period OHLC (Open, High, Low, Close) candlesticks directly to the frame buffer.
  - Colors upward bullish candles in bright green and downward bearish candles in orange/red.
  - Calculates percentage price changes over configurable windows (e.g., `+11.32 12m`, `-0.01 12m`).
  - Supports simultaneous monitoring of diverse currency pairings (e.g., Indonesian Rupiah `BTC/IDR`, `ETH/IDR` alongside US Dollar `BTC/USD`, `ETH/USD`).

---

## 4. Key Engineering Takeaways

- **Embedded Systems Mastery:** Engineered responsive graphics, non-blocking asynchronous networking, and file system management on a bare-metal microcontroller without Linux or an external OS.
- **Autonomous IoT Appliance:** Created a durable, standalone device that operates continuously 24/7 with zero maintenance, automatic network recovery, and negligible power draw.
- **Hardware/Software Integration:** Unified mechanical enclosure, push-button human interfaces, and custom C++ embedded graphics into a practical financial telemetry tool.

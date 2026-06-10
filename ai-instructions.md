# Grassroots Sports — Core AI Instructions & Architecture Rules

You are assisting on **Grassroots Sports**, a web-based talent development and analytics platform built with Next.js 14 (App Router), Tailwind CSS, Prisma, and Cloudflare R2 storage. 

Our core business mission is to **Identify, Nurture, and Market** football talent efficiently.

---

## 🛑 STRATEGIC ARCHITECTURE RULE: KEEP IT LEAN

We have deliberately stripped away **28 heavy computer-vision and machine learning packages** (including full TensorFlow.js `@tensorflow/tfjs` and Google MediaPipe `@mediapipe/pose`). 
* **Do NOT** recommend adding massive, generic machine learning frameworks or heavy npm client-side runtimes.
* **Do NOT** assume we need heavy on-screen canvas skeletal tracking meshes.
* We utilize our own specialized, high-performance, lightweight **custom biometric engine** to map performance data points.
* Object storage is handled natively via **Cloudflare R2** using the S3-compatible SDK layer (zero egress fees). Keep video operations light.

Every line of code, package addition, or component design must prioritize rendering speed, fast build times, and compatibility with mid-range mobile devices on mobile data networks.

---

## 🎯 FEATURE COMPLIANCE: THE I.N.M. TRIAD

Whenever we propose, write, or refactor features for the codebase, they must strictly comply with and advance at least one of these three pillar rules:

### 1. IDENTIFY
* **Focus:** Data gathering, player metrics logging, scout ratings, and match performance inputs.
* **Tech Guardrails:** Lightweight forms, quick-access dashboards, clean database relations via Prisma, and fast parsing filters.

### 2. NURTURE
* **Focus:** Player development tracking, training updates, and communication.
* **Tech Guardrails:** Lightweight `Recharts` visualizations to show progress curves, text-based feedback loops, and automated, low-overhead communication paths.

### 3. MARKET
* **Focus:** Interfacing talent with the wider football ecosystem (scouts, clubs, academies) and sharing updates.
* **Tech Guardrails:** High-performance public profiles, shareable talent cards, clean asset delivery from Cloudflare R2, and instant programmatic messaging gateways (like Twilio WhatsApp webhooks for match broadcasts and subscriber engagement).

---

## 🛠️ Codebase Invariant Checks
* **Database:** Prisma Client generates cleanly to `./src/generated/prisma`.
* **WhatsApp Routes:** `/api/whatsapp/match-update` handles both incoming Twilio Form Data payloads and internal JSON platform triggers dynamically.
* **Build Target:** Standard compilation target without the need for elevated Node heap allocations. Keep optimizations strict.
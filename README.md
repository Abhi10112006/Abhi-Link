<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Abhi-Link — Monorepo

A monorepo containing the **Abhi-Link UPI Payment QR Code Generator** in two flavours:

| App | Path | Stack | Description |
|---|---|---|---|
| 🌐 Web | [`apps/web`](apps/web) | Vite + React 19 + Tailwind CSS | Progressive Web App for browsers |
| 📱 Mobile | [`apps/mobile`](apps/mobile) | Expo + React Native 0.76 | Native iOS & Android app |

Both apps share the same core features — UPI QR generation, invoices, transaction history, receipts, and multi-language support — implemented with their respective platform primitives.

---

## 🗂️ Structure

```
abhi-link/
├── apps/
│   ├── web/       # Vite + React web app (PWA) — deploy to Vercel
│   └── mobile/    # Expo + React Native mobile app — run with Expo Go
├── .npmrc         # legacy-peer-deps=true (resolves React 18/19 conflict)
├── package.json   # Root workspace manifest
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) ≥ 9
- For mobile preview: [Expo Go](https://expo.dev/go) app on your phone

### Install all workspaces

```bash
npm install
```

> The `.npmrc` file sets `legacy-peer-deps=true` to resolve the React 18 / React 19
> peer dependency conflict between the web and mobile workspaces.

---

## 🌐 Web App (`apps/web`)

A Progressive Web App built with **Vite**, **React 19**, and **Tailwind CSS v4**.

### Features

- UPI QR Code Generation (qr-code-styling)
- Clipboard UPI-ID detection with autocomplete
- Quick Amount Presets (₹10, ₹20, ₹50, ₹100, ₹200, ₹500)
- Recent Payees with swipe-to-delete
- Copy Link (TinyURL shortening)
- WhatsApp Share with short link
- Invoice PDF generation (jsPDF + html2canvas)
- Digital Payment Card sharing
- Transaction History (localStorage)
- PWA with offline support
- Multi-language support (12+ languages)
- Premium animations (Motion/Framer)

### Run locally

```bash
cd apps/web
npm install
npm run dev      # Start Vite dev server + Express API on :3000
```

### Build for production

```bash
cd apps/web
npm run build    # Output goes to apps/web/dist/
```

### ☁️ Deploy to Vercel

> **Critical for Monorepo:** You must set the Root Directory to `apps/web` in the
> Vercel project settings. See [apps/web/VERCEL_DEPLOYMENT.md](apps/web/VERCEL_DEPLOYMENT.md)
> for the full guide.

**Quick steps:**
1. Import the GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** → `apps/web`
3. Leave all other settings as-is (Vercel auto-detects Vite)
4. Click **Deploy**

---

## 📱 Mobile App (`apps/mobile`)

A native app built with **Expo** (~52) and **React Native** 0.76.

### Features

- UPI QR Code Generation (react-native-qrcode-svg)
- Clipboard UPI-ID detection with autocomplete
- Quick Amount Presets (₹10, ₹20, ₹50, ₹100, ₹200, ₹500)
- Recent Payees (swipe-to-delete)
- Copy Payment Link (copies web URL to clipboard)
- WhatsApp Share (opens WhatsApp with pre-filled message)
- QR code save to camera roll / share as image
- Invoice PDF generation (expo-print)
- Digital Payment Card share (expo-sharing)
- Transaction History (AsyncStorage)
- Multi-language support
- Animations (react-native-reanimated / moti)

### 📲 How to Preview the Mobile App

You can preview the mobile app **without a Mac/Xcode/Android Studio** using **Expo Go**:

#### Step 1 — Install Expo Go on your phone

| Platform | Link |
|---|---|
| iOS (iPhone/iPad) | [App Store → Expo Go](https://apps.apple.com/app/expo-go/id982107779) |
| Android | [Google Play → Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) |

#### Step 2 — Start the Expo dev server

```bash
cd apps/mobile
npm install
npm run start
```

This will open **Expo DevTools** in your browser and display a **QR code** in the terminal.

#### Step 3 — Scan the QR code

- **Android**: Open the **Expo Go** app → tap "Scan QR Code" → scan the terminal QR.
- **iPhone**: Open the **Camera app** → point at the QR code → tap the banner that appears.

The app will load on your phone over your local Wi-Fi — no USB cable needed!

#### Alternative: Run on an emulator/simulator

```bash
# Android emulator (requires Android Studio)
cd apps/mobile && npm run android

# iOS simulator (requires Xcode on macOS)
cd apps/mobile && npm run ios
```

---

## 👤 Developer

**Abhinav Yaduvanshi** — [GitHub](https://github.com/Abhi10112006)

---

<p align="center">Made with ❤️ — Web + Mobile, one repo</p>

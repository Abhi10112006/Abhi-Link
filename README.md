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
│   ├── web/       # Vite + React web app (PWA)
│   └── mobile/    # Expo + React Native mobile app
├── package.json   # Root workspace manifest
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) ≥ 9 (ships with Node 18+)

### Install all workspaces

```bash
npm install
```

### Run the web app

```bash
npm run web
# or directly:
cd apps/web && npm run dev
```

### Run the mobile app

```bash
npm run mobile
# or directly:
cd apps/mobile && npm run start
```

---

## 🌐 Web App (`apps/web`)

A Progressive Web App built with **Vite**, **React 19**, and **Tailwind CSS v4**.

### Features

- UPI QR Code Generation (qr-code-styling)
- Clipboard UPI-ID detection
- Recent Payees & Quick Amount Presets
- Invoice PDF generation (jsPDF + html2canvas)
- Digital Payment Card share
- Transaction History (localStorage)
- URL shortening via TinyURL
- PWA with offline support
- Multi-language support (12+ languages)
- Premium animations (Motion/Framer)

### Tech Stack

| Layer | Technology |
|---|---|
| Bundler | Vite 6 |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| QR | qr-code-styling |
| PDF | jsPDF + html2canvas |
| Animations | motion (Framer Motion) |
| Icons | lucide-react |
| Server | Express (dev) / Vercel (prod) |

### Scripts

```bash
cd apps/web
npm run dev      # Start Vite dev server + Express API
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # TypeScript type-check
```

---

## 📱 Mobile App (`apps/mobile`)

A native app built with **Expo** (~52) and **React Native** 0.76.

### Features

- UPI QR Code Generation (react-native-qrcode-svg)
- QR code save to camera roll / share as image
- Invoice PDF generation (expo-print)
- Digital Payment Card share (expo-sharing)
- Transaction History (AsyncStorage)
- Swipe-to-delete transactions
- Multi-language support
- Animations (react-native-reanimated / moti)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo ~52 |
| UI | React Native 0.76 |
| QR | react-native-qrcode-svg |
| PDF | expo-print |
| Sharing | expo-sharing |
| Clipboard | expo-clipboard |
| Storage | @react-native-async-storage/async-storage |
| QR Capture | react-native-view-shot |
| Icons | lucide-react-native |
| Gestures | react-native-gesture-handler |

### Scripts

```bash
cd apps/mobile
npm run start    # Start Expo dev server (Expo Go)
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run lint     # TypeScript type-check
```

---

## 👤 Developer

**Abhinav Yaduvanshi** — [GitHub](https://github.com/Abhi10112006)

---

<p align="center">Made with ❤️ — Web + Mobile, one repo</p>

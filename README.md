<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Abhi-Link — UPI Payment QR Code Generator (React Native / Expo)

A premium, feature-rich UPI payment QR code generator built with **React Native** and **Expo**. Generate instant, scannable UPI QR codes, create professional invoices, track transactions, and share payment requests — all in one mobile app.

---

## ✨ Features

- **UPI QR Code Generation** — Dynamic QR codes compatible with Google Pay, PhonePe, Paytm, and all UPI-enabled apps.
- **UPI Handle Autocomplete** — Suggests 50+ common bank UPI handles (e.g. `@ybl`, `@paytm`, `@okhdfcbank`) as you type.
- **Recent Payees** — Quickly re-select from previously used payees.
- **Invoice Generation** — Create and export professional PDF invoices via `expo-print`.
- **Digital Payment Card** — Generate a stylish shareable card embedding your QR code.
- **Transaction History** — Browse and manage a full log of past payment sessions stored via AsyncStorage.
- **Receipt Export** — Share payment receipts as PDFs.
- **Multi-Language Support** — Full UI translations for multiple languages.
- **Swipe-to-Delete** — Swipe transaction cards left to delete them.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~52 |
| UI | React Native 0.76 |
| QR Generation | `react-native-qrcode-svg` |
| PDF / Printing | `expo-print` |
| Sharing | `expo-sharing` |
| Clipboard | `expo-clipboard` |
| Storage | `@react-native-async-storage/async-storage` |
| QR Image Capture | `react-native-view-shot` |
| Media Library | `expo-media-library` |
| Icons | `lucide-react-native` |
| Gestures | `react-native-gesture-handler` |
| Language | TypeScript |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Install

```bash
npm install
```

### Run

```bash
# Start Expo dev server
npm start

# Android
npm run android

# iOS
npm run ios
```

---

## 📂 Project Structure

```
├── App.tsx              # Root Expo entry point (providers)
├── app.json             # Expo configuration
├── babel.config.js      # Babel preset for Expo
├── src/
│   ├── App.tsx          # Main application screen
│   ├── components/
│   │   ├── PremiumBackground.tsx
│   │   ├── Changelog.tsx
│   │   ├── DigitalCardModal.tsx
│   │   ├── InvoiceModal.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   ├── Receipt.tsx           # HTML template for expo-print
│   │   ├── ReceiptModals.tsx
│   │   └── TransactionHistory.tsx
│   ├── locales/
│   │   └── translations.ts
│   └── utils/
│       ├── qrGenerator.ts        # Share / save QR via expo-sharing & expo-media-library
│       └── invoicePdfGenerator.ts # PDF via expo-print
└── public/              # Static assets
```

---

## 👤 Developer

**Abhinav Yaduvanshi** — [GitHub](https://github.com/Abhi10112006)

---

<p align="center">Made with ❤️ and React Native</p>

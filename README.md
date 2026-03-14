<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Abhi-Link — UPI Payment QR Code Generator

A premium, feature-rich UPI payment QR code generator built with React and TypeScript. Generate instant, scannable UPI QR codes, create professional invoices, track transactions, and share payment requests — all in one place.

---

## ✨ Features

- **UPI QR Code Generation** — Create dynamic QR codes compatible with Google Pay, PhonePe, Paytm, and all UPI-enabled apps.
- **Smart Clipboard Detection** — Automatically detects UPI IDs copied to your clipboard and suggests them for quick entry.
- **UPI Handle Autocomplete** — Suggests 50+ common bank UPI handles (e.g. `@ybl`, `@paytm`, `@okhdfcbank`) as you type.
- **Recent Payees** — Quickly re-select from previously used payees without re-typing.
- **Quick Amount Clips** — One-tap preset amount buttons (₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹1k).
- **QR Code Customization** — Choose dot styles, corner square types, and colors for your QR code.
- **Invoice Generation** — Create and export professional PDF invoices from any payment session.
- **Digital Payment Card** — Generate a stylish, shareable digital card embedding your QR code.
- **Transaction History** — Browse, search, and manage a full log of past payment sessions stored locally.
- **Receipt Export** — Download or share payment receipts as images or PDFs.
- **Payment Request Links** — Share a URL that pre-fills the form with your UPI details.
- **Multi-Language Support** — Full UI translations for multiple languages.
- **PWA Support** — Install as a Progressive Web App for offline use on any device.
- **Premium Animations** — Smooth, physics-based animations powered by the Motion library throughout the UI.

---

## 🛠️ Tech Stack

| Category | Libraries / Tools |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Animations** | Motion 12 (spring physics, variants) |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |
| **QR Codes** | qr-code-styling, qrcode.react |
| **PDF Export** | jsPDF, jspdf-autotable, html2canvas |
| **Backend** | Express, Node.js, tsx |
| **Database** | better-sqlite3 (local), Upstash Redis (serverless) |
| **Deployment** | Vercel |
| **PWA** | vite-plugin-pwa |

---

## 🚀 Run Locally

**Prerequisites:** Node.js (v18+)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhi10112006/Abhi-Link.git
   cd Abhi-Link
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

---

## 📦 Build & Preview

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## ☁️ Deploy to Vercel

This project is configured for Vercel deployment. See [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md) for step-by-step instructions.

---

## 📁 Project Structure

```
src/
├── App.tsx                   # Main application component & state
├── main.tsx                  # React entry point
├── index.css                 # Global styles & CSS variables
├── components/
│   ├── PaymentForm.tsx        # UPI form with smart clipboard & autocomplete
│   ├── QRCodeDisplay.tsx      # Styled QR code renderer & controls
│   ├── TransactionHistory.tsx # Transaction log management
│   ├── InvoiceModal.tsx       # Professional invoice generator
│   ├── DigitalCardModal.tsx   # Digital payment card creator
│   ├── ReceiptModals.tsx      # Receipt confirmation dialogs
│   ├── Receipt.tsx            # Payment receipt display
│   ├── Changelog.tsx          # Version history
│   ├── LanguageSelector.tsx   # Language switcher
│   └── PremiumBackground.tsx  # Decorative background
├── utils/
│   ├── qrGenerator.ts         # QR code download & share helpers
│   └── invoicePdfGenerator.ts # PDF invoice generation
└── locales/
    └── translations.ts        # Multi-language UI strings
```

---

## 📄 License

This project is private. All rights reserved.

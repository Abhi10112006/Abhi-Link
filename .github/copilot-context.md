# Abhi-Link — Copilot Agent Context File

> **AGENT INSTRUCTION:** Every time you make a change to this app, append a new entry to the [Update Log](#update-log) section at the bottom of this file. Each entry must include: the date, a short title, a description of what was changed and why, and the files affected. This keeps every future agent session fully informed from a single file.

---

## 1. App Overview

**Abhi-Link** is a Progressive Web App (PWA) that lets anyone generate a personalized UPI payment QR code — pre-filled with a UPI ID, payee name, amount, and remarks. Built for India's UPI ecosystem, it targets small merchants, freelancers, tutors, and individuals who want a shareable payment request link or QR.

- **Live URL:** https://abhi-link.vercel.app/
- **Developer:** Abhinav Yaduvanshi
- **Version:** v1.0 (March 14, 2026)
- **Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Framer Motion (motion/react), vite-plugin-pwa
- **Hosting:** Vercel (with serverless API routes in `/api`)
- **Backend/DB:** Upstash Redis (URL shortening), no persistent user DB

---

## 2. Repository Structure

```
/
├── .github/
│   └── copilot-context.md      ← THIS FILE — always update after changes
├── api/
│   └── shorten.ts              ← Vercel serverless: URL shortener using Upstash Redis
├── public/                     ← Static assets (icons, manifest)
├── src/
│   ├── App.tsx                 ← Root component; orchestrates all modals and main layout
│   ├── main.tsx                ← React entry point + PWA SW registration
│   ├── index.css               ← Global styles
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── PaymentForm.tsx         ← UPI form (UPI ID, name, amount, remarks)
│   │   ├── QRCodeDisplay.tsx       ← QR code preview, share/download/copy/WhatsApp buttons
│   │   ├── DigitalCardModal.tsx    ← "My Digital Card" modal (setup, pocket, revealed steps)
│   │   ├── TransactionHistory.tsx  ← Swipeable transaction list with clear-all confirm
│   │   ├── InvoiceModal.tsx        ← Invoice builder: payee, items, remarks, PDF export
│   │   ├── ReceiptModals.tsx       ← Receipt flow modals (confirm, sender name, post-payment)
│   │   ├── Receipt.tsx             ← Receipt HTML template rendered for image/PDF capture
│   │   ├── Changelog.tsx           ← Full-screen animated changelog ("What's New")
│   │   ├── LanguageSelector.tsx    ← Language picker (12 languages supported)
│   │   └── PremiumBackground.tsx   ← Sacred-geometry SVG background used across modals
│   ├── utils/
│   │   ├── haptics.ts              ← Web Vibration API wrapper (hapticLight/Medium/Heavy/etc.)
│   │   ├── invoicePdfGenerator.ts  ← jsPDF + jspdf-autotable invoice PDF logic
│   │   └── qrGenerator.ts          ← QR code share/download helpers (html-to-image)
│   └── locales/
│       └── translations.ts         ← All UI strings in 12 languages
├── server.ts                   ← Express dev server (local only)
├── vite.config.ts              ← Vite + Tailwind + React + PWA config
├── vercel.json                 ← Vercel routing config
└── package.json                ← Dependencies and scripts
```

---

## 3. Component Reference

### `src/App.tsx`
- **Role:** Root orchestrator. Holds top-level state for all modals and the main QR flow.
- **Key state:** `showInvoiceModal`, `showChangelog`, `showDigitalCard`, `showTransactionHistory`, `transactions`, `lang`, `isPaymentRequestVisible`, `showPostPaymentModal`, `isWaitingForUpiReturn`
- **Key flows:**
  - Payment request banner (shown when URL params contain `upi`, `amount`, etc.)
  - "Open in UPI App" deep-link with post-payment flow (receipt confirmation)
  - Transaction auto-save to `localStorage` after receipt generation
  - PWA auto-update via `useRegisterSW`
- **Haptic imports:** `hapticLight`, `hapticMedium`, `hapticHeavy`, `hapticSuccess`

### `src/components/PaymentForm.tsx`
- **Role:** The main payment form. Collects UPI ID, payee name, amount, remarks. Drives QR generation.
- **Features:**
  - Recent payees stored in `localStorage` (key: `abhi-link-recent-payees`)
  - Clipboard detection for UPI IDs (reads clipboard on mount; shows paste button)
  - Quick-amount chips (preset INR values)
  - Custom remarks clips (user-saved + built-in)
  - "Clear Fields" typewriter wipe animation
  - Scroll haptics on the recent-payees list
- **Haptic imports:** `hapticLight`, `hapticMedium`, `hapticHeavy`, `hapticWarning`, `hapticScroll`

### `src/components/QRCodeDisplay.tsx`
- **Role:** Shows the generated QR code plus action buttons (Share, Download, Generate Receipt, Copy Link, WhatsApp Share).
- **Features:**
  - QR style customizer (dot type, corner square type, corner dot type)
  - URL shortening via `/api/shorten` before copy/WhatsApp share
  - All action handlers include haptic calls internally
- **Haptic imports:** `hapticLight`, `hapticMedium`, `hapticHeavy`, `hapticSuccess`

### `src/components/DigitalCardModal.tsx`
- **Role:** "My Digital Card" — a full-screen modal with three steps: `setup`, `pocket`, `revealed`.
- **Steps:**
  - `setup`: Business type selector + name/UPI form → `localStorage` save
  - `pocket`: Card is "in pocket" — drag up to reveal, or tap close
  - `revealed`: Full card display with QR, amount modal, share/stealth-mode button
- **State:** Step stored in component state; card data in `localStorage` (`my_card_name`, `my_card_upi`, `my_card_business_type`)
- **Haptic imports:** `hapticLight`, `hapticMedium`, `hapticHeavy`, `hapticSuccess`, `hapticScroll`

### `src/components/TransactionHistory.tsx`
- **Role:** Full-screen swipeable transaction list. Swipe-left to delete individual items; "Clear All" with confirmation dialog.
- **Features:**
  - Transactions stored in `localStorage` via parent `App.tsx`
  - Swipeable cards using Framer Motion drag
  - Scroll haptics on the main scrollable container
- **Haptic imports:** `hapticMedium`, `hapticHeavy`, `hapticWarning`, `hapticScroll`

### `src/components/InvoiceModal.tsx`
- **Role:** Full-featured invoice builder. Collects payee, line items, tax, remarks; exports PDF or shares via Web Share API.
- **Features:**
  - Recent payees (same localStorage key as PaymentForm)
  - Custom remarks clips stored in `localStorage` (`abhi-link-invoice-remarks`)
  - Dynamic line-item add/remove with live total calculation
  - Business type selection for invoice header styling
  - Multi-language invoice PDF output
  - Clipboard UPI paste with multi-ID selection toast
  - Scroll haptics via `scrollLastYRef`
- **Haptic imports:** `hapticLight`, `hapticMedium`, `hapticHeavy`, `hapticWarning`, `hapticSuccess`, `hapticScroll`

### `src/components/ReceiptModals.tsx`
- **Role:** Multi-step receipt flow modals:
  1. `ReceiptConfirmationModal` — "Did money arrive?" (yes/wait)
  2. `SenderNameModal` — Enter sender's name (form submit triggers `hapticHeavy`)
  3. `PaymentCompletedModal` — "Checking…" waiting state
  4. `PostPaymentModal` — After UPI app return: share/download receipt
- **Haptic imports:** `hapticMedium`, `hapticHeavy`

### `src/components/Receipt.tsx`
- **Role:** Off-screen HTML receipt template. Captured as PNG/PDF via `html2canvas`/`jsPDF` for sharing.
- **No haptics** (not interactive).

### `src/components/Changelog.tsx`
- **Role:** Full-screen animated "What's New" overlay triggered by clicking the version badge.
- **Features:** Scroll haptics, click-backdrop-to-close
- **Haptic imports:** `hapticMedium`, `hapticScroll`

### `src/components/LanguageSelector.tsx`
- **Role:** Dropdown language picker. Supports 12 languages: English, Hinglish, Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Nepali, Sanskrit, Gujarati, Odia.
- **Features:** Scroll haptics on language list
- **Haptic imports:** `hapticLight`, `hapticMedium`, `hapticScroll`

### `src/components/PremiumBackground.tsx`
- **Role:** Reusable decorative background component. Sacred-geometry SVG pattern on `#e6e1dc` base with radial gradient. Used in Changelog, DigitalCardModal, TransactionHistory.

---

## 4. Utilities Reference

### `src/utils/haptics.ts`
Web Vibration API wrapper. All exports gracefully no-op on unsupported devices.

| Export | Vibration Pattern | Use Case |
|---|---|---|
| `hapticLight` | 10ms | List selection, toggle, chip tap |
| `hapticMedium` | 20ms | Standard button press, modal close |
| `hapticHeavy` | [30,10,20]ms | Modal open, primary CTA, confirm |
| `hapticSuccess` | [15,10,15,10,30]ms | Receipt done, PDF saved, QR downloaded |
| `hapticWarning` | [50,30,50]ms | Delete, error, destructive action |
| `hapticScroll` | 5ms | Throttled scroll tick (every ~40px) |

**Haptic coverage map (all interactive elements must use haptics):**
- All `onClick` handlers on `<button>`, `<motion.button>`, `<motion.a>`, `<a>` that respond to user intent
- All `onDragEnd` handlers that trigger a state transition
- Form `onSubmit` handlers
- Scroll containers via throttled `scroll` event listener

### `src/utils/qrGenerator.ts`
- `handleDownload(qrRef, payeeName, upiId)` — captures QR div as PNG and triggers download
- `handleShare(qrRef, payeeName, upiId)` — uses Web Share API to share QR PNG

### `src/utils/invoicePdfGenerator.ts`
- `downloadInvoicePdf(data)` — generates and saves invoice PDF using jsPDF + autotable
- `shareInvoicePdf(data)` — generates PDF blob and shares via Web Share API
- `BusinessType` — `'shop' | 'freelancer' | 'tuition' | 'custom'`

---

## 5. Data / localStorage Keys

| Key | Component | Description |
|---|---|---|
| `abhi-link-lang` | App | Selected language code |
| `abhi-link-recent-payees` | PaymentForm, InvoiceModal | Array of `{ upiId, payeeName }` objects |
| `abhi-link-transactions` | App / TransactionHistory | Array of `Transaction` objects |
| `abhi-link-invoice-remarks` | InvoiceModal | Array of custom remark strings |
| `my_card_name` | DigitalCardModal | User's display name for digital card |
| `my_card_upi` | DigitalCardModal | User's UPI ID for digital card |
| `my_card_business_type` | DigitalCardModal | `BusinessType` for digital card |

---

## 6. API Routes

### `api/shorten.ts` — `POST /api/shorten`
- **Input:** `{ url: string }`
- **Output:** `{ shortUrl: string }`
- Uses Upstash Redis to store `shortCode → originalUrl` with 7-day TTL
- Short URLs resolve via a redirect path handled by Vercel routing

---

## 7. Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Start local Express dev server (tsx server.ts)
npm run build        # vite build (TypeScript compile + Vite bundle + PWA SW generation)
npm run lint         # tsc --noEmit (TypeScript type-check only)
```

- **Build tool:** Vite 6 + `@vitejs/plugin-react` + `@tailwindcss/vite` + `vite-plugin-pwa`
- **PWA:** Service Worker generated in `generateSW` mode; precaches ~9 entries
- **Deployment:** Push to `main` → Vercel auto-deploys

---

## 8. Haptic Policy (for agents)

**Every user-interactive element must fire a haptic.** Use these guidelines:

1. **Navigation / modal open → `hapticHeavy()`**
2. **Regular button tap / modal close → `hapticMedium()`**
3. **List item select / toggle / chip → `hapticLight()`**
4. **Delete / destructive / warning → `hapticWarning()`**
5. **Success / completion (async) → `hapticSuccess()`**
6. **Scroll container (throttled, every ~40px) → `hapticScroll()`**
7. **External link tap → `hapticLight()`**
8. **Form submit (primary action) → `hapticHeavy()`** inside the submit handler

When adding haptics to a new component, import only the functions you need from `../utils/haptics` (or `./utils/haptics` from App.tsx).

---

## 9. Update Log

> Append a new `###` entry here after every change. Include: date, title, files changed, and what/why.

---

### 2026-03-17 — Fix Build Errors from Haptic Feedback Integration

**Branch:** `copilot/implement-haptic-feedback`  
**Files changed:** `src/components/DigitalCardModal.tsx`, `src/components/TransactionHistory.tsx`, `src/components/InvoiceModal.tsx`

The haptic feedback commit (0af748b) introduced multiple types of JSX structural corruption when rewriting `onClick` handlers:

- **DigitalCardModal.tsx:** Close button lost its entire body and surrounding structure — `whileHover`, `whileTap`, `>`, `<X />`, `</motion.button>`, `)}`, `</AnimatePresence>`, and `<AnimatePresence mode="wait">` were all deleted. Restored.
- **TransactionHistory.tsx:** Clear-All confirmation dialog was broken — backdrop `<div />` lost its self-closing slash and the `<motion.div>` opening tag was dropped; Cancel button's `className` was partially consumed into `onClick`. Restored.
- **InvoiceModal.tsx:** Two buttons were gutted — "Save Clip" lost its `disabled` prop; "Clear Fields" lost its `className`, `whileHover`, `whileTap`, content (`<Eraser>` icon + label). Restored.
- Also fixed extra `}}}` (triple brace) syntax errors on several `onClick` handlers across all three files.

---

### 2026-03-17 — Add Scroll Haptics to PaymentForm & QRCodeDisplay + Fix UPI Auto-Handler Menu Haptics

**Branch:** `copilot/implement-haptic-feedback`  
**Files changed:** `src/components/PaymentForm.tsx`, `src/components/QRCodeDisplay.tsx`

**Changes made:**

1. **`src/components/PaymentForm.tsx` — UPI auto-handler menu haptic:**
   - Added `hapticLight()` at the start of `selectHandle()`. The autocomplete dropdown (the UPI bank-handle suggester, e.g. `@ybl`, `@paytm`) triggered `selectHandle()` via `onMouseDown` with no haptic. Now fires `hapticLight()` on every handle selection.
   - Added `autocompleteScrollRef` (`useRef<HTMLUListElement>`) and attached it to the scrollable `<ul>` in the autocomplete dropdown. A new `useEffect` with 40px threshold fires `hapticScroll()` when the user scrolls this list.
   - Added `multipleUpiScrollRef` (`useRef<HTMLDivElement>`) and attached it to the scrollable `<div>` in the multi-UPI-options toast. A new `useEffect` fires `hapticScroll()` when the user scrolls this list.
   - Added `useCallback` to React imports and a `handleScroll` `useCallback`.
   - Added a **page-level window scroll listener** (`useEffect` on `window`, 40px threshold) so haptics fire as the user scrolls the main page through the payment form area.

2. **`src/components/QRCodeDisplay.tsx` — Scroll haptics:**
   - Added `hapticScroll` to the haptics import.
   - Added `useCallback` to React imports.
   - Added `handleScroll` `useCallback` + a **page-level window scroll listener** (`useEffect` on `window`, 40px threshold), consistent with the pattern in Changelog.tsx and TransactionHistory.tsx.

**Note:** Both PaymentForm and QRCodeDisplay attach to `window` scroll. On mobile (stacked single-column layout), the user scrolls them at different times so there is no double-fire. On desktop (side-by-side grid), both components are in the viewport simultaneously but the vibration API's behavior of overwriting a running vibration means the user still feels only one 5ms tick per threshold crossing.


### 2026-03-18 — Premium 3D Tilt, Card Centering Fix, Invoice Button Size Parity

**Branch:** `copilot/implement-haptic-feedback`  
**Files changed:** `src/components/DigitalCardModal.tsx`, `src/components/InvoiceModal.tsx`

**Changes made:**

1. **`DigitalCardModal.tsx` — Fix card "peek on right side" in pocket animation:**
   - `cardRotateX` and `cardRotateY` now gate through `revealedGate` (multiplied by the gate MotionValue).
   - Previously the rotations sprang back to 0 over ~500ms after returning to pocket; during that spring the CSS perspective projection made the right edge appear closer/larger — a visual "right-side peek". Now `revealedGate` instantly becomes 0 when step leaves `'revealed'`, so `cardRotateX = cardRotateY = 0` the very next frame.
   - Tilt range increased from ±6° to ±10° for a more pronounced, premium feel.

2. **`DigitalCardModal.tsx` — Make tilt look "real/grounded" not "floating":**
   - `FLOAT_SCALE` reduced from `1.33` to `0.25` (gyro: ±15° → ±3.75 px drift instead of ±20 px).
   - Mouse float multiplier reduced from `0.13` to `0.025` (same ratio).
   - With minimal translation the card appears anchored — only rotating in place — which reads as physically real rather than floating.
   - Perspective tightened from `1200px` to `900px` on the float wrapper for stronger 3D depth.
   - Added `transformStyle: 'preserve-3d'` to the float wrapper so the card's 3D transforms are properly maintained within the parent's 3D context.

3. **`InvoiceModal.tsx` — Match Close button size to Language selector button:**
   - Close button changed from `p-3 border border-gray-200` to `py-2.5 px-2.5 border-2 border-[#d9d3ce] hover:border-[#2d2d2b]` — matching the language button's vertical padding and border weight.
   - Icon kept at `w-5 h-5` (fixed, previously `sm:w-6 sm:h-6` which made it taller on sm+ screens).
   - Both buttons now share the same height (~40–44 px) at all viewport sizes.

---

### 2026-03-17 — Robustify Haptics + Add Copilot Context File

**Haptic gaps fixed:**

1. **`src/App.tsx` — Ledger69 external link:** The `<motion.a>` linking to `https://ledger69.vercel.app/` had no haptic feedback on tap. Added `onClick={() => hapticLight()}` (light tap for external link navigation). Also added `hapticLight` to the import.

2. **`src/components/ReceiptModals.tsx` — SenderNameModal form submit:** The `handleSubmit` function triggered receipt generation (a primary CTA action) but had no haptic. Added `hapticHeavy()` at the top of the success branch in `handleSubmit`, matching the haptic policy for primary form submissions.

**Knowledge file created:**

- `.github/copilot-context.md` — comprehensive single-file reference for Copilot agents covering app overview, full repository structure, every component's role and features, utility references, localStorage keys, API routes, build instructions, haptic policy, and this update log.

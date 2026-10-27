# Tastely Demo Payment Mode (College Expo Simulation) — Revised Plan

A dedicated, isolated sandbox simulation mode for Tastely designed for college expos, hackathons, and demo presentations. It allows attendees, judges, and stall managers to experience complete order placement, payment simulation, and order handover without transferring real money, while strictly isolating demo state from real financial records and keeping existing database records intact.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Strict Financial & Data Boundary**:
> 1. Demo payments are strictly labeled with **DEMO — NO REAL MONEY TRANSFERRED** across the entire interface (checkout, customer receipts, order history drawer, and vendor dashboard).
> 2. Demo payment states are recorded using isolated statuses (`demo_pending`, `demo_completed`, `demo_failed`) and a dedicated flag (`isDemoPayment: true`). They are **never** assigned `verified`, `received`, or `paid`, and will never be confused with actual bank reconciliations.
> 3. Real UPI verification and Pay on Pickup handover safeguards remain 100% active and unmodified. Real orders can never be completed via simulation.
> 4. All 7 existing orders, 5 donations, 1 reservation, and current inventory remain completely preserved.

---

## 1. Overview & Core Concept

- **What It Does**: Adds an explicit **Demo Payment Mode** that allows customers to test ordering by simulating either a **successful** or **failed** payment.
- **Privacy & Safety First**:
  - In demo mode, real vendor UPI IDs, QR codes, phone numbers, and bank account names are completely hidden.
  - The customer is never prompted for real UPI credentials, bank PINs, OTPs, or actual UPI apps.
  - A watermark simulation panel displays interactive **Simulate Success** and **Simulate Failure** buttons.
- **Expo Readiness**: The feature remains permanently available without auto-expiration or automatic removal so stall vendors and organizers can demo the system at will throughout the expo.

---

## 2. User Experience & Visual Design

### 2.1 Checkout Payment Method Selector (`CheckoutModal.tsx`)
A dedicated 3rd radio card is added to the payment method selection:
- **Card Title**: `Demo Payment (College Expo Simulation)`
- **Prominent Tag**: `[DEMO — NO REAL MONEY TRANSFERRED]` (High-contrast Indigo/Purple badge `#6366f1`)
- **Subtitle**: *Instant sandbox simulation for attendees & judges. No real payment required.*
- Selecting this option sets `paymentMethod = 'demo'`.

### 2.2 Sandboxed Demo Payment Simulator Modal (`DemoPaymentModal.tsx`)
When the customer submits a demo order or clicks "Simulate Demo Payment" in their order drawer:
1. **Notice Banner**:
   ```
   ⚠️ DEMO PAYMENT MODE — NO REAL MONEY TRANSFERRED
   This is an interactive simulation for the College Expo. No funds will be debited or credited.
   ```
2. **Simulation Display**:
   - Simulated Payee: `Tastely Expo Demo Stall`
   - Simulated UPI Handle: `demo.expo@tastely`
   - Watermarked Simulation Shield with text: *"SANDBOX ONLY — DO NOT USE IN BANKING APPS"*.
3. **Interactive Simulation Controls**:
   - **Simulate Success**:
     - Generates a synthetic reference (`DEMO-SIM-XXXXX`).
     - Transitions status to `demo_completed`.
     - Triggers celebratory UI confetti and generates a demo customer receipt.
   - **Simulate Failure**:
     - Lets the user pick a simulated failure reason (e.g., *"Simulated Bank Network Timeout"*, *"Simulated Insufficient Balance"*, *"Simulated User Decline"*).
     - Transitions status to `demo_failed`.
     - Renders a clear failure alert explaining the simulated rejection.

### 2.3 Customer Order History Drawer (`CustomerOrdersDrawer.tsx`)
- Demo orders render with a distinct purple badge:
  - `[DEMO PAYMENT: SIMULATED SUCCESS]` (when completed)
  - `[DEMO PAYMENT: SIMULATED FAILED]` (when failed)
  - `[DEMO PAYMENT: PENDING SIMULATION]` (when pending)
- Always displays the bold banner: **DEMO — NO REAL MONEY TRANSFERRED**.
- Includes a button to re-open the simulator if pending or to view the demo receipt.

### 2.4 Vendor Dashboard (`VendorDashboard.tsx`)
- Orders with `isDemoPayment: true` are instantly distinguishable:
  - Header badge: `[DEMO ORDER — NO REAL MONEY TRANSFERRED]` (Purple banner).
  - Status display: Shows `Demo Payment Simulated (Success)` or `Demo Payment Failed`.
  - **Handover Safeguard Behavior**:
    - If `demo_pending` or `demo_failed`: Handover button is blocked with an amber warning: *"Handover Blocked: Demo payment simulation is not successful."*
    - If `demo_completed`: Handover button displays **"Complete Demo Handover"** with a confirmation note that this is a simulated demo handover.

---

## 3. Technical Architecture & System Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Customer Checkout View                         │
│  Options: [Pay on Pickup]  |  [Real UPI Transfer]  |  [Expo Demo Mode] │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────────┐           ┌────────────────────────────────┐
│   Real Payment Flows          │           │    Demo Payment Simulator      │
│  - Real Vendor UPI ID / QR    │           │  - Mock ID: demo.expo@tastely  │
│  - Customer submits bank UTR  │           │  - Real UPI ID NEVER exposed   │
│  - Status: 'verified' by bank │           │  - [Simulate Success] Button   │
│  - Status: 'received' by cash │           │  - [Simulate Failure] Button   │
└──────────────┬────────────────┘           └───────────────┬────────────────┘
               ▼                                            ▼
┌───────────────────────────────┐           ┌────────────────────────────────┐
│ Handover Check (Real Orders)  │           │ Handover Check (Demo Orders)   │
│ - UPI: paymentStatus MUST be  │           │ - order.isDemoPayment === true │
│   'verified'                  │           │ - paymentStatus MUST be        │
│ - Pickup: paymentStatus MUST  │           │   'demo_completed'             │
│   be 'verified'/'received'    │           │ - Blocked if 'demo_failed' or  │
│                               │           │   'demo_pending'               │
└───────────────────────────────┘           └────────────────────────────────┘
```

### 3.1 Data Schema Changes (`src/types/index.ts`)
- `PaymentMethod`: `'pay_on_pickup' | 'upi' | 'demo'`
- `PaymentStatus`: `'pending' | 'payment_submitted' | 'verified' | 'failed' | 'pay_on_pickup' | 'received' | 'paid' | 'demo_pending' | 'demo_completed' | 'demo_failed'`
- `Order` model extensions:
  ```ts
  isDemoPayment?: boolean;
  demoPaymentOutcome?: 'success' | 'failure';
  demoFailureReason?: string;
  demoSimulatedAt?: string;
  ```

### 3.2 Backend Implementation Details (`server.ts`)
1. **Order Creation (`POST /api/orders`)**:
   - When `paymentMethod === 'demo'`:
     - Sets `isDemoPayment: true`.
     - Sets `paymentStatus: 'demo_pending'`.
     - Sets `upiId: 'demo.expo@tastely'` and `upiPayeeName: 'Expo Demo Sandbox'` (real vendor credentials are never written to the demo order).
2. **Simulation Endpoint (`POST /api/orders/:id/simulate-demo-payment`)**:
   - Protected: Only the order owner or vendor/admin can trigger simulation.
   - Rejects if the order is not a demo order (`!order.isDemoPayment`).
   - If `outcome === 'success'`:
     - `paymentStatus = 'demo_completed'`
     - `demoPaymentOutcome = 'success'`
     - `upiReference = 'DEMO-SIM-' + Math.floor(100000 + Math.random() * 900000)`
     - `paymentVerificationNotes = 'DEMO SIMULATION: Simulated successful payment for Expo (No real money transferred)'`
     - `demoSimulatedAt = new Date().toISOString()`
   - If `outcome === 'failure'`:
     - `paymentStatus = 'demo_failed'`
     - `demoPaymentOutcome = 'failure'`
     - `demoFailureReason = failureReason || 'Simulated bank network decline'`
     - `paymentVerificationNotes = 'DEMO SIMULATION FAILED: ' + demoFailureReason`
     - `demoSimulatedAt = new Date().toISOString()`
   - Writes to `data/tastely-db.json` atomically.
3. **Handover Enforcement (`PATCH /api/orders/:id/status`)**:
   - When attempting `status === 'completed'`:
     - **For Demo Orders (`order.isDemoPayment === true`)**:
       - If `order.paymentStatus !== 'demo_completed'`:
         - Returns **HTTP 400**:
           `"Cannot complete handover: Demo payment is in '${order.paymentStatus}' state. You must simulate a successful demo payment before completing this demo order."`
     - **For Real UPI Orders (`order.paymentMethod === 'upi'`)**:
       - Preserved unchanged: Strictly requires `order.paymentStatus === 'verified'`.
     - **For Pay on Pickup Orders (`order.paymentMethod === 'pay_on_pickup'`)**:
       - Preserved unchanged: Strictly requires `['verified', 'received', 'paid'].includes(order.paymentStatus)`.
4. **Protection Against Cross-Contamination**:
   - The vendor real-payment verification endpoint (`/api/orders/:id/verify-payment`) will explicitly reject demo orders with: *"Demo orders cannot be processed through real bank verification. Use the Demo Simulation panel."*

---

## 4. Exact Files to Modify

1. **`src/types/index.ts`**:
   - Add `'demo'` to `PaymentMethod`.
   - Add `'demo_pending'`, `'demo_completed'`, `'demo_failed'` to `PaymentStatus`.
   - Add `isDemoPayment`, `demoPaymentOutcome`, `demoFailureReason`, and `demoSimulatedAt` to `Order` interface.
2. **`server.ts`**:
   - Support `paymentMethod: 'demo'` in `POST /api/orders`.
   - Implement `POST /api/orders/:id/simulate-demo-payment` endpoint.
   - Enforce demo handover validation in `PATCH /api/orders/:id/status` without affecting real UPI or Pay on Pickup rules.
   - Prevent real payment verification routes from modifying demo orders.
3. **`src/services/api.ts`**:
   - Add `simulateDemoPayment(orderId, outcome, failureReason)` helper.
4. **`src/components/CheckoutModal.tsx`**:
   - Add **Demo Payment (College Expo Simulation)** option labeled **DEMO — NO REAL MONEY TRANSFERRED**.
   - Mask UPI details on demo order placement.
5. **`src/components/DemoPaymentModal.tsx`** *(New File)*:
   - Sandboxed modal displaying simulation details, mock handle, **Simulate Success**, and **Simulate Failure** buttons.
6. **`src/components/CustomerOrdersDrawer.tsx`**:
   - Render explicit demo badges (`[DEMO — NO REAL MONEY TRANSFERRED]`).
   - Trigger the Demo Simulator modal for demo orders.
7. **`src/components/VendorDashboard.tsx`**:
   - Render distinct purple `[DEMO ORDER — NO REAL MONEY TRANSFERRED]` banners.
   - Block handover if demo payment is pending or failed.
   - Allow "Complete Demo Handover" once `demo_completed`.

---

## 5. Comprehensive Test Specification

An automated test suite will be run to verify the following cases:

1. **Test 1: Demo Order Creation & Data Masking**
   - Place an order with `paymentMethod: 'demo'`.
   - Verify `isDemoPayment === true`, `paymentStatus === 'demo_pending'`.
   - Verify vendor's real UPI ID is masked with `demo.expo@tastely`.
2. **Test 2: Simulated Success Flow**
   - Call `simulate-demo-payment` with `outcome: 'success'`.
   - Verify status becomes `demo_completed` with synthetic reference `DEMO-SIM-XXXXXX`.
   - Verify it is **not** marked as `verified` or `paid`.
3. **Test 3: Simulated Failure Flow**
   - Create a second demo order and simulate failure with reason: *"Simulated Bank Network Timeout"*.
   - Verify status becomes `demo_failed` and failure reason is recorded.
4. **Test 4: Handover Safeguards for Demo Orders**
   - Attempt vendor handover on `demo_failed` order -> **Must be rejected with HTTP 400**.
   - Attempt vendor handover on `demo_pending` order -> **Must be rejected with HTTP 400**.
   - Attempt vendor handover on `demo_completed` order -> **Must succeed with HTTP 200**.
5. **Test 5: Real Payment Safeguard Regression & Integrity**
   - Attempt handover on real UPI order with pending payment -> **Must be rejected with HTTP 400**.
   - Attempt handover on real Pay on Pickup order without counter collection -> **Must be rejected with HTTP 400**.
   - Confirm real UPI verification endpoint rejects demo orders.
6. **Test 6: Database & Entity Preservation**
   - Check that all original 7 orders, 5 donations, 1 reservation, and inventory are 100% intact.
   - Run `npm run lint` (`tsc --noEmit`) and `npm run build`.
   - Verify homepage and UI rendering in headless browser.

---

## 6. Safety & Non-Regression Summary
- **No data reset**: The database will not be seeded, reset, or recreated.
- **No fake bank records**: Demo success will never be written as a real bank confirmation.
- **No loss of demo capability**: The demo mode will remain active and accessible for the entire duration of the college expo.

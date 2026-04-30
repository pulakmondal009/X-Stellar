# X-Stellar — Requirement Proof Matrix

Maps each feature requirement to its implementation files.

---

## Core Features

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **Split Equal** | `lib/split/calculator.ts` | `__tests__/split/calculator.test.ts` |
| **Split Weighted** | `lib/split/calculator.ts` | `__tests__/split/calculator.test.ts` |
| **Split Custom** | `lib/split/calculator.ts` | `__tests__/split/calculator.test.ts` |
| **Amount Validation** | `lib/split/calculator.ts` (`isValidXLMAmount`) | `__tests__/split/calculator.test.ts` |
| **Address Validation** | `lib/split/calculator.ts` (`isValidStellarAddress`) | `__tests__/split/calculator.test.ts` |

## Payments

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **On-Chain Payment** | `hooks/usePayment.ts`, `lib/stellar/buildTransaction.ts`, `lib/stellar/submitTransaction.ts` | `__tests__/stellar/buildTransaction.test.ts`, `__tests__/stellar/submitTransaction.test.ts`, `__tests__/payment/usePayment.integration.test.tsx` |
| **Contract Recording** | `lib/stellar/contract.ts` | `__tests__/stellar/contractErrors.test.ts` |
| **QR Payments** | `lib/qr/generator.ts`, `components/payment/QRCodeDisplay.tsx` | — |
| **Transaction Signing** | `lib/freighter/index.ts` (`signXDR`) | `__tests__/freighter/index.test.ts` |

## Settlement

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **Trip Settlement** | `lib/settlement/netBalance.ts`, `components/trips/SettlementSummary.tsx` | `__tests__/settlement/netBalance.test.ts` |
| **Net Payment Simplification** | `lib/settlement/netBalance.ts` (`computeNetPayments`) | `__tests__/settlement/netBalance.test.ts` |

## Wallet Integration

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **Freighter Detection** | `lib/freighter/index.ts` (`isFreighterInstalled`) | `__tests__/freighter/index.test.ts` |
| **Wallet Connect** | `context/WalletContext.tsx`, `components/wallet/ConnectWalletButton.tsx` | `__tests__/freighter/index.test.ts` |
| **Balance Display** | `lib/stellar/getBalance.ts`, `components/wallet/WalletInfo.tsx` | — |
| **Wallet Guard** | `components/wallet/WalletGuard.tsx` | — |

## Authentication & Authorization

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **Auth Guard** | `components/auth/AuthGuard.tsx` | — |
| **User Sign Up / Sign In** | `context/AuthContext.tsx` | — |
| **Graceful Degradation** | `context/AuthContext.tsx` (localStorage fallback), `lib/supabase/client.ts` (`isSupabaseConfigured`) | — |

## Data Layer

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **Expense CRUD** | `context/ExpenseContext.tsx` | — |
| **Trip CRUD** | `context/TripContext.tsx` | — |
| **Supabase Storage** | `lib/supabase/client.ts`, `supabase-setup.sql` | — |
| **localStorage Fallback** | `context/ExpenseContext.tsx`, `context/TripContext.tsx`, `context/AuthContext.tsx` | — |

## Smart Contract

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **Soroban Contract** | `contract/src/lib.rs` | — |
| **Pool Aggregation** | `contract/src/pool.rs` | — |
| **Event Parsing** | `lib/stellar/events.ts` | `__tests__/stellar/eventsParser.test.ts` |

## UI Components

| Feature | Implementation Files |
|---------|---------------------|
| **Landing Page** | `components/landing/Hero.tsx`, `Features.tsx`, `HowItWorks.tsx`, `Pricing.tsx`, `DarkSection.tsx`, `CTASection.tsx`, `StatsSection.tsx`, `Testimonials.tsx` |
| **Expense Form** | `components/expenses/ExpenseForm.tsx` |
| **Split Calculator** | `components/expenses/SplitCalculator.tsx` |
| **Receipt Modal** | `components/expenses/ReceiptModal.tsx` |
| **Payment Row** | `components/expenses/PaymentRow.tsx` |
| **Pay Button** | `components/payment/PayButton.tsx` |
| **Payment Status** | `components/payment/PaymentStatus.tsx` |
| **Transaction Hash** | `components/payment/TransactionHash.tsx` |
| **Trip Card** | `components/trips/TripCard.tsx` |
| **Trip Form** | `components/trips/TripForm.tsx` |
| **Expense List** | `components/trips/ExpenseList.tsx` |
| **Header / Footer** | `components/layout/Header.tsx`, `components/layout/Footer.tsx` |
| **Modal System** | `components/ui/Modal.tsx` |
| **Toast Notifications** | `components/ui/Toast.tsx` |
| **Utility Components** | `components/ui/Badge.tsx`, `Button.tsx`, `Input.tsx`, `Logo.tsx`, `Spinner.tsx` |

## Formatters & Utilities

| Feature | Implementation Files | Tests |
|---------|---------------------|-------|
| **Format Address** | `lib/utils.ts` (`formatAddress`) | `__tests__/utils/formatters.test.ts` |
| **Format XLM** | `lib/utils.ts` (`formatXLM`) | `__tests__/utils/formatters.test.ts` |
| **Constants** | `lib/utils/constants.ts` | — |

## Infrastructure

| Feature | Implementation Files |
|---------|---------------------|
| **CI Pipeline** | `.github/workflows/ci.yml` |
| **Production Checks** | `.github/workflows/production-check.yml` |
| **Deploy Script** | `scripts/deploy-contract.sh` |
| **Database Schema** | `supabase-setup.sql` |

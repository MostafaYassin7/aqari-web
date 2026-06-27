[PASTE SESSION HEADER ABOVE FIRST]

Build the Wallet page.
Protected — requires login.

─── API FUNCTIONS ───────────────────────────────────────────

Add to src/lib/api.ts:

export async function getWallet() {
  // Returns: { id, userId, balance: string, currency: "SAR" }
  // balance is a string — always parseFloat(balance)
  return apiRequest<{
    id: string;
    userId: string;
    balance: string;
    currency: string;
  }>('/wallet', {}, true);
}

export async function getTransactions(params: {
  page?: number;
  limit?: number;
  referenceType?: string;
}) {
  // referenceType: top_up | promotion | subscription | booking
  // Returns paginated: { data: Transaction[], total, page, pages }
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiRequest<{
    data: any[];
    total: number;
    page: number;
    pages: number;
  }>(`/wallet/transactions?${query}`, {}, true);
}

export async function topUpWallet(amount: number) {
  // POST /wallet/top-up
  // Body: { amount, paymentMethod: 'test' }
  return apiRequest<{ balance: string }>(
    '/wallet/top-up',
    {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod: 'test' }),
    },
    true
  );
}

─── WALLET PAGE ─────────────────────────────────────────────

Create src/app/[locale]/dashboard/wallet/page.tsx:

On load:
  getWallet() → display balance
  getTransactions({ page: 1, limit: 20 })

Balance card:
  Gradient: from-[#F5A623] to-[#E09400]
  White text
  Label: "الرصيد المتاح"
  Balance: parseFloat(balance).toLocaleString('ar-SA')
  Suffix: "ريال سعودي"
  Rounded-2xl, shadow-lg, p-6

"شحن المحفظة" button below card:
  Outlined, #F5A623 border + text
  Opens top-up modal

Top-up modal:
  Title: "شحن المحفظة"
  Amount input (number, min: 100)
  Quick amount pills:
    100 | 500 | 1000 | 5000
    Click → sets amount
  "شحن الآن" button (#F5A623)
  On confirm:
    topUpWallet(amount)
    Close modal
    Refresh balance
    Show toast: "تم شحن المحفظة بنجاح"

Transactions section:
  Title: "سجل المعاملات"

  Filter tabs:
    الكل | إيداع (credit) | سحب (debit)
    On change: reload with filter

  Transaction item:
    Icon:
      credit → green arrow up ↑
      debit  → red arrow down ↓
    Description (bold)
    Date: format as "DD MMM YYYY"
    Amount:
      credit: "+500.00 ريال" (green)
      debit:  "-150.00 ريال" (red)
    ReferenceType badge (small grey):
      top_up        → "شحن"
      promotion     → "إعلان مميز"
      subscription  → "اشتراك"
      booking       → "حجز"

  Load more button:
    If page < pages → show "تحميل المزيد"
    On click: load next page, append to list

─── TEST ────────────────────────────────────────────────────

1. Open /dashboard/wallet
   Expected: real balance shown ✅
   parseFloat("500.00") = 500 displayed ✅

2. Click شحن → enter 1000 → confirm
   Expected: balance increases by 1000 ✅
   New transaction appears at top of list ✅
   ReferenceType shows "شحن" ✅

3. Filter by إيداع
   Expected: only credit transactions ✅
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUpCircle, ArrowDownCircle, X, CreditCard, Loader2 } from 'lucide-react';
import { getWallet, getTransactions, initiatePaymentSession, executePayment } from '@/lib/api';

declare global {
  interface Window {
    myFatoorah?: {
      init: (config: Record<string, unknown>) => void;
      submit: () => Promise<void>;
    };
  }
}

type TxType = '' | 'credit' | 'debit';
type TopUpStep = 'amount' | 'card' | 'redirecting';

const REF_LABEL: Record<string, string> = {
  top_up: 'شحن', promotion: 'إعلان مميز', subscription: 'اشتراك', booking: 'حجز',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = any;

function getMfScriptUrl(countryCode: string) {
  return countryCode === 'SAR'
    ? 'https://sa.myfatoorah.com/cardview/v2/session.js'
    : 'https://demo.myfatoorah.com/cardview/v2/session.js';
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

function formatDate(str: string) {
  try {
    return new Date(str).toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return str; }
}

export default function WalletPage() {
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [heldBalance, setHeldBalance] = useState<number>(0);
  const [pendingEarnings, setPendingEarnings] = useState<number>(0);
  const [currency, setCurrency] = useState('SAR');
  const [walletLoading, setWalletLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState<TxType>('');
  const [loadingMore, setLoadingMore] = useState(false);

  // top-up state
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [step, setStep] = useState<TopUpStep>('amount');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [sessionData, setSessionData] = useState<{ sessionId: string; countryCode: string } | null>(null);
  const [mfLoading, setMfLoading] = useState(false);
  const [cardError, setCardError] = useState('');
  const [toast, setToast] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  // Fired when MF CardView postMessage arrives with a new tokenized SessionId
  const onMfSuccess = useRef<((newSessionId: string) => void) | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  // Listen for MyFatoorah CardView postMessage (v2 SDK delivers result this way)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // MF iframe may send data as a JSON string or a plain object
      let msg = event.data;
      if (typeof msg === 'string') {
        try { msg = JSON.parse(msg); } catch { return; }
      }
      if (!msg || typeof msg !== 'object') return;
      console.log('[MF postMessage]', msg);
      if (msg.sender !== 'CardView') return;
      if (msg.type === 1 && msg.data?.IsSuccess) {
        const newSessionId = msg.data.Data?.SessionId as string;
        onMfSuccess.current?.(newSessionId);
      } else if (msg.type === 2 || (msg.data && msg.data.IsSuccess === false)) {
        const errMsg = msg.data?.Message || 'تحقق من بيانات البطاقة وأعد المحاولة';
        setCardError(typeof errMsg === 'string' ? errMsg : 'تحقق من بيانات البطاقة');
        setMfLoading(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      const w = await getWallet();
      setBalance(parseFloat(w.balance));
      setHeldBalance(parseFloat(w.heldBalance ?? '0'));
      setPendingEarnings(parseFloat(w.pendingEarnings ?? '0'));
      setCurrency(w.currency);
    } catch { /* ignore */ } finally { setWalletLoading(false); }
  }, []);

  const loadTxs = useCallback(async (pg: number, type: TxType, append = false) => {
    append ? setLoadingMore(true) : setTxLoading(true);
    try {
      const params: Parameters<typeof getTransactions>[0] = { page: pg, limit: 20 };
      if (type) params.referenceType = type;
      const res = await getTransactions(params);
      setTxs((prev) => append ? [...prev, ...(res.data as Tx[] ?? [])] : (res.data as Tx[] ?? []));
      setPage(pg); setPages(res.pages ?? 1);
    } catch { /* ignore */ } finally { append ? setLoadingMore(false) : setTxLoading(false); }
  }, []);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  useEffect(() => { loadTxs(1, filter); }, [filter, loadTxs]);

  // Handle post-3DS redirect from MyFatoorah callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      showToast('تمت عملية الدفع بنجاح، سيتم تحديث رصيدك خلال لحظات');
      // Reload balance after a short delay to let the webhook process
      setTimeout(() => loadWallet(), 4000);
    } else if (payment === 'error') {
      showToast('فشلت عملية الدفع، يرجى المحاولة مرة أخرى');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 1: initiate session and load card form ────────────────────────────
  const handleContinueToCard = async () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt < 100) return;
    setMfLoading(true);
    setCardError('');
    try {
      const session = await initiatePaymentSession(amt);
      setSessionData(session);
      setStep('card');

      await loadScript(getMfScriptUrl(session.countryCode));
      await new Promise((r) => setTimeout(r, 100));

      // v2 SDK: no callbacks in init() — response arrives via window postMessage
      window.myFatoorah?.init({
        sessionId: session.sessionId,
        countryCode: session.countryCode,
        cardViewId: 'mf-card-view',
        supportedNetworks: 'v,m,md,ae',
      });
    } catch (e: unknown) {
      setCardError(e instanceof Error ? e.message : 'حدث خطأ، حاول مجدداً');
    } finally {
      setMfLoading(false);
    }
  };

  // ── Step 2: register execute handler then await submit() ──────────────────
  const handlePay = async () => {
    if (!sessionData) return;
    setMfLoading(true);
    setCardError('');

    const amt = parseFloat(topUpAmount);

    // postMessage listener (set up in useEffect) will call this when MF responds
    onMfSuccess.current = async (newSessionId: string) => {
      try {
        const result = await executePayment(newSessionId, amt);
        if (result.paymentURL) {
          setStep('redirecting');
          setTimeout(() => { window.location.href = result.paymentURL!; }, 1500);
        } else {
          closeModal();
          showToast('جاري معالجة الدفع، سيتم تحديث رصيدك قريباً');
          setTimeout(() => loadWallet(), 5000);
        }
      } catch (e: unknown) {
        setCardError(e instanceof Error ? e.message : 'فشل تنفيذ الدفع');
        setMfLoading(false);
      }
    };

    try {
      console.log('[MF] myFatoorah object:', window.myFatoorah);
      // v2 SDK: submit() returns a Promise; result not used, response via postMessage
      await window.myFatoorah?.submit();
      console.log('[MF] submit() resolved');
    } catch (e: unknown) {
      console.error('[MF] submit() threw:', e);
      setCardError(e instanceof Error ? e.message : 'تحقق من بيانات البطاقة وأعد المحاولة');
      setMfLoading(false);
    }
  };

  const closeModal = () => {
    setTopUpOpen(false);
    setStep('amount');
    setTopUpAmount('');
    setSessionData(null);
    setCardError('');
    setMfLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-2xl font-black text-[#222222]">المحفظة</h1>

      {/* Balance card */}
      <div className="rounded-2xl shadow-lg p-6 text-white" style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E09400 100%)' }}>
        <p className="text-sm font-medium opacity-80 mb-1">الرصيد المتاح</p>
        {walletLoading
          ? <div className="h-10 w-40 bg-white/20 rounded-xl animate-pulse mt-1" />
          : <p className="text-4xl font-black tracking-tight">
              {balance !== null ? balance.toLocaleString('ar-SA', { minimumFractionDigits: 2 }) : '—'}
            </p>
        }
        <p className="text-sm font-medium opacity-70 mt-1">{currency === 'SAR' ? 'ريال سعودي' : currency}</p>
      </div>

      {(heldBalance > 0 || pendingEarnings > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {heldBalance > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-[#717171] mb-1">محجوز للحجوزات</p>
              <p className="text-lg font-black text-[#222222]">
                {heldBalance.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ريال
              </p>
            </div>
          )}
          {pendingEarnings > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-[#717171] mb-1">أرباح حجوزات قيد الانتظار</p>
              <p className="text-lg font-black text-[#222222]">
                {pendingEarnings.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ريال
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top-up button */}
      <button
        onClick={() => setTopUpOpen(true)}
        className="w-full h-12 border-2 border-[#F5A623] text-[#F5A623] font-bold rounded-xl text-sm hover:bg-orange-50 transition-colors"
      >
        شحن المحفظة
      </button>

      {/* Transactions */}
      <div>
        <h2 className="text-base font-bold text-[#222222] mb-3">سجل المعاملات</h2>
        <div className="flex gap-2 mb-4">
          {([['', 'الكل'], ['credit', 'إيداع'], ['debit', 'سحب']] as [TxType, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${filter === val ? 'bg-[#F5A623] border-[#F5A623] text-white' : 'border-gray-200 text-[#717171] hover:border-gray-300 bg-white'}`}
            >{label}</button>
          ))}
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <span className="text-5xl">💳</span>
            <p className="text-base font-bold text-[#222222]">لا توجد معاملات بعد</p>
            <p className="text-sm text-[#717171]">معاملاتك المالية ستظهر هنا</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((tx: Tx, i: number) => {
              const isCredit = tx.type === 'credit';
              const amount = parseFloat(String(tx.amount ?? 0));
              return (
                <div key={tx.id ?? i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isCredit ? <ArrowUpCircle size={20} className="text-green-500" /> : <ArrowDownCircle size={20} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#222222] line-clamp-1">{tx.description ?? tx.referenceType ?? (isCredit ? 'إيداع' : 'سحب')}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-[#717171]">{formatDate(tx.createdAt ?? tx.date ?? '')}</p>
                      {tx.referenceType && <span className="text-[10px] bg-gray-100 text-[#717171] px-1.5 py-0.5 rounded-full">{REF_LABEL[tx.referenceType] ?? tx.referenceType}</span>}
                    </div>
                  </div>
                  <p className={`text-sm font-black shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                    {isCredit ? '+' : '-'}{amount.toFixed(2)} ريال
                  </p>
                </div>
              );
            })}
            {page < pages && (
              <button onClick={() => loadTxs(page + 1, filter, true)} disabled={loadingMore}
                className="w-full h-11 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loadingMore && <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-[#F5A623]" />}
                تحميل المزيد
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Top-up modal ─────────────────────────────────────────────────────── */}
      {topUpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" dir="rtl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#222222]">
                {step === 'amount' ? 'شحن المحفظة' : step === 'card' ? 'بيانات البطاقة' : 'جاري التحويل…'}
              </h3>
              {step !== 'redirecting' && (
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={18} className="text-[#717171]" />
                </button>
              )}
            </div>

            {/* ── Amount step ── */}
            {step === 'amount' && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1.5">المبلغ (ريال)</label>
                  <input
                    type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
                    min={100} placeholder="الحد الأدنى 100 ريال"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] transition-colors bg-white"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-2">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <button key={amt} onClick={() => setTopUpAmount(String(amt))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${topUpAmount === String(amt) ? 'border-[#F5A623] bg-orange-50 text-[#F5A623]' : 'border-gray-200 text-[#717171] hover:border-gray-300'}`}
                    >{amt.toLocaleString('ar-SA')}</button>
                  ))}
                </div>
                {cardError && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{cardError}</p>}
                <button
                  onClick={handleContinueToCard}
                  disabled={mfLoading || !topUpAmount || parseFloat(topUpAmount) < 100}
                  className="w-full h-12 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {mfLoading ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={16} /> متابعة للدفع</>}
                </button>
              </div>
            )}

            {/* ── Card step ── */}
            {step === 'card' && (
              <div className="p-5 space-y-4">
                {/* Amount banner */}
                <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5A623]/20 flex items-center justify-center shrink-0">
                    <CreditCard size={18} className="text-[#F5A623]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#717171]">شحن المحفظة</p>
                    <p className="text-base font-black text-[#222222]">{parseFloat(topUpAmount).toLocaleString('ar-SA')} ريال</p>
                  </div>
                </div>

                {/* MyFatoorah card form container */}
                <div ref={cardRef} id="mf-card-view" className="min-h-[240px]" />

                {cardError && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{cardError}</p>}

                <button
                  onClick={handlePay}
                  disabled={mfLoading}
                  className="w-full h-12 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {mfLoading
                    ? <><Loader2 size={18} className="animate-spin" /> جاري المعالجة…</>
                    : `ادفع ${parseFloat(topUpAmount).toLocaleString('ar-SA')} ريال`
                  }
                </button>
              </div>
            )}

            {/* ── Redirecting step ── */}
            {step === 'redirecting' && (
              <div className="p-8 flex flex-col items-center gap-4 text-center">
                <Loader2 size={40} className="animate-spin text-[#F5A623]" />
                <p className="text-base font-bold text-[#222222]">جاري التحويل لبوابة الدفع…</p>
                <p className="text-sm text-[#717171]">ستتم إعادة توجيهك تلقائياً إلى صفحة الدفع الآمنة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 start-4 end-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[#222222] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

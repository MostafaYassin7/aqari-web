'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/navigation';
import { Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  getMyBookingsAsGuest, getMyBookingsAsOwner,
  cancelBooking, confirmBooking, declineBooking, createOrFindChat,
} from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = any;
type Tab = 'guest' | 'owner';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'في الانتظار', className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'مؤكد',        className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ملغي',        className: 'bg-red-100 text-red-700' },
  completed: { label: 'مكتمل',       className: 'bg-gray-100 text-gray-600' },
};

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

function formatDate(d: string) {
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
}

export default function BookingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('guest');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false, title: '', message: '', onConfirm: () => {},
  });
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    setError('');
    try {
      const res = t === 'guest' ? await getMyBookingsAsGuest() : await getMyBookingsAsOwner();
      setBookings(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirmState({ open: true, title, message, onConfirm });
  }

  function handleCancel(id: string) {
    askConfirm('إلغاء الحجز', 'هل تريد إلغاء طلب الحجز؟', async () => {
      setConfirmState((c) => ({ ...c, open: false }));
      setActionLoading(id);
      try {
        await cancelBooking(id);
        setBookings((prev) => prev.filter((b) => b.id !== id));
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'حدث خطأ');
      } finally {
        setActionLoading(null);
      }
    });
  }

  function handleConfirmBooking(id: string) {
    askConfirm(
      'تأكيد الحجز',
      'هل تريد تأكيد هذا الحجز؟ سيتم حجز مبلغ الحجز من محفظة الضيف الآن، وتحويله لمحفظتك بعد 7 أيام من انتهاء الحجز.',
      async () => {
        setConfirmState((c) => ({ ...c, open: false }));
        setActionLoading(id);
        try {
          const res = await confirmBooking(id);
          setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: res.status } : b)));
          showToast('✅ تم تأكيد الحجز');
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'حدث خطأ');
        } finally {
          setActionLoading(null);
        }
      }
    );
  }

  async function handleDecline() {
    if (!declineTarget) return;
    const id = declineTarget;
    setActionLoading(id);
    try {
      const res = await declineBooking(id, declineReason || undefined);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: res.status } : b)));
      setDeclineTarget(null);
      setDeclineReason('');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChat(participantId: string | undefined, listingId: string | undefined) {
    if (!participantId) return;
    try {
      const res = await createOrFindChat(participantId, listingId);
      router.push(`/account/chat?chatId=${res.id}`);
    } catch { /* silent */ }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-black text-[#222222] mb-6">حجوزاتي</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 mb-6">
        <button
          onClick={() => setTab('guest')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            tab === 'guest' ? 'border-[#F5A623] text-[#F5A623]' : 'border-transparent text-gray-500 hover:text-[#222222]'
          }`}
        >
          حجوزاتي
        </button>
        <button
          onClick={() => setTab('owner')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            tab === 'owner' ? 'border-[#F5A623] text-[#F5A623]' : 'border-transparent text-gray-500 hover:text-[#222222]'
          }`}
        >
          طلبات الحجز
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse flex gap-3">
              <div className="w-24 h-[72px] rounded-lg bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && bookings.length === 0 && tab === 'guest' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Calendar size={64} className="text-gray-300" strokeWidth={1.2} />
          <h3 className="text-xl font-bold text-[#222222]">لا توجد حجوزات بعد</h3>
          <Link
            href="/daily-rents"
            className="mt-2 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            استعرض الإيجار اليومي
          </Link>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && tab === 'owner' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p className="text-[#717171]">لا توجد طلبات حجز بعد</p>
        </div>
      )}

      {/* Booking cards */}
      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking: Booking) => {
            const statusCfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, className: 'bg-gray-100 text-gray-600' };
            const cover = booking.listing?.coverPhoto;
            const busy = actionLoading === booking.id;

            return (
              <div key={booking.id} className="relative flex gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                {/* Status badge */}
                <span className={`absolute top-3 end-3 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>

                {/* Cover photo */}
                <div className="relative w-24 h-[72px] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {cover ? (
                    <Image src={cover} alt={booking.listing?.title ?? ''} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Building2 size={22} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pe-16">
                  <p className="font-bold text-[#222222] text-sm leading-snug line-clamp-1">
                    {booking.listing?.title}
                  </p>
                  <p className="text-xs text-[#717171] mt-1" dir="ltr">
                    {formatDate(booking.checkInDate)} — {formatDate(booking.checkOutDate)}
                    <span dir="rtl"> · {booking.nights} ليالٍ</span>
                  </p>
                  <p className="font-bold text-[#F5A623] text-sm mt-1">
                    {parseFloat(booking.totalPrice).toLocaleString()} ريال
                  </p>

                  {tab === 'owner' && booking.guestCount != null && (
                    <p className="text-xs text-gray-400 mt-1">عدد الضيوف: {booking.guestCount}</p>
                  )}
                  {tab === 'owner' && booking.notes && (
                    <p className="text-xs text-gray-400 italic mt-0.5">{booking.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {tab === 'guest' && booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={busy}
                        className="text-red-500 border border-red-200 rounded-lg px-3 py-1 text-sm hover:bg-red-50 transition-colors disabled:opacity-60"
                      >
                        إلغاء الطلب
                      </button>
                    )}
                    {tab === 'guest' && booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleChat(booking.listing?.ownerId, booking.listingId)}
                        className="bg-[#F5A623] hover:bg-[#E09400] text-white rounded-lg px-3 py-1 text-sm transition-colors"
                      >
                        محادثة المضيف
                      </button>
                    )}

                    {tab === 'owner' && booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={busy}
                          className="bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg px-4 py-1 text-sm transition-colors disabled:opacity-60"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => setDeclineTarget(booking.id)}
                          disabled={busy}
                          className="border border-red-300 text-red-500 rounded-lg px-4 py-1 text-sm hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          رفض
                        </button>
                      </>
                    )}
                    {tab === 'owner' && booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleChat(booking.guestId ?? booking.guest?.id, booking.listingId)}
                        className="bg-[#F5A623] hover:bg-[#E09400] text-white rounded-lg px-3 py-1 text-sm transition-colors"
                      >
                        محادثة الضيف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmState.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" dir="rtl">
            <h3 className="text-lg font-bold text-[#222222] mb-2">{confirmState.title}</h3>
            <p className="text-sm text-[#717171] mb-6">{confirmState.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmState((c) => ({ ...c, open: false }))}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmState.onConfirm}
                className="flex-1 py-2.5 bg-[#F5A623] hover:bg-[#E09400] rounded-xl text-sm font-bold text-white transition-colors"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline reason modal */}
      {declineTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" dir="rtl">
            <h3 className="text-lg font-bold text-[#222222] mb-4">رفض طلب الحجز</h3>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="يمكنك كتابة سبب الرفض..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#F5A623] outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeclineTarget(null); setDeclineReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDecline}
                disabled={actionLoading === declineTarget}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
              >
                رفض الحجز
              </button>
            </div>
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

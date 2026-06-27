'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { verifyOtp, sendOtp } from '@/lib/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { connectChatSocket } from '@/lib/socket';

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('aqar_otp_phone');
    if (!stored) { router.replace('/login'); return; }
    setPhone(stored);
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const submit = useCallback(async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, code);
      if (res.isNewUser) {
        sessionStorage.setItem('aqar_temp_token', res.token);
        router.push('/register');
      } else {
        setAuth(res.token, {
          id: res.user!.id,
          phone: res.user!.phone,
          name: res.user!.name,
          email: null,
          profilePhoto: res.user!.profilePhoto,
          role: res.user!.role,
          isVerified: res.user!.isVerified,
        });
        connectChatSocket();
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      }
    } catch (err: unknown) {
      setShake(true);
      setDigits(['', '', '', '', '', '']);
      setError(err instanceof Error ? err.message : 'رمز غير صحيح، حاول مرة أخرى');
      setTimeout(() => { setShake(false); inputRefs.current[0]?.focus(); }, 600);
    } finally {
      setLoading(false);
    }
  }, [phone, router, searchParams, setAuth]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every(Boolean) && digit) submit(next.join(''));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setDigits(next);
      inputRefs.current[5]?.focus();
      submit(pasted);
    }
  }

  async function resend() {
    setError('');
    setCountdown(60);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    try { await sendOtp(phone); } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-[#F5A623]">أقورا</span>
          <h1 className="mt-4 text-xl font-bold text-[#222222]">أدخل رمز التحقق</h1>
          <p className="mt-1 text-sm text-[#717171]">
            تم إرسال رمز إلى{' '}
            <span className="font-medium text-[#222222]" dir="ltr">{phone}</span>
          </p>
        </div>

        <div
          className={`flex justify-center gap-2 mb-6 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          dir="ltr"
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="w-12 h-12 text-center text-lg font-bold border border-gray-200 rounded-lg outline-none focus:border-[#F5A623] transition-colors disabled:opacity-50"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        {loading && (
          <div className="flex justify-center mb-4">
            <span className="animate-spin rounded-full h-6 w-6 border-2 border-[#F5A623] border-t-transparent" />
          </div>
        )}

        <div className="text-center text-sm text-[#717171]">
          {countdown > 0 ? (
            <span>إعادة الإرسال بعد {countdown}s</span>
          ) : (
            <button onClick={resend} className="text-[#F5A623] font-medium hover:underline">
              إعادة إرسال الرمز
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

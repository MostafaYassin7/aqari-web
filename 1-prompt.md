[PASTE SESSION HEADER ABOVE FIRST]

Build the authentication flow.
Install packages first:
  npm install zustand react-otp-input

─── STEP 1: AUTH STORE ──────────────────────────────────────

Create src/store/auth.store.ts:

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  profilePhoto: string | null;
  role: string; // GUEST | USER | OWNER | BROKER | HOST | ADMIN
  isVerified: boolean;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: User) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      setAuth: (token, user) =>
        set({ token, user, isLoggedIn: true }),
      setToken: (token) =>
        set({ token, isLoggedIn: true }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({ token: null, user: null, isLoggedIn: false }),
    }),
    { name: 'aqar-auth' }
  )
);

─── STEP 2: UPDATE API CLIENT ───────────────────────────────

Update src/lib/api.ts completely:

const BASE_URL = 'https://api.aqora.sa/api/v1';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('aqar-auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Something went wrong');
  }

  // Unwrap { success, data, message } envelope
  return json.data as T;
}

// Keep existing functions but update to use apiRequest:
export async function searchListings(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return apiRequest<{ hits: any[]; total: number; page: number; pages: number }>(
    `/search?${query}`
  );
}

export async function getListing(id: string) {
  return apiRequest<any>(`/listings/${id}`);
}

─── STEP 3: AUTH API ────────────────────────────────────────

Create src/lib/auth.api.ts:

import { apiRequest } from './api';

export async function sendOtp(phone: string) {
  // Response: { message: string, code?: string }
  // code is present in dev mode — not in production
  return apiRequest<{ message: string; code?: string }>(
    '/auth/send-otp',
    { method: 'POST', body: JSON.stringify({ phone }) }
  );
}

export async function verifyOtp(phone: string, code: string) {
  // Response: { token, isNewUser, user? }
  // user is only present if isNewUser = false
  return apiRequest<{
    token: string;
    isNewUser: boolean;
    user?: {
      id: string;
      phone: string;
      name: string | null;
      role: string;
      profilePhoto: string | null;
      isVerified: boolean;
    };
  }>(
    '/auth/verify-otp',
    { method: 'POST', body: JSON.stringify({ phone, code }) }
  );
}

export async function completeProfile(data: {
  name: string;
  role: string; // USER | OWNER | BROKER | HOST (not GUEST/ADMIN)
  email?: string;
}) {
  return apiRequest<{
    token: string;
    user: {
      id: string;
      name: string;
      role: string;
      phone: string;
      profilePhoto: string | null;
      isVerified: boolean;
    };
  }>(
    '/auth/complete-profile',
    { method: 'POST', body: JSON.stringify(data) },
    true // requires auth header (token from verifyOtp)
  );
}

export async function getMe() {
  return apiRequest<{
    id: string;
    phone: string;
    name: string | null;
    role: string;
    profilePhoto: string | null;
    isVerified: boolean;
  }>('/auth/me', {}, true);
}

─── STEP 4: AUTH GUARD ──────────────────────────────────────

Create src/components/auth/AuthGuard.tsx:

'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoggedIn) {
      // Save intended destination and redirect to login
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoggedIn, pathname, router]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8
             border-2 border-[#F5A623] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

─── STEP 5: LOGIN PAGE ──────────────────────────────────────

Create src/app/[locale]/login/page.tsx:

Centered card layout:
  max-width: 420px
  White background, rounded-2xl, shadow-lg
  Padding: 32px

Top:
  Aqar logo (use text "عقار" in #F5A623 if no image)
  Title: "تسجيل الدخول" (ar) / "Sign In" (en)
  Subtitle: "أدخل رقم جوالك للمتابعة"

Form:
  Phone input:
    Label: "رقم الجوال"
    Direction: LTR always
    Prefix: "+966" (fixed, grey)
    Input: digits only, max 9 digits
    Full value sent to API: "+966" + input value

  Submit button:
    Full width, bg-[#F5A623], text-white
    rounded-xl, h-12
    Label: "إرسال رمز التحقق"
    Loading: spinner icon + "جاري الإرسال..."
    Disabled while loading

  Error: red text below button

On submit:
  Validate: input not empty, 9 digits
  Call sendOtp('+966' + inputValue)
  If success:
    Store phone in sessionStorage ('aqar_otp_phone')
    router.push('/otp')
  If error:
    Show error.message

─── STEP 6: OTP PAGE ────────────────────────────────────────

Create src/app/[locale]/otp/page.tsx:

Get phone from sessionStorage('aqar_otp_phone')
If no phone → redirect to /login

Centered card:
  Title: "أدخل رمز التحقق"
  Subtitle: "تم إرسال رمز إلى " + phone

OTP inputs:
  6 separate input boxes in a row
  Direction: LTR
  Each: w-12 h-12, border, rounded-lg, text-center
  Auto-advance on digit entry
  Backspace moves to previous
  Paste support: paste 6 digits fills all boxes
  On complete (all 6 filled): auto-submit

Resend:
  Countdown timer: "إعادة الإرسال بعد 60s"
  After 60s: "إعادة إرسال الرمز" clickable link
  On click: call sendOtp again, reset timer

On submit:
  Call verifyOtp(phone, code)

  If isNewUser = true:
    Store token temporarily: sessionStorage('aqar_temp_token', token)
    router.push('/register')

  If isNewUser = false:
    useAuthStore.getState().setAuth(token, user!)
    const redirect = searchParams.get('redirect') || '/'
    router.replace(redirect)

  If error:
    Shake animation on all boxes (CSS animation)
    Clear all inputs
    Show error: "رمز غير صحيح، حاول مرة أخرى"

─── STEP 7: REGISTER PAGE ───────────────────────────────────

Create src/app/[locale]/register/page.tsx:

Get temp token from sessionStorage('aqar_temp_token')
If no token → redirect to /login

Centered card:
  Title: "أكمل بيانات حسابك"

Form using react-hook-form:
  Name:
    Label: "الاسم الكامل *"
    Required, min 2 chars
    Text input

  Email:
    Label: "البريد الإلكتروني"
    Optional
    type email

  Role selector:
    Label: "أنا *"
    4 cards in 2x2 grid:
      مالك / وكيل  → 'OWNER'
      مسوق عقاري   → 'BROKER'
      مضيف          → 'HOST'
      مستخدم        → 'USER'
    Selected: border-[#F5A623] bg-orange-50
    Default: USER

  Submit button:
    "إنشاء الحساب" full width #F5A623

On submit:
  Set Authorization header temporarily
  with sessionStorage temp token
  Call completeProfile({ name, role, email })

  On success:
    Clear sessionStorage temp token
    useAuthStore.getState().setAuth(token, user)
    router.replace('/')

─── STEP 8: UPDATE NAVBAR ───────────────────────────────────

Update existing Navbar component:

Import useAuthStore.

If !isLoggedIn:
  Show: "تسجيل الدخول" button → /login
  Keep existing "تحميل التطبيق" button

If isLoggedIn:
  Replace "تسجيل الدخول" with user avatar:
    If profilePhoto: circular image 36px
    Else: circle with first letter of name, bg-[#F5A623]

  Dropdown menu on avatar click:
    إعلاناتي    → /dashboard/my-ads
    المفضلة     → /dashboard/favorites
    المحفظة     → /dashboard/wallet
    المحادثات   → /dashboard/chat
    ─────────────
    تسجيل الخروج → calls logout() then router.push('/')

─── TEST ────────────────────────────────────────────────────

1. /login → enter 501234567 → submit
   Expected: navigates to /otp ✅
   Check sessionStorage: aqar_otp_phone = +966501234567 ✅

2. /otp → enter code from backend logs
   New user → /register ✅
   Existing user → / ✅

3. /register → fill name → select role → submit
   Expected: account created ✅
   Navbar shows avatar ✅

4. Click avatar → dropdown opens ✅

5. Logout → token cleared ✅
   Navbar shows "تسجيل الدخول" ✅

6. Try /dashboard/my-ads without login
   Expected: redirects to /login?redirect=/dashboard/my-ads ✅
   After login → redirects back to /dashboard/my-ads ✅
'use client';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { completeProfile } from '@/lib/auth.api';
import { useAuthStore } from '@/store/auth.store';

const ROLES = [
  { value: 'OWNER', label: 'مالك / وكيل', icon: '🏠' },
  { value: 'BROKER', label: 'مسوق عقاري', icon: '🤝' },
  { value: 'HOST', label: 'مضيف', icon: '🛎️' },
  { value: 'USER', label: 'مستخدم', icon: '👤' },
] as const;

type FormValues = {
  name: string;
  email: string;
  role: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { name: '', email: '', role: 'USER' },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    const token = sessionStorage.getItem('aqar_temp_token');
    if (!token) router.replace('/login');
  }, [router]);

  async function onSubmit(values: FormValues) {
    const tempToken = sessionStorage.getItem('aqar_temp_token');
    if (!tempToken) { router.replace('/login'); return; }

    // Temporarily set the token in localStorage so apiRequest picks it up
    const existing = localStorage.getItem('aqar-auth');
    const tempStore = JSON.stringify({ state: { token: tempToken, user: null, isLoggedIn: false } });
    localStorage.setItem('aqar-auth', tempStore);

    try {
      const res = await completeProfile({
        name: values.name,
        role: values.role,
        email: values.email || undefined,
      });
      sessionStorage.removeItem('aqar_temp_token');
      setAuth(res.token, {
        id: res.user.id,
        phone: res.user.phone,
        name: res.user.name,
        email: values.email || null,
        profilePhoto: res.user.profilePhoto,
        role: res.user.role,
        isVerified: res.user.isVerified,
      });
      router.replace('/');
    } catch {
      // Restore original store state if request fails
      if (existing) localStorage.setItem('aqar-auth', existing);
      else localStorage.removeItem('aqar-auth');
      throw new Error('حدث خطأ، حاول مرة أخرى');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-[#F5A623]">أقورا</span>
          <h1 className="mt-4 text-xl font-bold text-[#222222]">أكمل بيانات حسابك</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1.5">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', {
                required: 'الاسم مطلوب',
                minLength: { value: 2, message: 'الاسم قصير جداً' },
              })}
              type="text"
              placeholder="أدخل اسمك الكامل"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F5A623] transition-colors"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="اختياري"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F5A623] transition-colors"
              dir="ltr"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              أنا <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setValue('role', r.value)}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedRole === r.value
                      ? 'border-[#F5A623] bg-orange-50 text-[#F5A623]'
                      : 'border-gray-200 text-[#717171] hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الإنشاء...
              </>
            ) : (
              'إنشاء الحساب'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

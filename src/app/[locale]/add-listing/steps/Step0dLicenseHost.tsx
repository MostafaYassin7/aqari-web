'use client';
import { useState } from 'react';
import { useAddListingStore } from '@/store/add-listing.store';
import { validateHostLicense } from '@/lib/api';

export default function Step0dLicenseHost() {
  const store = useAddListingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inp = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] transition-colors bg-white';

  const handleNext = async () => {
    if (!store.hostTourismLicenseNumber) {
      setError('يرجى إدخال رقم رخصة وزارة السياحة');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await validateHostLicense(store.hostTourismLicenseNumber);
      if (res.isValid && res.licenseId) {
        store.setLicenseId(res.licenseId);
        store.nextStep();
      } else {
        setError('رقم الرخصة غير صحيح أو منتهي الصلاحية');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-5 pb-32">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          لإضافة إعلان إيجار يومي يجب أن يكون لديك ترخيص من وزارة السياحة
        </p>
      </div>

      {/* Tourism license */}
      <div>
        <label className="block text-sm font-medium text-[#222222] mb-1.5">
          رقم رخصة وزارة السياحة <span className="text-red-500">*</span>
        </label>
        <input
          value={store.hostTourismLicenseNumber ?? ''}
          onChange={(e) => store.setField('hostTourismLicenseNumber', e.target.value)}
          className={inp}
          dir="ltr"
          placeholder="أدخل رقم الرخصة"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 start-0 end-0 z-20 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => store.prevStep()}
            className="flex-1 h-12 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50"
          >
            رجوع
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 h-12 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}

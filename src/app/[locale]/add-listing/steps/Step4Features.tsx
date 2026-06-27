'use client';
import { useAddListingStore } from '@/store/add-listing.store';

const FEATURES: { key: string; label: string }[] = [
  { key: 'hasWater', label: 'مياه' },
  { key: 'hasElectricity', label: 'كهرباء' },
  { key: 'hasSewage', label: 'صرف صحي' },
  { key: 'hasPrivateRoof', label: 'سطح خاص' },
  { key: 'isInVilla', label: 'داخل فيلا' },
  { key: 'hasTwoEntrances', label: 'مدخلان' },
  { key: 'hasSpecialEntrance', label: 'مدخل خاص' },
];

export default function Step4Features() {
  const store = useAddListingStore();

  const toggle = (key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.setField(key, !(store as any)[key]);
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <h2 className="text-base font-bold text-[#222222]">المرافق والمميزات</h2>
      <p className="text-xs text-[#717171]">اختر المرافق المتوفرة في العقار</p>

      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map(({ key, label }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const checked = !!(store as any)[key];
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                checked
                  ? 'border-[#F5A623] bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                checked ? 'bg-[#F5A623] border-[#F5A623]' : 'border-gray-300 bg-white'
              }`}>
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium ${checked ? 'text-[#F5A623]' : 'text-[#444444]'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[#717171] text-center">يمكنك المتابعة بدون اختيار أي مرفق</p>
    </div>
  );
}

'use client';
import { useAddListingStore } from '@/store/add-listing.store';

const FACADE_OPTIONS = [
  { value: 'north', label: 'شمال' },
  { value: 'south', label: 'جنوب' },
  { value: 'east', label: 'شرق' },
  { value: 'west', label: 'غرب' },
  { value: 'northeast', label: 'شمال شرق' },
  { value: 'northwest', label: 'شمال غرب' },
  { value: 'southeast', label: 'جنوب شرق' },
  { value: 'southwest', label: 'جنوب غرب' },
];

const CHECKBOXES: { key: string; label: string }[] = [
  { key: 'isFurnished', label: 'مفروش' },
  { key: 'hasKitchen', label: 'مطبخ' },
  { key: 'hasExtraUnit', label: 'وحدة إضافية' },
  { key: 'hasCarEntrance', label: 'مدخل سيارة' },
  { key: 'hasElevator', label: 'مصعد' },
];

const NUMBER_FIELDS: { key: string; label: string; unit?: string }[] = [
  { key: 'bedrooms', label: 'غرف النوم' },
  { key: 'livingRooms', label: 'غرف المعيشة' },
  { key: 'bathrooms', label: 'دورات المياه' },
  { key: 'floorNumber', label: 'الطابق' },
  { key: 'propertyAge', label: 'عمر العقار', unit: 'سنة' },
  { key: 'streetWidth', label: 'عرض الشارع', unit: 'م' },
];

export default function Step5Details() {
  const store = useAddListingStore();

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] bg-white transition-colors';

  return (
    <div className="px-4 py-6 space-y-5">
      <h2 className="text-base font-bold text-[#222222]">تفاصيل العقار</h2>

      {/* Number inputs grid */}
      <div className="grid grid-cols-2 gap-3">
        {NUMBER_FIELDS.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[#717171] mb-1">
              {label}{unit ? ` (${unit})` : ''}
            </label>
            <input
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              value={(store as any)[key] ?? ''}
              onChange={(e) =>
                store.setField(key, e.target.value ? parseFloat(e.target.value) : null)
              }
              className={inp}
              dir="ltr"
              type="number"
              min={0}
              placeholder="0"
            />
          </div>
        ))}
      </div>

      {/* Facade */}
      <div>
        <label className="block text-sm font-medium text-[#222222] mb-1.5">الواجهة</label>
        <select
          value={store.facade ?? ''}
          onChange={(e) => store.setField('facade', e.target.value || null)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] bg-white transition-colors appearance-none"
        >
          <option value="">اختر الواجهة (اختياري)</option>
          {FACADE_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Checkboxes */}
      <div>
        <p className="text-sm font-medium text-[#222222] mb-2">مميزات إضافية</p>
        <div className="grid grid-cols-2 gap-2">
          {CHECKBOXES.map(({ key, label }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const checked = !!(store as any)[key];
            return (
              <button
                key={key}
                onClick={() => store.setField(key, !checked)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  checked
                    ? 'border-[#F5A623] bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  checked ? 'bg-[#F5A623] border-[#F5A623]' : 'border-gray-300'
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
      </div>
    </div>
  );
}

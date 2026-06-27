'use client';
import { useState } from 'react';
import { useAddListingStore } from '@/store/add-listing.store';

export default function Step3Info() {
  const store = useAddListingStore();
  const [priceDisplay, setPriceDisplay] = useState(
    store.totalPrice ? store.totalPrice.toLocaleString('ar-SA') : ''
  );

  const inp = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] transition-colors bg-white';
  const lbl = 'block text-sm font-medium text-[#222222] mb-1.5';

  const handlePriceBlur = (raw: string) => {
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      store.setField('totalPrice', num);
      setPriceDisplay(num.toLocaleString('ar-SA'));
    }
  };

  return (
    <div className="px-4 py-6 space-y-5">
      <h2 className="text-base font-bold text-[#222222]">معلومات الإعلان</h2>

      {/* Title */}
      <div>
        <label className={lbl}>عنوان الإعلان <span className="text-red-500">*</span></label>
        <input
          value={store.title}
          onChange={(e) => store.setField('title', e.target.value)}
          className={inp}
          placeholder="مثال: شقة للبيع في حي النزهة"
          maxLength={100}
        />
        <p className="text-xs text-[#717171] text-left mt-1">{store.title.length}/100</p>
      </div>

      {/* Price */}
      <div>
        <label className={lbl}>السعر الكلي (ريال) <span className="text-red-500">*</span></label>
        <input
          value={priceDisplay}
          onChange={(e) => setPriceDisplay(e.target.value)}
          onBlur={(e) => handlePriceBlur(e.target.value)}
          className={inp}
          placeholder="0"
          dir="ltr"
          inputMode="numeric"
        />
      </div>

      {/* Area */}
      <div>
        <label className={lbl}>المساحة (م²) <span className="text-red-500">*</span></label>
        <input
          value={store.area ?? ''}
          onChange={(e) => store.setField('area', e.target.value ? parseFloat(e.target.value) : null)}
          className={inp}
          placeholder="0"
          dir="ltr"
          inputMode="decimal"
          type="number"
          min={0}
        />
      </div>

      {/* Usage type */}
      <div>
        <p className={lbl}>نوع الاستخدام</p>
        <div className="flex gap-3">
          {[
            { value: true, label: 'سكني' },
            { value: false, label: 'تجاري' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => store.setField('isResidential', opt.value)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                store.isResidential === opt.value
                  ? 'border-[#F5A623] bg-orange-50 text-[#F5A623]'
                  : 'border-gray-200 bg-white text-[#717171]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Commission toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#222222]">عمولة البيع/الإيجار</span>
          <button
            onClick={() => store.setField('hasCommission', !store.hasCommission)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              store.hasCommission ? 'bg-[#F5A623]' : 'bg-gray-200'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              store.hasCommission ? 'start-5' : 'start-0.5'
            }`} />
          </button>
        </div>
        {store.hasCommission && (
          <div className="mt-3">
            <label className="block text-xs text-[#717171] mb-1.5">نسبة العمولة (%)</label>
            <input
              value={store.commissionPercent ?? ''}
              onChange={(e) => store.setField('commissionPercent', e.target.value ? parseFloat(e.target.value) : null)}
              className={inp}
              placeholder="0-100"
              dir="ltr"
              type="number"
              min={0}
              max={100}
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className={lbl}>وصف العقار</label>
        <textarea
          value={store.description ?? ''}
          onChange={(e) => store.setField('description', e.target.value || null)}
          className={`${inp} resize-none`}
          rows={4}
          placeholder="أضف وصفاً تفصيلياً للعقار..."
          maxLength={2000}
        />
        <p className="text-xs text-[#717171] text-left mt-1">{(store.description ?? '').length}/2000</p>
      </div>
    </div>
  );
}

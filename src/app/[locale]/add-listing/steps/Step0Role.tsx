'use client';
import { useAddListingStore } from '@/store/add-listing.store';
import { useState } from 'react';
import { KeyRound, Briefcase, BedDouble, PlusCircle, Megaphone } from 'lucide-react';

const ROLES = [
  {
    value: 'owner' as const,
    label: 'مالك / وكيل',
    desc: 'تملك العقار أو تمثل المالك',
    icon: <KeyRound size={22} strokeWidth={1.5} />,
  },
  {
    value: 'broker' as const,
    label: 'مسوق عقاري',
    desc: 'مرخص من الهيئة العامة للعقار',
    icon: <Briefcase size={22} strokeWidth={1.5} />,
  },
  {
    value: 'host' as const,
    label: 'مضيف',
    desc: 'إيجار يومي بترخيص سياحي',
    icon: <BedDouble size={22} strokeWidth={1.5} />,
  },
];

export default function Step0Role() {
  const store = useAddListingStore();
  const [toast, setToast] = useState(false);

  const handleRoleSelect = (val: typeof ROLES[number]['value']) => {
    store.setField('advertiserType', val);
    if (val !== store.advertiserType) {
      store.setField('currentStep', 0);
    }
  };

  const handleServiceSelect = (val: 'listing' | 'marketing') => {
    if (val === 'marketing') {
      setToast(true);
      setTimeout(() => setToast(false), 3000);
      return;
    }
    store.setField('selectedService', val);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Role selection */}
      <div>
        <h2 className="text-lg font-bold text-[#222222] mb-3">ما هو دورك؟</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {ROLES.map((role) => {
            const selected = store.advertiserType === role.value;
            return (
              <button
                key={role.value}
                onClick={() => handleRoleSelect(role.value)}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                  selected
                    ? 'border-[#F5A623] bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={selected ? 'text-[#F5A623]' : 'text-[#717171]'}>
                  {role.icon}
                </span>
                <span className={`text-xs font-semibold leading-tight ${selected ? 'text-[#F5A623]' : 'text-[#222222]'}`}>
                  {role.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service selection */}
      <div>
        <h2 className="text-lg font-bold text-[#222222] mb-3">ماذا تريد أن تفعل؟</h2>
        <div className="space-y-3">
          <button
            onClick={() => handleServiceSelect('listing')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
              store.selectedService === 'listing'
                ? 'border-[#F5A623] bg-orange-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              store.selectedService === 'listing' ? 'bg-[#F5A623]/10' : 'bg-gray-100'
            }`}>
              <PlusCircle
                size={20}
                strokeWidth={1.5}
                className={store.selectedService === 'listing' ? 'text-[#F5A623]' : 'text-[#717171]'}
              />
            </div>
            <div className="flex-1 text-right">
              <p className={`font-bold text-sm ${store.selectedService === 'listing' ? 'text-[#F5A623]' : 'text-[#222222]'}`}>
                إضافة إعلان عقاري
              </p>
              <p className="text-xs text-[#717171] mt-0.5">اعرض عقارك للبيع أو الإيجار</p>
            </div>
          </button>

          <button
            onClick={() => handleServiceSelect('marketing')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 transition-all text-right opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Megaphone size={20} strokeWidth={1.5} className="text-[#717171]" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-sm text-[#222222]">طلب تسويق عقار</p>
              <p className="text-xs text-[#717171] mt-0.5">اطلب من وسطاء تسويق عقارك</p>
            </div>
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 start-4 end-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[#222222] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
            هذه الخدمة قادمة قريباً
          </div>
        </div>
      )}
    </div>
  );
}

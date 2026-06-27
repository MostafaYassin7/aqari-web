'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { submitLicense, apiRequest } from '@/lib/api';
import { CheckCircle } from 'lucide-react';

type AdvertiserType = 'owner' | 'agent';
type IdType = 'national_id' | 'commercial_reg' | 'unified_number';

interface FormValues {
  advertiserType: AdvertiserType;
  ownershipDocumentType: string;
  ownershipDocumentNumber: string;
  propertyOwnerIdType: IdType;
  ownerNationalIdNumber: string;
  ownerCommercialRegNumber: string;
  ownerUnifiedNumber: string;
  propertyOwnerBirthDate: string;
  isHijriCalendar: boolean;
  propertyOwnerPhone: string;
  oneOfOwnersNationalId: string;
  // agent fields
  powerOfAttorneyNumber: string;
  agentNationalIdNumber: string;
  agentBirthDate: string;
  agentPhone: string;
}

const DOC_TYPES = [
  { value: 'title_deed', label: 'صك الملكية' },
  { value: 'allocation', label: 'وثيقة التخصيص' },
  { value: 'court_ruling', label: 'حكم قضائي' },
  { value: 'other', label: 'أخرى' },
];

export default function CompleteLicensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId') ?? '';
  const [success, setSuccess] = useState(false);
  const [listingError, setListingError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      advertiserType: 'owner',
      propertyOwnerIdType: 'national_id',
      isHijriCalendar: false,
    },
  });

  const advertiserType = watch('advertiserType');
  const idType = watch('propertyOwnerIdType');

  useEffect(() => {
    if (!listingId) { router.replace('/account/my-ads'); return; }
    // Verify listing exists
    apiRequest(`/listings/${listingId}`, {}, true).catch(() => {
      setListingError('الإعلان غير موجود أو لا تملك صلاحية الوصول إليه.');
    });
  }, [listingId, router]);

  async function onSubmit(values: FormValues) {
    const payload: Record<string, unknown> = {
      advertiserType: values.advertiserType,
      listingId,
      ownershipDocumentType: values.ownershipDocumentType,
      ownershipDocumentNumber: values.ownershipDocumentNumber,
      propertyOwnerIdType: values.propertyOwnerIdType,
      propertyOwnerBirthDate: values.propertyOwnerBirthDate,
      isHijriCalendar: values.isHijriCalendar,
      propertyOwnerPhone: values.propertyOwnerPhone,
      oneOfOwnersNationalId: values.oneOfOwnersNationalId || undefined,
    };

    if (idType === 'national_id') payload.ownerNationalIdNumber = values.ownerNationalIdNumber;
    if (idType === 'commercial_reg') payload.ownerCommercialRegNumber = values.ownerCommercialRegNumber;
    if (idType === 'unified_number') payload.ownerUnifiedNumber = values.ownerUnifiedNumber;

    if (values.advertiserType === 'agent') {
      payload.powerOfAttorneyNumber = values.powerOfAttorneyNumber;
      payload.agentNationalIdNumber = values.agentNationalIdNumber;
      payload.agentBirthDate = values.agentBirthDate;
      payload.agentPhone = values.agentPhone;
    }

    await submitLicense(payload);
    setSuccess(true);
  }

  if (listingError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 mb-4">{listingError}</p>
        <button onClick={() => router.replace('/account/my-ads')} className="text-[#F5A623] font-semibold">
          العودة لإعلاناتي
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-[#222222] mb-2">تم إرسال بيانات الترخيص</h2>
        <p className="text-[#717171] text-sm mb-6">
          تم إرسال بيانات الترخيص للمراجعة. سيتم نشر إعلانك فور الموافقة.
        </p>
        <button
          onClick={() => router.push('/account/my-ads')}
          className="bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          العودة لإعلاناتي
        </button>
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623] transition-colors bg-white';
  const labelCls = 'block text-sm font-medium text-[#222222] mb-1.5';
  const errorCls = 'text-red-500 text-xs mt-1';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-[#222222] mb-2">إكمال بيانات الترخيص</h1>
      <p className="text-sm text-[#717171] mb-8">أدخل بيانات الترخيص لنشر إعلانك</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Advertiser type */}
        <div>
          <label className={labelCls}>نوع المعلن</label>
          <div className="flex gap-3">
            {(['owner', 'agent'] as AdvertiserType[]).map((t) => (
              <label key={t} className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-3 cursor-pointer transition-all text-sm font-medium ${
                advertiserType === t ? 'border-[#F5A623] bg-orange-50 text-[#F5A623]' : 'border-gray-200 text-[#717171]'
              }`}>
                <input type="radio" value={t} {...register('advertiserType')} className="hidden" />
                {t === 'owner' ? 'مالك' : 'وكيل'}
              </label>
            ))}
          </div>
        </div>

        {/* Ownership doc */}
        <div>
          <label className={labelCls}>نوع وثيقة الملكية <span className="text-red-500">*</span></label>
          <select {...register('ownershipDocumentType', { required: 'مطلوب' })} className={inputCls}>
            <option value="">اختر نوع الوثيقة</option>
            {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          {errors.ownershipDocumentType && <p className={errorCls}>{errors.ownershipDocumentType.message}</p>}
        </div>

        <div>
          <label className={labelCls}>رقم وثيقة الملكية <span className="text-red-500">*</span></label>
          <input {...register('ownershipDocumentNumber', { required: 'مطلوب' })} className={inputCls} placeholder="أدخل رقم الوثيقة" />
          {errors.ownershipDocumentNumber && <p className={errorCls}>{errors.ownershipDocumentNumber.message}</p>}
        </div>

        {/* Owner ID type */}
        <div>
          <label className={labelCls}>نوع هوية المالك <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            {([
              { value: 'national_id', label: 'هوية وطنية' },
              { value: 'commercial_reg', label: 'سجل تجاري' },
              { value: 'unified_number', label: 'رقم موحد' },
            ] as { value: IdType; label: string }[]).map((t) => (
              <label key={t.value} className={`flex-1 flex items-center justify-center border rounded-xl py-2.5 cursor-pointer transition-all text-xs font-medium text-center ${
                idType === t.value ? 'border-[#F5A623] bg-orange-50 text-[#F5A623]' : 'border-gray-200 text-[#717171]'
              }`}>
                <input type="radio" value={t.value} {...register('propertyOwnerIdType')} className="hidden" />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* Conditional ID field */}
        {idType === 'national_id' && (
          <div>
            <label className={labelCls}>رقم الهوية الوطنية <span className="text-red-500">*</span></label>
            <input {...register('ownerNationalIdNumber', { required: 'مطلوب' })} className={inputCls} placeholder="10 أرقام" dir="ltr" />
            {errors.ownerNationalIdNumber && <p className={errorCls}>{errors.ownerNationalIdNumber.message}</p>}
          </div>
        )}
        {idType === 'commercial_reg' && (
          <div>
            <label className={labelCls}>رقم السجل التجاري <span className="text-red-500">*</span></label>
            <input {...register('ownerCommercialRegNumber', { required: 'مطلوب' })} className={inputCls} placeholder="رقم السجل" dir="ltr" />
            {errors.ownerCommercialRegNumber && <p className={errorCls}>{errors.ownerCommercialRegNumber.message}</p>}
          </div>
        )}
        {idType === 'unified_number' && (
          <div>
            <label className={labelCls}>الرقم الموحد <span className="text-red-500">*</span></label>
            <input {...register('ownerUnifiedNumber', { required: 'مطلوب' })} className={inputCls} placeholder="الرقم الموحد" dir="ltr" />
            {errors.ownerUnifiedNumber && <p className={errorCls}>{errors.ownerUnifiedNumber.message}</p>}
          </div>
        )}

        {/* Birthdate + calendar type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>تاريخ الميلاد <span className="text-red-500">*</span></label>
            <input
              type="date" dir="ltr"
              {...register('propertyOwnerBirthDate', { required: 'مطلوب' })}
              className={inputCls}
            />
            {errors.propertyOwnerBirthDate && <p className={errorCls}>{errors.propertyOwnerBirthDate.message}</p>}
          </div>
          <div className="flex flex-col justify-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isHijriCalendar')} className="accent-[#F5A623] w-4 h-4" />
              <span className="text-sm text-[#717171]">تاريخ هجري</span>
            </label>
          </div>
        </div>

        <div>
          <label className={labelCls}>رقم جوال المالك <span className="text-red-500">*</span></label>
          <input {...register('propertyOwnerPhone', { required: 'مطلوب' })} className={inputCls} placeholder="+966XXXXXXXXX" dir="ltr" />
          {errors.propertyOwnerPhone && <p className={errorCls}>{errors.propertyOwnerPhone.message}</p>}
        </div>

        <div>
          <label className={labelCls}>رقم هوية أحد الملاك (إن وجد)</label>
          <input {...register('oneOfOwnersNationalId')} className={inputCls} placeholder="اختياري" dir="ltr" />
        </div>

        {/* Agent fields */}
        {advertiserType === 'agent' && (
          <div className="border border-orange-200 bg-orange-50 rounded-2xl p-4 space-y-4">
            <p className="text-sm font-semibold text-[#F5A623]">بيانات الوكيل</p>

            <div>
              <label className={labelCls}>رقم وكالة التفويض <span className="text-red-500">*</span></label>
              <input {...register('powerOfAttorneyNumber', { required: advertiserType === 'agent' ? 'مطلوب' : false })} className={inputCls} dir="ltr" />
              {errors.powerOfAttorneyNumber && <p className={errorCls}>{errors.powerOfAttorneyNumber.message}</p>}
            </div>
            <div>
              <label className={labelCls}>رقم هوية الوكيل <span className="text-red-500">*</span></label>
              <input {...register('agentNationalIdNumber', { required: advertiserType === 'agent' ? 'مطلوب' : false })} className={inputCls} dir="ltr" />
              {errors.agentNationalIdNumber && <p className={errorCls}>{errors.agentNationalIdNumber.message}</p>}
            </div>
            <div>
              <label className={labelCls}>تاريخ ميلاد الوكيل <span className="text-red-500">*</span></label>
              <input type="date" dir="ltr" {...register('agentBirthDate', { required: advertiserType === 'agent' ? 'مطلوب' : false })} className={inputCls} />
              {errors.agentBirthDate && <p className={errorCls}>{errors.agentBirthDate.message}</p>}
            </div>
            <div>
              <label className={labelCls}>رقم جوال الوكيل <span className="text-red-500">*</span></label>
              <input {...register('agentPhone', { required: advertiserType === 'agent' ? 'مطلوب' : false })} className={inputCls} placeholder="+966XXXXXXXXX" dir="ltr" />
              {errors.agentPhone && <p className={errorCls}>{errors.agentPhone.message}</p>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> جاري الإرسال...</>
          ) : (
            'إرسال بيانات الترخيص'
          )}
        </button>
      </form>
    </div>
  );
}

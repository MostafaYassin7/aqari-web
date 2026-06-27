'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAddListingStore, getStepList } from '@/store/add-listing.store';
import { useRouter } from '@/i18n/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Step0Role from './steps/Step0Role';
import Step0aOwnerInfo from './steps/Step0aOwnerInfo';
import Step0bLicenseOwner from './steps/Step0bLicenseOwner';
import Step0cLicenseBroker from './steps/Step0cLicenseBroker';
import Step0dLicenseHost from './steps/Step0dLicenseHost';
import Step1Category from './steps/Step1Category';
import Step2Media from './steps/Step2Media';
import Step3Info from './steps/Step3Info';
import Step4Features from './steps/Step4Features';
import Step5Details from './steps/Step5Details';
import Step6Location from './steps/Step6Location';
import Step7Review from './steps/Step7Review';

// Steps that manage their own next button (no shell bottom bar next)
const SELF_MANAGED_STEPS = ['0b', '0c', '0d', 7];

function AddListingInner() {
  const store = useAddListingStore();
  const router = useRouter();

  const steps = getStepList(store.advertiserType);
  const currentStepLabel = steps[store.currentStep];
  const progress = steps.length > 1 ? (store.currentStep / (steps.length - 1)) * 100 : 0;
  const showShellNext = !SELF_MANAGED_STEPS.includes(currentStepLabel as string | number);
  const isLastShellStep = currentStepLabel === 6;

  const handleBack = () => {
    if (store.currentStep === 0) {
      router.push('/account/my-ads');
    } else {
      store.prevStep();
    }
  };

  const handleNext = () => {
    if (currentStepLabel === 0 && store.selectedService !== 'listing') return;
    if (currentStepLabel === 1 && !store.categoryId) return;
    if (currentStepLabel === 3 && (!store.title || !store.totalPrice || !store.area)) return;
    if (currentStepLabel === 6 && !store.city) return;
    store.nextStep();
  };

  const renderStep = () => {
    switch (currentStepLabel) {
      case 0: return <Step0Role />;
      case '0a': return <Step0aOwnerInfo />;
      case '0b': return <Step0bLicenseOwner />;
      case '0c': return <Step0cLicenseBroker />;
      case '0d': return <Step0dLicenseHost />;
      case 1: return <Step1Category />;
      case 2: return <Step2Media />;
      case 3: return <Step3Info />;
      case 4: return <Step4Features />;
      case 5: return <Step5Details />;
      case 6: return <Step6Location />;
      case 7: return <Step7Review />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F9]" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="flex items-center px-4 h-14 max-w-2xl mx-auto w-full">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="رجوع"
          >
            <ChevronRight size={22} className="text-[#222222]" />
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-[#222222]">إضافة إعلان</h1>
          {currentStepLabel === 0 ? (
            <button
              onClick={handleNext}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="التالي"
            >
              <ChevronLeft size={22} className="text-[#222222]" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[#F5A623] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 py-2.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < store.currentStep
                  ? 'w-2 h-2 bg-[#F5A623]'
                  : i === store.currentStep
                  ? 'w-3 h-2 bg-[#F5A623]'
                  : 'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-2xl mx-auto w-full">
          {renderStep()}
        </div>
      </div>

      {/* Bottom bar */}
      {showShellNext && (
        <div className="fixed bottom-0 start-0 end-0 z-20 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
          <div className="flex gap-3 max-w-2xl mx-auto">
            {store.currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 h-12 border border-gray-200 rounded-xl text-sm font-medium text-[#717171] hover:bg-gray-50 transition-colors"
              >
                رجوع
              </button>
            )}
            <button
              onClick={handleNext}
              className={`h-12 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold rounded-xl text-sm transition-colors ${
                store.currentStep > 0 ? 'flex-1' : 'w-full'
              }`}
            >
              {isLastShellStep ? 'مراجعة الإعلان' : 'التالي'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddListingPage() {
  return (
    <AuthGuard>
      <AddListingInner />
    </AuthGuard>
  );
}

import { create } from 'zustand';

type AdvertiserType = 'owner' | 'agent' | 'broker' | 'host';

export function getStepList(advertiserType: AdvertiserType): (number | string)[] {
  if (advertiserType === 'broker') return [0, '0c', 1, 2, 3, 4, 5, 6, 7];
  if (advertiserType === 'host') return [0, '0d', 1, 2, 3, 4, 5, 6, 7];
  return [0, '0a', '0b', 1, 2, 3, 4, 5, 6, 7];
}

interface AddListingStore {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  submitError: string | null;

  advertiserType: AdvertiserType;
  selectedService: 'listing' | 'marketing';

  // Owner/agent license
  ownershipDocumentType: string;
  ownershipDocumentNumber: string | null;
  propertyOwnerIdType: string;
  ownerNationalIdNumber: string | null;
  ownerCommercialRegNumber: string | null;
  ownerUnifiedNumber: string | null;
  propertyOwnerBirthDate: string | null;
  isHijriCalendar: boolean;
  propertyOwnerPhone: string | null;
  oneOfOwnersNationalId: string | null;
  powerOfAttorneyNumber: string | null;
  agentNationalIdNumber: string | null;
  agentBirthDate: string | null;
  agentPhone: string | null;
  skipLicenseInfo: boolean;
  licenseId: string | null;

  // Broker license
  brokerAdLicenseNumber: string | null;
  brokerOwnerIdType: string;
  brokerOwnerIdNumber: string | null;

  // Host license
  hostTourismLicenseNumber: string | null;

  // Step 1
  categoryId: string | null;
  categoryNameAr: string | null;
  propertyType: string | null;
  listingType: string | null;

  // Step 2
  uploadedUrls: string[];
  coverPhoto: string | null;
  isUploading: boolean;

  // Step 3
  title: string;
  description: string | null;
  isResidential: boolean;
  hasCommission: boolean;
  commissionPercent: number | null;
  totalPrice: number | null;
  area: number | null;

  // Step 4
  hasWater: boolean;
  hasElectricity: boolean;
  hasSewage: boolean;
  hasPrivateRoof: boolean;
  isInVilla: boolean;
  hasTwoEntrances: boolean;
  hasSpecialEntrance: boolean;

  // Step 5
  bedrooms: number | null;
  livingRooms: number | null;
  bathrooms: number | null;
  facade: string | null;
  streetWidth: number | null;
  floorNumber: number | null;
  propertyAge: number | null;
  isFurnished: boolean;
  hasKitchen: boolean;
  hasExtraUnit: boolean;
  hasCarEntrance: boolean;
  hasElevator: boolean;

  // Step 6
  address: string | null;
  lat: number | null;
  lng: number | null;
  city: string;
  district: string | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setField: (field: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  setLicenseId: (id: string) => void;
  setSubmitting: (v: boolean) => void;
  setSubmitError: (msg: string | null) => void;
  addUploadedUrl: (url: string) => void;
  removeUploadedUrl: (url: string) => void;
}

const initialState: Omit<AddListingStore, 'setField' | 'nextStep' | 'prevStep' | 'reset' | 'setLicenseId' | 'setSubmitting' | 'setSubmitError' | 'addUploadedUrl' | 'removeUploadedUrl'> = {
  currentStep: 0,
  totalSteps: 10,
  isSubmitting: false,
  submitError: null,
  advertiserType: 'owner',
  selectedService: 'listing',
  ownershipDocumentType: 'electronic_deed',
  ownershipDocumentNumber: null,
  propertyOwnerIdType: 'national_id',
  ownerNationalIdNumber: null,
  ownerCommercialRegNumber: null,
  ownerUnifiedNumber: null,
  propertyOwnerBirthDate: null,
  isHijriCalendar: false,
  propertyOwnerPhone: null,
  oneOfOwnersNationalId: null,
  powerOfAttorneyNumber: null,
  agentNationalIdNumber: null,
  agentBirthDate: null,
  agentPhone: null,
  skipLicenseInfo: false,
  licenseId: null,
  brokerAdLicenseNumber: null,
  brokerOwnerIdType: 'national_id',
  brokerOwnerIdNumber: null,
  hostTourismLicenseNumber: null,
  categoryId: null,
  categoryNameAr: null,
  propertyType: null,
  listingType: null,
  uploadedUrls: [],
  coverPhoto: null,
  isUploading: false,
  title: '',
  description: null,
  isResidential: true,
  hasCommission: false,
  commissionPercent: null,
  totalPrice: null,
  area: null,
  hasWater: false,
  hasElectricity: false,
  hasSewage: false,
  hasPrivateRoof: false,
  isInVilla: false,
  hasTwoEntrances: false,
  hasSpecialEntrance: false,
  bedrooms: null,
  livingRooms: null,
  bathrooms: null,
  facade: null,
  streetWidth: null,
  floorNumber: null,
  propertyAge: null,
  isFurnished: false,
  hasKitchen: false,
  hasExtraUnit: false,
  hasCarEntrance: false,
  hasElevator: false,
  address: null,
  lat: null,
  lng: null,
  city: '',
  district: null,
};

export const useAddListingStore = create<AddListingStore>((set, get) => ({
  ...initialState,
  setField: (field, value) => set({ [field]: value }),
  nextStep: () => {
    const { currentStep, advertiserType } = get();
    const steps = getStepList(advertiserType);
    set({ currentStep: Math.min(currentStep + 1, steps.length - 1) });
  },
  prevStep: () => {
    const { currentStep } = get();
    set({ currentStep: Math.max(0, currentStep - 1) });
  },
  reset: () => set(initialState),
  setLicenseId: (id) => set({ licenseId: id }),
  setSubmitting: (v) => set({ isSubmitting: v }),
  setSubmitError: (msg) => set({ submitError: msg }),
  addUploadedUrl: (url) =>
    set((state) => ({
      uploadedUrls: [...state.uploadedUrls, url],
      coverPhoto: state.coverPhoto ?? url,
    })),
  removeUploadedUrl: (url) =>
    set((state) => {
      const newUrls = state.uploadedUrls.filter((u) => u !== url);
      return {
        uploadedUrls: newUrls,
        coverPhoto: state.coverPhoto === url ? (newUrls[0] ?? null) : state.coverPhoto,
      };
    }),
}));

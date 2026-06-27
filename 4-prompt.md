[PASTE SESSION HEADER ABOVE FIRST]

Build the Add Listing multi-step flow.
Protected — requires login.

Install:
  npm install react-hook-form

─── STEP 1: ADD LISTING STORE ───────────────────────────────

Create src/store/add-listing.store.ts:

All fields matching Flutter AddListingState exactly:

interface AddListingState {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  submitError: string | null;

  // Step 0 — Role
  advertiserType: 'owner' | 'agent' | 'broker' | 'host';
  selectedService: 'listing' | 'marketing';

  // License (step 0b owner/agent)
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

  // License (step 0c broker)
  brokerAdLicenseNumber: string | null;
  brokerOwnerIdType: string;
  brokerOwnerIdNumber: string | null;

  // License (step 0d host)
  hostTourismLicenseNumber: string | null;

  // Step 1 — Category (from Flutter: category field)
  categoryId: string | null;
  categoryNameAr: string | null;
  propertyType: string | null; // from category
  listingType: string | null;  // from category

  // Step 2 — Media (Flutter: photos list of URLs)
  uploadedUrls: string[];
  coverPhoto: string | null;
  isUploading: boolean;

  // Step 3 — Info (Flutter fields)
  title: string;
  description: string | null;
  isResidential: boolean;      // maps to usageType
  hasCommission: boolean;      // maps to commission
  commissionPercent: number | null;

  // Step 4 — Features (Flutter: Set of strings)
  // Store as individual booleans matching backend fields:
  hasWater: boolean;
  hasElectricity: boolean;
  hasSewage: boolean;
  hasPrivateRoof: boolean;
  isInVilla: boolean;
  hasTwoEntrances: boolean;
  hasSpecialEntrance: boolean;

  // Step 5 — Details (Flutter fields)
  bedrooms: number | null;
  livingRooms: number | null;
  bathrooms: number | null;
  facade: string | null;
  streetWidth: number | null;
  floorNumber: number | null;  // maps to floor
  propertyAge: number | null;
  isFurnished: boolean;
  hasKitchen: boolean;
  hasExtraUnit: boolean;
  hasCarEntrance: boolean;
  hasElevator: boolean;

  // Step 3 also has (move price/area to step 3):
  totalPrice: number | null;   // Flutter: price
  area: number | null;         // Flutter: area

  // Step 6 — Location (Flutter fields)
  address: string | null;
  lat: number | null;
  lng: number | null;
  city: string;
  district: string | null;
}

Create store with actions:
  setField(field, value)
  nextStep()
  prevStep()
  reset()
  setLicenseId(id)
  setSubmitting(bool)
  setSubmitError(msg)
  addUploadedUrl(url)
  removeUploadedUrl(url)

─── STEP 2: PAGE SHELL ──────────────────────────────────────

Create src/app/[locale]/dashboard/add-listing/page.tsx:

Wrap with AuthGuard.

Full page layout:
  Top bar (sticky):
    Back arrow (left) → goes to previous step
                        or /dashboard on step 0
    Title: "إضافة إعلان" (center)
    Forward arrow (right) → only on step 0
                            goes to step 0a/0c/0d

  Progress bar:
    Thin bar below top bar
    Width: (currentStep / totalSteps) * 100%
    Color: #F5A623

  Step dots (below progress bar):
    Small circles for each step
    Filled + #F5A623 for completed
    Current: #F5A623 border
    Future: grey

  Content area (scrollable)

  Bottom bar (sticky):
    Back button (outlined, grey) ← hidden on step 0
    Next/Submit button (#F5A623, full width or half)

Step components rendered based on currentStep.

Steps array is computed from advertiserType:
  owner/agent:  [0, '0a', '0b', 1, 2, 3, 4, 5, 6, 7]
  broker:       [0, '0c', 1, 2, 3, 4, 5, 6, 7]
  host:         [0, '0d', 1, 2, 3, 4, 5, 6, 7]

─── STEP 3: STEP 0 — ROLE SELECTION ─────────────────────────

Three role cards in a row:
  مالك / وكيل   → advertiserType = 'owner'
  مسوق عقاري    → advertiserType = 'broker'
  مضيف           → advertiserType = 'host'

Selected: border-2 border-[#F5A623] bg-orange-50 rounded-xl
Unselected: border border-gray-200 bg-white rounded-xl

Service options below (two cards):
  إضافة إعلان عقاري:
    Description: "اعرض عقارك للبيع أو الإيجار"
    + icon (green circle)
    selectedService = 'listing'

  طلب تسويق عقار:
    Description: "اطلب من وسطاء تسويق عقارك"
    Chat icon (grey circle)
    selectedService = 'marketing'
    On select: show toast "هذه الخدمة قادمة قريباً"

Forward arrow proceeds only if service = 'listing'

─── STEP 4: STEP 0a — OWNER INFO ────────────────────────────

Info screen explaining licensing.

Green info banner:
  "الترخيص من خلال عقار يعفي من عمولة البيع أو التأجير"

White card content:
  Title: "يقوم عقار بإصدار ترخيص إعلان للملاك والوكلاء"

  Steps (bullet list):
  • إضافة معلومات المالك/الوكيل ووثيقة الملكية
  • إضافة معلومات الإعلان
  • سداد رسوم الإعلان
  • الموافقة على عقد الوساطة

  Requirements (bullet list):
  • وثيقة ملكية وهوية فعالة
  • سداد رسوم الإعلان
  • الموافقة على عقد الوساطة

Bottom: "استمرار" button → next step (0b)

─── STEP 5: STEP 0b — OWNER/AGENT LICENSE FORM ──────────────

Dynamic form — same logic as Flutter step0b:

Section 1: نوع الصك
  Toggle pills:
    صك إلكتروني/سجل عيني → 'electronic_deed'
    غير ذلك               → 'other'

Section 2: نوع هوية المالك
  Toggle pills:
    هوية وطنية  → 'national_id'
    سجل تجاري   → 'commercial_registration'
    رقم موحد 700 → 'unified_700'

Section 3: Dynamic based on propertyOwnerIdType:

  national_id:
    Input: "رقم الهوية الوطنية للمالك *"
           → ownerNationalIdNumber
    Input: "تاريخ ميلاد المالك *" (date)
           → propertyOwnerBirthDate
    Checkbox: "هجري" → isHijriCalendar
    Input: "رقم جوال المالك" (pre-filled from user.phone)
           → propertyOwnerPhone

  commercial_registration:
    Input: "رقم السجل التجاري للمنشأة *"
           → ownerCommercialRegNumber
    NO birth date (companies have no birth date)

  unified_700:
    Input: "الرقم الموحد 700 للمنشأة *"
           → ownerUnifiedNumber
    NO birth date

Always show:
  Input: "رقم الصك أو رقم العقار أو رقم السجل العيني *"
         → ownershipDocumentNumber
  Input (optional): "رقم هوية أحد الملاك"
         Hint: "في حال وجود ملاك متعددين"
         → oneOfOwnersNationalId

If advertiserType = 'agent', also show:
  Input: "رقم الوكالة الرسمية *" → powerOfAttorneyNumber
  Input: "رقم الهوية الوطنية للوكيل *" → agentNationalIdNumber
  Input: "تاريخ ميلاد الوكيل *" → agentBirthDate
  Input: "رقم جوال الوكيل" (pre-filled) → agentPhone

When propertyOwnerIdType changes:
  Clear ownerNationalIdNumber = null
  Clear ownerCommercialRegNumber = null
  Clear ownerUnifiedNumber = null
  Clear propertyOwnerBirthDate = null

Bottom buttons:
  "استمرار" → validate required fields → next step
  "إدخال البيانات لاحقاً":
    Show confirm modal:
      "لن يتم نشر إعلانك حتى تكتمل بيانات الترخيص.
       سيتم حفظ إعلانك كمسودة."
    On confirm: skipLicenseInfo = true → next step

─── STEP 6: STEP 0c — BROKER LICENSE ────────────────────────

Info banner:
  "لإضافة إعلان يجب أن يكون لديك ترخيص إعلان
   صادر من الهيئة العامة للعقار"

Fields:
  "رقم ترخيص الإعلان *" → brokerAdLicenseNumber
  نوع هوية المالك toggle:
    هوية وطنية | سجل تجاري
    → brokerOwnerIdType
  Dynamic label input:
    national_id → "رقم الهوية الوطنية للمالك *"
    commercial  → "رقم السجل التجاري للمنشأة *"
    → brokerOwnerIdNumber

On "التالي":
  Validate fields not empty
  Show loading spinner on button
  POST /property-advertisement-licenses/validate-broker
    auth: true
    body: {
      adLicenseNumber: brokerAdLicenseNumber,
      ownerIdType: brokerOwnerIdType,
      ownerIdNumber: brokerOwnerIdNumber
    }
  If isValid: setLicenseId(licenseId) → nextStep()
  If !isValid: show error under first field

─── STEP 7: STEP 0d — HOST LICENSE ──────────────────────────

Info banner:
  "لإضافة إعلان إيجار يومي يجب أن يكون لديك
   ترخيص من وزارة السياحة"

Field:
  "رقم رخصة وزارة السياحة *"
  → hostTourismLicenseNumber

On "التالي":
  POST /property-advertisement-licenses/validate-host
    { tourismLicenseNumber }
  If valid → setLicenseId → nextStep()
  If invalid → show error

─── STEP 8: STEP 1 — CATEGORY ───────────────────────────────

On load: GET /listing-categories
Response: [{ id, name, nameAr, propertyType,
             listingType, sortOrder }]

Sort by sortOrder.
Display as grid (3 cols desktop, 2 cols mobile).

Each card:
  Property type icon (use emoji or SVG):
    apartment → 🏢 | villa → 🏡 | land → 🌿
    building → 🏗 | shop → 🏪 | house → 🏠
    rest_house → 🏕 | farm → 🌾 | chalet → ⛺
    commercial_office → 💼 | warehouse → 🏭
  nameAr (Arabic name)
  listingType badge (small):
    sale → "للبيع" | rent_long → "للإيجار"
    rent_short → "إيجار يومي"

Selected: border-2 border-[#F5A623] bg-orange-50
On select:
  categoryId = category.id
  categoryNameAr = category.nameAr
  propertyType = category.propertyType
  listingType = category.listingType

─── STEP 9: STEP 2 — MEDIA ──────────────────────────────────

Upload area:
  Dashed border, rounded-xl
  "اسحب الصور هنا أو انقر للرفع"
  Subtext: "JPG, PNG, WEBP — حتى 15MB لكل صورة"
  Accept: .jpg .jpeg .png .webp
  Multiple: true

On file select:
  For each file:
    If file.size > 15MB → skip + show error
    Show upload progress bar
    POST /media/upload (requires auth)
      FormData: files[] + folder='listings'
    On success: add URL to uploadedUrls
    First URL: set as coverPhoto

Uploaded photos grid (3 cols):
  Thumbnail image
  X button → remove URL + call DELETE /media if needed
  First photo: "غلاف" badge (golden)
  Drag to reorder (HTML5 drag API)

─── STEP 10: STEP 3 — INFO ──────────────────────────────────

Matching Flutter step 3 fields exactly:

Title input:
  Label: "عنوان الإعلان *"
  → title, required

Price input:
  Label: "السعر الكلي (ريال) *"
  Number input, format with commas on blur
  → totalPrice

Area input:
  Label: "المساحة (م²) *"
  Number input
  → area

Usage type:
  Radio: سكني (residential) | تجاري (commercial)
  → isResidential (true = residential)

Commission toggle:
  "عمولة البيع/الإيجار" switch
  If on: show percent input (0-100)
  → hasCommission, commissionPercent

Description:
  Label: "وصف العقار"
  Textarea, optional
  → description

─── STEP 11: STEP 4 — FEATURES ──────────────────────────────

Matching Flutter step 4 (Set of strings):

Two sections in a grid:

المرافق:
  مياه          → hasWater
  كهرباء         → hasElectricity
  صرف صحي       → hasSewage
  سطح خاص       → hasPrivateRoof
  داخل فيلا     → isInVilla
  مدخلان         → hasTwoEntrances
  مدخل خاص      → hasSpecialEntrance

Each item: checkbox + label
Checked: #F5A623 checkbox

─── STEP 12: STEP 5 — DETAILS ───────────────────────────────

Matching Flutter step 5 fields exactly:

Number inputs:
  غرف النوم   → bedrooms
  غرف المعيشة → livingRooms
  دورات المياه → bathrooms
  الطابق       → floorNumber (maps to floor in API)
  عمر العقار   → propertyAge (years)
  عرض الشارع   → streetWidth (meters)

Facade select:
  → facade
  Options: شمال(north) | جنوب(south) | شرق(east) |
           غرب(west) | شمال شرق(northeast) |
           شمال غرب(northwest) | جنوب شرق(southeast) |
           جنوب غرب(southwest)

Checkboxes:
  مفروش       → isFurnished
  مطبخ        → hasKitchen
  وحدة إضافية → hasExtraUnit
  مدخل سيارة  → hasCarEntrance
  مصعد        → hasElevator

─── STEP 13: STEP 6 — LOCATION ──────────────────────────────

Matching Flutter step 6 fields:
  address, lat, lng → also derive city + district

City input:
  Label: "المدينة *"
  Required
  → city

District input:
  Label: "الحي"
  Optional
  → district

Address input:
  Label: "العنوان التفصيلي"
  Optional
  → address

Interactive Google Map:
  User clicks → set lat, lng
  Draggable pin at lat/lng
  Search input on map: "ابحث عن موقع"
  When city typed → center map on city
  Geocoding API for city search

─── STEP 14: STEP 7 — REVIEW + SUBMIT ───────────────────────

Show summary:
  Photos (first 4 thumbnails)
  Title + price + area
  Category + listingType
  Features checklist
  Small static map
  License status

Edit buttons → jump to that step

Submit "نشر الإعلان" button:

// BROKER or HOST — already validated at 0c/0d
if (advertiserType === 'broker' || advertiserType === 'host'):
  POST /listings with licenseId
  On success: "تم نشر إعلانك بنجاح" → /dashboard/my-ads

// OWNER/AGENT + skipped license
if (skipLicenseInfo === true):
  POST /listings without licenseId
  On success: "تم حفظ إعلانك كمسودة" → /dashboard/my-ads

// OWNER/AGENT + filled license
else:
  Step 1: POST /property-advertisement-licenses
    body: all license fields + no listingId
    strip null fields before sending
    get licenseId from response
  Step 2: POST /listings with licenseId
  On success: "تم إرسال إعلانك للمراجعة" → /dashboard/my-ads

POST /listings body:
{
  title,
  categoryId,
  propertyType,    // from category
  listingType,     // from category
  totalPrice,
  area,
  city,
  district,
  address,
  latitude: lat,
  longitude: lng,
  description,
  usageType: isResidential ? 'residential' : 'commercial',
  commission: hasCommission,
  commissionPercent,
  bedrooms,
  livingRooms,
  bathrooms,
  floor: floorNumber,
  propertyAge,
  streetWidth,
  facade,
  hasWater,
  hasElectricity,
  hasSewage,
  hasPrivateRoof,
  isInVilla,
  hasTwoEntrances,
  hasSpecialEntrance,
  isFurnished,
  hasKitchen,
  hasExtraUnit,
  hasCarEntrance,
  hasElevator,
  mediaUrls: uploadedUrls,
  coverPhoto,
  advertiserType,
  licenseId, // null if skipped
}

Strip all null/undefined values before sending.

On any backend error:
  Show error message from response
  Stay on review page

─── TEST ────────────────────────────────────────────────────

1. Owner flow — full path:
   Step 0: select مالك → إضافة إعلان
   Step 0a: info screen → continue
   Step 0b: fill license fields → continue
   Steps 1-7: complete all
   Submit → "تم إرسال إعلانك للمراجعة" ✅

2. Skip license:
   Step 0b: "إدخال البيانات لاحقاً" → confirm
   Submit → "تم حفظ إعلانك كمسودة" ✅

3. Broker flow:
   Step 0c: fill license → validate → proceed
   Submit → "تم نشر إعلانك بنجاح" ✅

4. Host flow:
   Step 0d: fill tourism license → validate → proceed
   Submit → published ✅

5. Category selection shows all categories ✅
6. Photo upload → thumbnails appear ✅
7. Map location picker → pin sets lat/lng ✅
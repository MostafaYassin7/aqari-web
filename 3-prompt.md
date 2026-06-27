[PASTE SESSION HEADER ABOVE FIRST]

Build dashboard layout, My Ads page,
and Favorites page.

─── STEP 1: DASHBOARD LAYOUT ────────────────────────────────

Create src/app/[locale]/dashboard/layout.tsx:

Wrap with AuthGuard.

Desktop (lg+): sidebar 240px + content area
Mobile: bottom tabs

Sidebar/tabs items:
  إعلاناتي       /dashboard/my-ads       (document icon)
  المفضلة        /dashboard/favorites    (heart icon)
  المحفظة        /dashboard/wallet       (wallet icon)
  المحادثات      /dashboard/chat         (chat icon)
  إضافة إعلان   /dashboard/add-listing  (+ icon, #F5A623 bg)

Active item: #F5A623 text + light orange bg

─── STEP 2: MY ADS PAGE ─────────────────────────────────────

Create src/app/[locale]/dashboard/my-ads/page.tsx:

On load:
  GET /listings/my (requires auth)
  Returns paginated listings

Header:
  "إعلاناتي" title
  "إضافة إعلان جديد" button (#F5A623)
    → /dashboard/add-listing

Status tabs:
  الكل | منشور | قيد المراجعة | موقوف | مسودة | منتهي
  Map to API values:
    منشور        → published
    قيد المراجعة → pending
    موقوف        → paused or paused_temp
    مسودة        → draft
    منتهي        → expired

Listing rows (list layout not grid):
  Cover photo 120x80 rounded-lg
  Content:
    adNumber (grey small) "AQ-XXXXXX"
    title (bold)
    city · category
    parseFloat(totalPrice) formatted SAR
    area m²
  Status badge (right):
    published   → green "منشور"
    pending     → yellow "قيد المراجعة"
    paused_temp → orange "موقوف مؤقتاً"
    paused      → orange "موقوف"
    draft       → grey "مسودة"
    expired     → red "منتهي"

  Three-dots menu:
    عرض الإعلان  → /listings/:id (new tab)
    إيقاف مؤقت  →
      PATCH /listings/:id/status
      { status: 'paused_temp' }
      Confirm dialog first
    حذف          →
      Confirm dialog: "هل تريد حذف هذا الإعلان؟"
      DELETE /listings/:id
      Remove from list on success

  DRAFT listing extra:
    Orange warning banner below the row:
      ⚠️ "أكمل بيانات الترخيص لنشر هذا الإعلان"
      "إكمال الترخيص" link button
      → /dashboard/complete-license?listingId=:id

─── STEP 3: COMPLETE LICENSE PAGE ───────────────────────────

Create src/app/[locale]/dashboard/complete-license/page.tsx:

Get listingId from searchParams.
Fetch listing to confirm it exists and is DRAFT.

Title: "إكمال بيانات الترخيص"

Show same owner/agent license form
as Add Listing Step 0b:
  All same fields and validation
  No "إدخال البيانات لاحقاً" button here

On submit:
  POST /property-advertisement-licenses
  Body: {
    advertiserType: 'owner', // or detect from user role
    listingId: listingId,    // ← key difference from add listing
    ownershipDocumentType,
    ownershipDocumentNumber,
    propertyOwnerIdType,
    ownerNationalIdNumber,     // OR
    ownerCommercialRegNumber,  // OR
    ownerUnifiedNumber,        // based on type
    propertyOwnerBirthDate,
    isHijriCalendar,
    propertyOwnerPhone,
    oneOfOwnersNationalId,
    // agent fields if agent:
    powerOfAttorneyNumber,
    agentNationalIdNumber,
    agentBirthDate,
    agentPhone,
  }
  Strip null fields before sending

  On success:
    Show success alert:
      "تم إرسال بيانات الترخيص للمراجعة.
       سيتم نشر إعلانك فور الموافقة."
    router.push('/dashboard/my-ads')

─── STEP 4: FAVORITES PAGE ──────────────────────────────────

Create src/app/[locale]/dashboard/favorites/page.tsx:

On load:
  GET /engagement/favorites?targetType=listing
  (requires auth)
  Response: paginated list of favorited items

Header: "المفضلة"

Grid layout (same as /listings):
  Use ListingCard component
  Heart already filled (red) — all are favorited

On heart click:
  POST /engagement/favorites
    { targetType: 'listing', targetId: id }
  Response: { isFavorited: false }
  Remove listing from grid with fade animation

Empty state:
  Large heart icon (grey, 64px)
  "لا توجد إعلانات في المفضلة بعد"
  "استعرض الإعلانات" button → /listings

─── TEST ────────────────────────────────────────────────────

1. /dashboard/my-ads (logged in)
   Expected: listings load with correct status badges ✅

2. Filter by "مسودة"
   Expected: only DRAFT listings ✅
   Warning banner visible ✅

3. Three dots → إيقاف مؤقت
   Confirm dialog appears ✅
   After confirm: status badge changes ✅

4. DRAFT → "إكمال الترخيص" → form opens ✅
   Submit → listing becomes PENDING ✅
   Redirects to my-ads ✅

5. /dashboard/favorites
   Listings load ✅
   Click heart → listing fades out ✅

6. Try accessing without login → /login ✅
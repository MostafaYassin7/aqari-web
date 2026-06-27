We are building the Aqar web app MVP.
Next.js 16.2.6 App Router, TypeScript, Tailwind CSS v4.
Arabic RTL default (next-intl), English LTR toggle.
Font: Cairo. Primary color: #F5A623.

─── BACKEND ─────────────────────────────────────────────────

Base URL: https://api.aqora.sa/api/v1

All responses wrapped:
  { success: true, data: <payload>, message: "OK" }
  Always extract .data from response
  On error: { success: false, message: "<reason>" }
  Show message to user

Paginated responses (inside .data):
  { data: [...], total: number, page: number, pages: number }

Numbers from PostgreSQL come as STRINGS:
  totalPrice, pricePerMeter, area,
  latitude, longitude → always parseFloat()
  balance → parseFloat()

─── ENUMS (exact wire values — never change these) ──────────

ListingType:    sale | rent_long | rent_short
ListingStatus:  draft | published | paused_temp |
                paused | expired | pending
PropertyType:   apartment | villa | floor | land |
                building | shop | house | rest_house |
                farm | commercial_office | chalet |
                warehouse | camp | other
UserRole:       GUEST | USER | OWNER | BROKER | HOST | ADMIN
  (UserRole is UPPERCASE — all others are lowercase)
UsageType:      residential | commercial
Facade:         north | south | east | west |
                northeast | northwest | southeast | southwest
TransactionType: credit | debit
TransactionRef: top_up | promotion | subscription | booking
PromotionType:  featured | golden | buyers_alert | social_media
BundleCode:     basic | bronze | silver | golden

─── KEY RESPONSE SHAPES ─────────────────────────────────────

POST /auth/verify-otp:
  { token: string, isNewUser: boolean, user?: UserObject }

GET /listings:
  data: { data: ListingCard[], total, page, pages }

GET /listings/:id:
  data: {
    ...all listing fields,
    category: { id, name, nameAr, propertyType, listingType },
    __media__: [{ id, url, isCover, order }],
    __owner__: { name, phone, profilePhoto, role },
    stats: { viewCount, messageCount, favoriteCount, likeCount }
  }

GET /search (Algolia):
  data: { hits: AlgoliaListing[], total, page, pages }
  Algolia listing uses:
    objectID (not id)
    _geoloc: { lat, lng } (not latitude/longitude)
    Numbers are actual numbers (not strings)

GET /listing-categories:
  data: [{ id, name, nameAr, icon, propertyType,
           listingType, sortOrder }]

GET /chats:
  data: [{
    ...chat,
    otherParticipant: { id, name, profilePhoto, phone },
    unreadCount: number
  }]

GET /chats/:id/messages:
  data: { data: Message[], total, page }
  (no pages field — calculate: Math.ceil(total/limit))
  Default limit: 50
  Order: ASC (oldest first)

GET /wallet:
  data: { id, userId, balance: string, currency: "SAR" }
  balance is a string → always parseFloat(balance)

─── LISTING FIELDS ──────────────────────────────────────────

Core: id, adNumber, title, city, district, status
      listingType, propertyType
Pricing: totalPrice (string), pricePerMeter (string),
         commission, commissionPercent
Specs: area (string), bedrooms, bathrooms, livingRooms,
       floor, propertyAge, streetWidth, facade
Location: latitude (string), longitude (string)
Booleans: hasWater, hasElectricity, hasSewage,
          hasPrivateRoof, isInVilla, hasTwoEntrances,
          hasSpecialEntrance, isFurnished, hasKitchen,
          hasExtraUnit, hasCarEntrance, hasElevator,
          isPromoted, isGolden
Media: imageUrls resolved from __media__ array
       → sort by order, isCover first
       → map to url field

─── ADD LISTING STEPS (matches Flutter exactly) ─────────────

Step 0:  Role selection (advertiserType + service)
Step 0a: Owner info screen (مالك/وكيل only)
Step 0b: Owner/agent license form (مالك/وكيل only)
Step 0c: Broker license form (مسوق only)
Step 0d: Host license form (مضيف only)
Step 1:  Category selection
Step 2:  Media upload
Step 3:  Price + area + info (Flutter step 3 fields:
           price, area, isResidential, hasCommission,
           commissionPercent, description)
Step 4:  Features (Set of feature strings)
Step 5:  Details (bedrooms, livingRooms, bathrooms,
           facade, streetWidth, floorNumber,
           propertyAge, isFurnished, hasKitchen,
           hasExtraUnit, hasCarEntrance, hasElevator)
Step 6:  Location (address, lat, lng)
Step 7:  Review + submit

advertiserType determines which steps show:
  owner/agent: 0 → 0a → 0b → 1-7
  broker:      0 → 0c → 1-7
  host:        0 → 0d → 1-7

─── SOCKET.IO ───────────────────────────────────────────────

Server: https://api.aqora.sa
Chat namespace: /chat
Notifications namespace: /notifications
Auth: { token: 'Bearer <jwt>' } in handshake auth object
Transport: websocket only

Chat emit events:
  join_chat(chatId: string)
  send_message({ chatId: string, content: string })
  typing(chatId: string)
  leave_chat(chatId: string)

Chat listen events:
  new_message({ chatId: string, message: MessageObject })
  user_typing(userId: string)
  messages_read()

─── EXISTING WEB APP ────────────────────────────────────────

Already exists:
  /listings         browse + basic search (Algolia)
  /listings/[id]    listing detail
  /about /contact /privacy /terms /delete-account
  Navbar with language toggle
  src/lib/api.ts    has searchListings() + getListing(id)
                    currently public/unauthenticated
                    uses Algolia-style response

Already has i18n keys:
  nav, hero, features, users, screenshots,
  cta, footer, privacy, terms, about, contact, deleteAccount

Missing i18n keys (add as needed):
  auth, listing, addListing, chat, wallet,
  myAds, favorites, map, dailyRents, common

─── PACKAGES NOT YET INSTALLED ──────────────────────────────

Need to install before starting:
  npm install zustand
  npm install socket.io-client
  npm install react-hook-form
  npm install @react-google-maps/api
  npm install react-otp-input

─── CRITICAL RULES ──────────────────────────────────────────

1. Never hardcode the base URL — use the constant
2. Always parseFloat() for price/area/lat/lng fields
3. UserRole values are UPPERCASE (USER, OWNER, etc)
   All other enums are lowercase
4. Algolia responses use objectID not id
   and _geoloc.lat/_geoloc.lng not latitude/longitude
5. Extract .data from every API response
   Paginated .data contains another .data array
6. Auth token stored in Zustand persisted store
   Key: 'aqar-auth' in localStorage
   Token path: JSON.parse(localStorage['aqar-auth'])
               .state.token
7. All text is Arabic first (RTL)
   Use next-intl t() for all user-facing strings
   Add keys to both ar.json and en.json
8. Never use a component library —
   Tailwind CSS only, build everything custom
9. Google Maps key in .env.local:
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=<key>
10. Protected pages wrap with AuthGuard component
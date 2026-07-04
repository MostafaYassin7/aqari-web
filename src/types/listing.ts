export interface ListingOwner {
  id: string;
  name?: string;
  photo?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  lastActive?: string;
  memberSince?: string;
}

export interface ListingFeatures {
  water?: boolean;
  electricity?: boolean;
  elevator?: boolean;
  furnished?: boolean;
  kitchen?: boolean;
  parking?: boolean;
  pool?: boolean;
  gym?: boolean;
  security?: boolean;
  ac?: boolean;
  [key: string]: boolean | undefined;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  price: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  city: string;
  district?: string;
  category: string;
  listingType: string;
  propertyType?: string;
  coverPhoto?: string;
  photos?: string[];
  isGolden: boolean;
  isPromoted: boolean;
  adNumber?: string;
  owner?: ListingOwner;
  features?: ListingFeatures;
  lat?: number;
  lng?: number;
  pricePerMeter?: string;
  createdAt?: string;
  maxGuests?: number;
  pricePerHalfDay?: string;
}

export interface SearchParams {
  query?: string;
  city?: string;
  listingType?: string;
  propertyType?: string;
  priceFrom?: string;
  priceTo?: string;
  bedrooms?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListingMedia {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
}

export interface ListingOwnerDetail {
  name: string;
  phone: string;
  profilePhoto: string | null;
  role: string;
}

export interface ListingStats {
  viewCount: number;
  messageCount: number;
  favoriteCount: number;
  likeCount: number;
}

export interface ListingDetail extends Listing {
  __media__?: ListingMedia[];
  __owner__?: ListingOwnerDetail;
  stats?: ListingStats;
  latitude?: string;
  longitude?: string;
  includedServices?: string[];
  minNights?: number;
  checkInTime?: string;
  checkOutTime?: string;
}

'use client';
import { useEffect, useState } from 'react';
import { useAddListingStore } from '@/store/add-listing.store';
import { getCategories } from '@/lib/api';
import {
  Building2, Home, Landmark, Building, Store, Warehouse,
  Leaf, Coffee, Mountain, Briefcase, Layers, Tent, LayoutGrid,
} from 'lucide-react';

const PROPERTY_ICONS: Record<string, React.ReactNode> = {
  apartment:         <Building2  size={26} strokeWidth={1.5} />,
  villa:             <Home       size={26} strokeWidth={1.5} />,
  land:              <Landmark   size={26} strokeWidth={1.5} />,
  building:          <Building   size={26} strokeWidth={1.5} />,
  shop:              <Store      size={26} strokeWidth={1.5} />,
  house:             <Home       size={26} strokeWidth={1.5} />,
  rest_house:        <Coffee     size={26} strokeWidth={1.5} />,
  farm:              <Leaf       size={26} strokeWidth={1.5} />,
  chalet:            <Mountain   size={26} strokeWidth={1.5} />,
  commercial_office: <Briefcase  size={26} strokeWidth={1.5} />,
  warehouse:         <Warehouse  size={26} strokeWidth={1.5} />,
  floor:             <Layers     size={26} strokeWidth={1.5} />,
  camp:              <Tent       size={26} strokeWidth={1.5} />,
  other:             <LayoutGrid size={26} strokeWidth={1.5} />,
};

const LISTING_TYPE_LABEL: Record<string, string> = {
  sale: 'للبيع',
  rent_long: 'للإيجار',
  rent_short: 'إيجار يومي',
};

const LISTING_TYPE_STYLE: Record<string, string> = {
  sale:       'bg-blue-50 text-blue-700',
  rent_long:  'bg-emerald-50 text-emerald-700',
  rent_short: 'bg-violet-50 text-violet-700',
};

interface Category {
  id: string;
  nameAr: string;
  propertyType: string;
  listingType: string;
  sortOrder: number;
}

export default function Step1Category() {
  const store = useAddListingStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        const list = (Array.isArray(data) ? data : data?.data ?? []) as Category[];
        setCategories(list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (cat: Category) => {
    store.setField('categoryId', cat.id);
    store.setField('categoryNameAr', cat.nameAr);
    store.setField('propertyType', cat.propertyType);
    store.setField('listingType', cat.listingType);
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-base font-bold text-[#222222] mb-4">اختر نوع العقار</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const selected = store.categoryId === cat.id;
          const typeStyle = LISTING_TYPE_STYLE[cat.listingType] ?? 'bg-gray-50 text-gray-600';
          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat)}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                selected
                  ? 'border-[#F5A623] bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className={selected ? 'text-[#F5A623]' : 'text-[#717171]'}>
                {PROPERTY_ICONS[cat.propertyType] ?? <LayoutGrid size={26} strokeWidth={1.5} />}
              </span>
              <span className={`text-xs font-semibold text-center leading-tight ${selected ? 'text-[#F5A623]' : 'text-[#222222]'}`}>
                {cat.nameAr}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeStyle}`}>
                {LISTING_TYPE_LABEL[cat.listingType] ?? cat.listingType}
              </span>
            </button>
          );
        })}
      </div>
      {!store.categoryId && (
        <p className="text-xs text-[#717171] text-center mt-4">اختر نوع العقار للمتابعة</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X, LayoutGrid, Map, ArrowUpDown } from "lucide-react";

const CITIES = [
  { value: "Riyadh",       label: "الرياض" },
  { value: "Jeddah",       label: "جدة" },
  { value: "Mecca",        label: "مكة المكرمة" },
  { value: "Medina",       label: "المدينة المنورة" },
  { value: "Dammam",       label: "الدمام" },
  { value: "Khobar",       label: "الخبر" },
  { value: "Dhahran",      label: "الظهران" },
  { value: "Abha",         label: "أبها" },
  { value: "Tabuk",        label: "تبوك" },
  { value: "Qassim",       label: "القصيم" },
  { value: "Taif",         label: "الطائف" },
  { value: "Hail",         label: "حائل" },
  { value: "Najran",       label: "نجران" },
  { value: "Jazan",        label: "جازان" },
  { value: "Jouf",         label: "الجوف" },
  { value: "Baha",         label: "الباحة" },
  { value: "Arar",         label: "عرعر" },
];

const PROPERTY_TYPES = [
  { value: "apartment",          label: "شقة" },
  { value: "villa",              label: "فيلا" },
  { value: "land",               label: "أرض" },
  { value: "building",           label: "عمارة" },
  { value: "shop",               label: "محل" },
  { value: "house",              label: "بيت" },
  { value: "warehouse",          label: "مستودع" },
  { value: "farm",               label: "مزرعة" },
  { value: "rest_house",         label: "استراحة" },
  { value: "chalet",             label: "شاليه" },
  { value: "commercial_office",  label: "مكتب" },
];

const BEDROOM_OPTIONS = ["1", "2", "3", "4", "5+"];

export interface FilterValues {
  query: string;
  city: string;
  listingType: string;
  propertyType: string;
  priceFrom: string;
  priceTo: string;
  areaFrom: string;
  areaTo: string;
  bedrooms: string;
  isFurnished: boolean;
  hasElevator: boolean;
  hasWater: boolean;
  hasElectricity: boolean;
  sortBy: string;
}

export const defaultFilters: FilterValues = {
  query: "", city: "", listingType: "", propertyType: "",
  priceFrom: "", priceTo: "", areaFrom: "", areaTo: "",
  bedrooms: "", isFurnished: false, hasElevator: false,
  hasWater: false, hasElectricity: false, sortBy: "newest",
};

interface Props {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  resultCount?: number;
  loading?: boolean;
  view?: "list" | "map";
  onViewChange?: (v: "list" | "map") => void;
  hideListingType?: boolean;
  hidePropertyType?: boolean;
}

export default function SearchFilters({
  values, onChange, resultCount, loading,
  view, onViewChange, hideListingType = false, hidePropertyType = false,
}: Props) {
  const t = useTranslations("searchFilters");
  const [showFilters, setShowFilters] = useState(false);

  function update<K extends keyof FilterValues>(key: K, val: FilterValues[K]) {
    onChange({ ...values, [key]: val });
  }

  function togglePropertyType(pt: string) {
    update("propertyType", values.propertyType === pt ? "" : pt);
  }

  function reset() {
    onChange(defaultFilters);
  }

  const activeFilterCount = [
    values.city,
    hideListingType ? "" : values.listingType,
    hidePropertyType ? "" : values.propertyType,
    values.priceFrom, values.priceTo, values.areaFrom, values.areaTo,
    values.bedrooms, values.isFurnished, values.hasElevator,
    values.hasWater, values.hasElectricity,
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">

        {/* Main search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={17} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={values.query}
              onChange={(e) => update("query", e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 text-sm"
            />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-[#F5A623] border-[#F5A623] text-white"
                : "border-gray-200 text-gray-600 hover:border-[#F5A623] hover:text-[#F5A623]"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">{t("filters")}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* List/Map toggle — always visible, text labels hidden on mobile */}
          {onViewChange && (
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => onViewChange("list")}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "list" ? "bg-[#F5A623] text-white" : "text-gray-500 hover:text-[#F5A623]"
                }`}
                aria-label={t("listView")}
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">{t("listView")}</span>
              </button>
              <button
                onClick={() => onViewChange("map")}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === "map" ? "bg-[#F5A623] text-white" : "text-gray-500 hover:text-[#F5A623]"
                }`}
                aria-label={t("mapView")}
              >
                <Map size={14} />
                <span className="hidden sm:inline">{t("mapView")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Listing type tabs + city + sort */}
        {!hideListingType && (
          <div className="flex items-center gap-2">
            {/* Type pills — scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 flex-1 min-w-0">
              {[
                { value: "", label: t("all") },
                { value: "sale", label: t("sale") },
                { value: "rent_long", label: t("rentLong") },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => update("listingType", values.listingType === type.value ? "" : type.value)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    values.listingType === type.value
                      ? "bg-[#F5A623] border-[#F5A623] text-white"
                      : "border-gray-200 text-gray-600 hover:border-[#F5A623] hover:text-[#F5A623]"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* City + Sort — always visible */}
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={values.city}
                onChange={(e) => update("city", e.target.value)}
                className="border border-gray-200 rounded-xl px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-[#F5A623] bg-white max-w-[90px] sm:max-w-none"
              >
                <option value="">{t("allCities")}</option>
                {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="relative flex items-center">
                <ArrowUpDown size={12} className="absolute start-2 text-gray-400 pointer-events-none" />
                <select
                  value={values.sortBy}
                  onChange={(e) => update("sortBy", e.target.value)}
                  className="ps-6 pe-1.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#F5A623] bg-white text-gray-600 appearance-none cursor-pointer max-w-[80px] sm:max-w-none"
                >
                  <option value="newest">{t("newest")}</option>
                  <option value="oldest">{t("oldest")}</option>
                  <option value="price_asc">{t("priceAscShort")}</option>
                  <option value="price_desc">{t("priceDescShort")}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* City + sort row when listing type tabs are hidden */}
        {hideListingType && (
          <div className="flex items-center gap-2">
            <select
              value={values.city}
              onChange={(e) => update("city", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-[#F5A623] bg-white"
            >
              <option value="">{t("allCities")}</option>
              {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div className="relative flex items-center">
              <ArrowUpDown size={13} className="absolute start-2.5 text-gray-400 pointer-events-none" />
              <select
                value={values.sortBy}
                onChange={(e) => update("sortBy", e.target.value)}
                className="ps-7 pe-2 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#F5A623] bg-white text-gray-600 appearance-none cursor-pointer"
              >
                <option value="newest">{t("newest")}</option>
                <option value="oldest">{t("oldest")}</option>
                <option value="price_asc">{t("priceAsc")}</option>
                <option value="price_desc">{t("priceDesc")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="border-t border-gray-100 pt-4 space-y-5">
            {/* Property type chips */}
            {!hidePropertyType && (
            <div>
              <p className="text-xs font-semibold text-[#717171] mb-2 uppercase tracking-wide">{t("propertyType")}</p>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => togglePropertyType(pt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      values.propertyType === pt.value
                        ? "bg-[#F5A623] border-[#F5A623] text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-[#717171] mb-2 uppercase tracking-wide">{t("priceRange")}</p>
              <div className="flex gap-2" dir="ltr">
                <input
                  type="number"
                  placeholder={t("from")}
                  value={values.priceFrom}
                  onChange={(e) => update("priceFrom", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5A623]"
                />
                <span className="self-center text-gray-300">–</span>
                <input
                  type="number"
                  placeholder={t("to")}
                  value={values.priceTo}
                  onChange={(e) => update("priceTo", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5A623]"
                />
              </div>
            </div>

            {/* Area range */}
            <div>
              <p className="text-xs font-semibold text-[#717171] mb-2 uppercase tracking-wide">{t("areaRange")}</p>
              <div className="flex gap-2" dir="ltr">
                <input
                  type="number"
                  placeholder={t("from")}
                  value={values.areaFrom}
                  onChange={(e) => update("areaFrom", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5A623]"
                />
                <span className="self-center text-gray-300">–</span>
                <input
                  type="number"
                  placeholder={t("to")}
                  value={values.areaTo}
                  onChange={(e) => update("areaTo", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5A623]"
                />
              </div>
            </div>

            {/* Bedrooms pills */}
            <div>
              <p className="text-xs font-semibold text-[#717171] mb-2 uppercase tracking-wide">{t("bedrooms")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => update("bedrooms", "")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    values.bedrooms === "" ? "bg-[#F5A623] border-[#F5A623] text-white" : "border-gray-200 text-gray-600"
                  }`}
                >{t("any")}</button>
                {BEDROOM_OPTIONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => update("bedrooms", values.bedrooms === b ? "" : b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      values.bedrooms === b ? "bg-[#F5A623] border-[#F5A623] text-white" : "border-gray-200 text-gray-600"
                    }`}
                  >{b}</button>
                ))}
              </div>
            </div>

            {/* Feature checkboxes */}
            <div>
              <p className="text-xs font-semibold text-[#717171] mb-2 uppercase tracking-wide">{t("features")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { key: "isFurnished", label: t("furnished") },
                  { key: "hasElevator", label: t("elevator") },
                  { key: "hasWater", label: t("water") },
                  { key: "hasElectricity", label: t("electricity") },
                ] as const).map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                      values[key] ? "border-[#F5A623] bg-orange-50 text-[#F5A623]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={values[key]}
                      onChange={(e) => update(key, e.target.checked)}
                      className="accent-[#F5A623]"
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button onClick={reset} className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600">
                <X size={14} /> {t("clearAll")}
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 bg-[#F5A623] hover:bg-[#E09400] text-white font-bold rounded-xl text-sm transition-colors"
              >
                {t("done")}
              </button>
            </div>
          </div>
        )}

        {/* Result count */}
        {resultCount !== undefined && !loading && (
          <p className="text-xs text-[#717171]">
            {t("resultCount", { count: resultCount })}
          </p>
        )}
      </div>
    </div>
  );
}

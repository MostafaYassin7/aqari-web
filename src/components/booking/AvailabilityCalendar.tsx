"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format, getDay, getDaysInMonth, subMonths } from "date-fns";
import { getListingCalendar } from "@/lib/api";

interface Props {
  listingId: string;
  totalPricePerNight: number;
  minNights: number;
  onSelectionChange: (selection: {
    checkInDate: string | null;
    checkOutDate: string | null;
    nights: number;
    totalPrice: number;
  }) => void;
}

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const DAY_HEADERS = ["ج", "خ", "ر", "ث", "ث", "إ", "س"];

function toDateKey(year: number, month: number, day: number): string {
  return format(new Date(year, month - 1, day), "yyyy-MM-dd");
}

export default function AvailabilityCalendar({
  listingId,
  totalPricePerNight,
  minNights = 1,
  onSelectionChange,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayKey = format(today, "yyyy-MM-dd");

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getListingCalendar(listingId, currentYear, currentMonth)
      .then((res) => {
        if (cancelled) return;
        setBlockedDates(res.blockedDates.map((b) => b.date));
      })
      .catch(() => {
        if (!cancelled) setBlockedDates([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, currentYear, currentMonth]);

  const monthsFromToday =
    (currentYear - today.getFullYear()) * 12 + (currentMonth - (today.getMonth() + 1));
  const isAtCurrentMonth = monthsFromToday <= 0;
  const isAtMaxMonth = monthsFromToday >= 12;

  function goToPrevMonth() {
    if (isAtCurrentMonth) return;
    const prev = subMonths(new Date(currentYear, currentMonth - 1, 1), 1);
    setCurrentYear(prev.getFullYear());
    setCurrentMonth(prev.getMonth() + 1);
  }

  function goToNextMonth() {
    if (isAtMaxMonth) return;
    const next = addMonths(new Date(currentYear, currentMonth - 1, 1), 1);
    setCurrentYear(next.getFullYear());
    setCurrentMonth(next.getMonth() + 1);
  }

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    return Math.round(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000
    );
  }, [checkInDate, checkOutDate]);
  const totalPrice = nights * totalPricePerNight;

  function resetToNulls() {
    onSelectionChange({ checkInDate: null, checkOutDate: null, nights: 0, totalPrice: 0 });
  }

  function handleDateClick(dateKey: string, isPast: boolean, isBlocked: boolean) {
    if (isPast || isBlocked) return;

    if (checkInDate === null) {
      setCheckInDate(dateKey);
      setCheckOutDate(null);
      setErrorMessage(null);
      resetToNulls();
      return;
    }

    if (checkOutDate === null) {
      if (dateKey <= checkInDate) {
        setCheckInDate(dateKey);
        setCheckOutDate(null);
        setErrorMessage(null);
        resetToNulls();
        return;
      }

      const hasBlockedInRange = blockedDates.some(
        (d) => d > checkInDate && d < dateKey
      );
      if (hasBlockedInRange) {
        setErrorMessage("يوجد تواريخ محجوزة في هذا النطاق");
        setCheckInDate(null);
        setCheckOutDate(null);
        return;
      }

      const rangeNights = Math.round(
        (new Date(dateKey).getTime() - new Date(checkInDate).getTime()) / 86400000
      );
      if (rangeNights < minNights) {
        setErrorMessage(`الحد الأدنى للإقامة ${minNights} ليالٍ`);
        setCheckInDate(dateKey);
        setCheckOutDate(null);
        return;
      }

      setCheckOutDate(dateKey);
      setErrorMessage(null);
      onSelectionChange({
        checkInDate,
        checkOutDate: dateKey,
        nights: rangeNights,
        totalPrice: rangeNights * totalPricePerNight,
      });
      return;
    }

    setCheckInDate(dateKey);
    setCheckOutDate(null);
    setErrorMessage(null);
    resetToNulls();
  }

  const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth - 1));
  const leadingBlanks = getDay(new Date(currentYear, currentMonth - 1, 1));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4" dir="ltr">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={isAtCurrentMonth}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="الشهر السابق"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-[#222222]" dir="rtl">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={isAtMaxMonth}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="الشهر التالي"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-full bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1" dir="rtl">
            {DAY_HEADERS.map((d, i) => (
              <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1" dir="rtl">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = toDateKey(currentYear, currentMonth, day);
              const dateObj = new Date(currentYear, currentMonth - 1, day);

              const isPast = dateObj < today;
              const isBlocked = blockedDates.includes(dateKey);
              const isCheckIn = dateKey === checkInDate;
              const isCheckOut = dateKey === checkOutDate;
              const isInRange =
                !!checkInDate &&
                !!checkOutDate &&
                dateKey > checkInDate &&
                dateKey < checkOutDate;
              const isToday = dateKey === todayKey;

              let stateClasses = "";
              let clickable = false;
              if (isPast) {
                stateClasses = "text-gray-300 cursor-not-allowed";
              } else if (isBlocked) {
                stateClasses = "bg-red-100 text-red-400 line-through cursor-not-allowed";
              } else if (isCheckIn) {
                stateClasses = "bg-[#F5A623] text-white rounded-l-full";
                clickable = true;
              } else if (isCheckOut) {
                stateClasses = "bg-[#F5A623] text-white rounded-r-full";
                clickable = true;
              } else if (isInRange) {
                stateClasses = "bg-orange-100 cursor-pointer";
                clickable = true;
              } else {
                stateClasses = "bg-white hover:bg-orange-50 cursor-pointer";
                clickable = true;
              }

              return (
                <button
                  type="button"
                  key={dateKey}
                  disabled={!clickable}
                  onClick={() => handleDateClick(dateKey, isPast, isBlocked)}
                  className={`aspect-square flex items-center justify-center text-sm transition-colors ${stateClasses} ${
                    isToday ? "underline" : ""
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {errorMessage && (
        <p className="mt-3 text-sm text-red-500 font-medium">{errorMessage}</p>
      )}

      <div className="mt-3">
        {checkInDate && checkOutDate ? (
          <p className="text-[#F5A623] font-bold">
            {`${nights} ليالٍ · ${totalPrice.toLocaleString("ar-SA")} ريال`}
          </p>
        ) : checkInDate ? (
          <p className="text-gray-500">اختر تاريخ المغادرة</p>
        ) : (
          <p className="text-gray-500">اختر تاريخ الوصول</p>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span>⬜ متاح</span>
        <span>🟥 محجوز</span>
        <span>🟧 محدد</span>
      </div>
    </div>
  );
}

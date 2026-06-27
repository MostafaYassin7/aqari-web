"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";

interface Props {
  listingId: string;
}

export default function OpenInApp({ listingId }: Props) {
  const [showFallback, setShowFallback] = useState(false);
  const deepLink = `aqar://listings/${listingId}`;

  function handleOpen() {
    const start = Date.now();
    window.location.href = deepLink;
    setTimeout(() => {
      if (Date.now() - start < 2000) setShowFallback(true);
    }, 1500);
  }

  if (showFallback) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <p className="text-xs text-center text-gray-500">التطبيق غير مثبّت. حمّله الآن:</p>
        <div className="flex gap-2">
          <a
            href="#"
            className="flex-1 text-center text-xs font-semibold border border-[#222222] text-[#222222] py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            App Store
          </a>
          <a
            href="#"
            className="flex-1 text-center text-xs font-semibold border border-[#222222] text-[#222222] py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Google Play
          </a>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      className="flex items-center justify-center gap-2 border-2 border-[#222222] text-[#222222] font-bold py-3.5 px-4 rounded-2xl hover:bg-gray-50 transition-colors w-full"
    >
      <Smartphone size={18} />
      افتح في التطبيق
    </button>
  );
}

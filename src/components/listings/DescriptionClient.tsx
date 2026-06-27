"use client";

import { useState } from "react";

export default function DescriptionClient({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 300;
  const displayed = isLong && !expanded ? text.slice(0, 300) + "..." : text;

  return (
    <div>
      <h2 className="text-lg font-bold text-[#222222] mb-3">عن العقار</h2>
      <p className="text-[#717171] leading-relaxed text-sm whitespace-pre-wrap">{displayed}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[#F5A623] font-semibold text-sm hover:text-[#E09400] transition-colors"
        >
          {expanded ? "عرض أقل" : "عرض المزيد"}
        </button>
      )}
    </div>
  );
}

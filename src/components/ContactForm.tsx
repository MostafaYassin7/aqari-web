"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate send (no backend)
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
    setLoading(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#222222] mb-1.5">
          {t("name")}
        </label>
        <input
          type="text"
          required
          placeholder={t("placeholder_name")}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#222222] mb-1.5">
          {t("email")}
        </label>
        <input
          type="email"
          required
          placeholder={t("placeholder_email")}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition-all"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#222222] mb-1.5">
          {t("message")}
        </label>
        <textarea
          required
          rows={5}
          placeholder={t("placeholder_message")}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition-all resize-none"
        />
      </div>

      {status === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          ✓ {t("success")}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Send size={18} />
        )}
        {t("send")}
      </button>
    </form>
  );
}

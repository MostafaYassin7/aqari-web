import { getTranslations } from "next-intl/server";

export default async function DownloadCTA() {
  const t = await getTranslations("cta");

  return (
    <section id="download" className="py-20 sm:py-28 bg-[#F5A623] relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
          {t("title")}
        </h2>
        <p className="text-lg sm:text-xl text-white/85 mb-12 max-w-xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* App Store */}
          <a
            href="#"
            className="flex items-center gap-3 bg-white text-[#222222] px-7 py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-xl w-full sm:w-auto justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#222222] shrink-0">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.2 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-start">
              <div className="text-xs text-gray-500 leading-none mb-1">
                {t("comingSoon")}
              </div>
              <div className="text-base font-bold leading-none">App Store</div>
            </div>
          </a>

          {/* Google Play */}
          <a
            href="#"
            className="flex items-center gap-3 bg-[#222222] text-white px-7 py-4 rounded-2xl hover:bg-black transition-all shadow-xl w-full sm:w-auto justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white shrink-0">
              <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-3.56-3.56L3.18 23.76zM20.65 9.05l-2.37-1.36-3.97 3.97 3.97 3.97 2.39-1.37c.68-.39 1.13-1.11 1.13-1.95 0-.84-.45-1.55-1.15-1.95v-.31zm-17.5-6.8c-.04.14-.06.29-.06.46v18.58c0 .17.02.32.06.46l12.65-12.65L3.15 2.25zM13.22 12l-9.04 9.04-.99.19c.3.17.64.24.99.2l9.04-9.04-3.56-3.56 3.56 3.17z" />
            </svg>
            <div className="text-start">
              <div className="text-xs text-white/70 leading-none mb-1">
                {t("comingSoon")}
              </div>
              <div className="text-base font-bold leading-none">Google Play</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

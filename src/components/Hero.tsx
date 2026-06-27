import { getTranslations } from "next-intl/server";
import PhoneMockup from "./PhoneMockup";

export default async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-20 sm:pt-24 sm:pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F5A623]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#F5A623]/6 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#F5A623]/10 text-[#E09400] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
              {t("badge")}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#222222] leading-tight mb-6">
              {t("title")}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#717171] leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
              {t("subtitle")}
            </p>

            {/* Download buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <a
                href="#"
                id="download"
                className="group flex items-center gap-3 bg-[#222222] hover:bg-black text-white px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.2 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-start">
                  <div className="text-[10px] opacity-75 leading-none mb-0.5">
                    {t("comingSoon")}
                  </div>
                  <div className="text-sm font-bold leading-none">
                    App Store
                  </div>
                </div>
              </a>

              <a
                href="#"
                className="group flex items-center gap-3 bg-[#F5A623] hover:bg-[#E09400] text-white px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-3.56-3.56L3.18 23.76zM20.65 9.05l-2.37-1.36-3.97 3.97 3.97 3.97 2.39-1.37c.68-.39 1.13-1.11 1.13-1.95 0-.84-.45-1.55-1.15-1.95v-.31zm-17.5-6.8c-.04.14-.06.29-.06.46v18.58c0 .17.02.32.06.46l12.65-12.65L3.15 2.25zM13.22 12l-9.04 9.04-.99.19c.3.17.64.24.99.2l9.04-9.04-3.56-3.56 3.56 3.17z" />
                </svg>
                <div className="text-start">
                  <div className="text-[10px] opacity-85 leading-none mb-0.5">
                    {t("comingSoon")}
                  </div>
                  <div className="text-sm font-bold leading-none">
                    Google Play
                  </div>
                </div>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-10 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="text-[#F5A623]">✓</span>
                <span>مرخّص من هيئة العقار</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#F5A623]">✓</span>
                <span>آمن ومشفّر</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#F5A623]">✓</span>
                <span>مجاني للمشترين</span>
              </div>
            </div>
          </div>

          {/* Phone mockups */}
          <div className="flex-1 flex justify-center items-end gap-4 lg:gap-6">
            <div className="translate-y-6">
              <PhoneMockup index={0} />
            </div>
            <div className="-translate-y-4 hidden sm:block">
              <PhoneMockup index={1} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

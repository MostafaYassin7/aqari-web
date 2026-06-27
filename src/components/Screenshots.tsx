import { getTranslations } from "next-intl/server";
import PhoneMockup from "./PhoneMockup";

export default async function Screenshots() {
  const t = await getTranslations("screenshots");

  return (
    <section className="py-20 sm:py-28 bg-[#222222] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Phones row */}
        <div className="flex items-end justify-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`shrink-0 ${
                i === 1 || i === 2 ? "-translate-y-6" : "translate-y-0"
              }`}
            >
              <PhoneMockup index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

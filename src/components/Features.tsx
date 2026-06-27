import { getTranslations } from "next-intl/server";
import { Search, MessageCircle, Wallet, Star, BarChart3, BadgeCheck } from "lucide-react";

const featureIcons = [Search, MessageCircle, Wallet, Star, BarChart3, BadgeCheck];
const featureKeys = ["search", "chat", "wallet", "promotions", "crm", "licensed"] as const;
const featureColors = [
  "bg-blue-50 text-blue-600",
  "bg-green-50 text-green-600",
  "bg-[#F5A623]/10 text-[#E09400]",
  "bg-purple-50 text-purple-600",
  "bg-indigo-50 text-indigo-600",
  "bg-emerald-50 text-emerald-600",
];

export default async function Features() {
  const t = await getTranslations("features");

  return (
    <section className="py-20 sm:py-28 bg-[#F9F9F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-[#222222] mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-[#717171] max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[i];
            return (
              <div
                key={key}
                className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${featureColors[i]}`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#222222] mb-2">
                  {t(`${key}.title`)}
                </h3>
                <p className="text-[#717171] text-sm leading-relaxed">
                  {t(`${key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

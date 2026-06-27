import { getTranslations } from "next-intl/server";
import { Home, Briefcase, Users, CalendarDays, Building2 } from "lucide-react";

const userIcons = [Home, Briefcase, Users, CalendarDays, Building2];
const userKeys = ["owners", "brokers", "buyers", "hosts", "developers"] as const;
const userEmoji = ["🏠", "🤝", "👤", "🌙", "🏗️"];

export default async function UserTypes() {
  const t = await getTranslations("users");

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-[#222222] mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-[#717171]">{t("subtitle")}</p>
        </div>

        {/* User type cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {userKeys.map((key, i) => {
            const Icon = userIcons[i];
            return (
              <div
                key={key}
                className="group flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:border-[#F5A623]/50 hover:bg-[#F5A623]/5 transition-all cursor-default"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center mb-4 group-hover:bg-[#F5A623]/20 transition-colors">
                  <Icon size={28} className="text-[#F5A623]" />
                </div>
                <h3 className="text-base font-bold text-[#222222] mb-2">
                  {t(`${key}.title`)}
                </h3>
                <p className="text-sm text-[#717171] leading-relaxed">
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

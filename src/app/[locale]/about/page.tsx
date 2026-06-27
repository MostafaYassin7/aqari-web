import { getTranslations } from "next-intl/server";
import PageShell from "@/components/PageShell";
import { Shield, Eye, Lightbulb } from "lucide-react";

export async function generateMetadata() {
  return { title: "من نحن | أقورا" };
}

const valueIcons = [Shield, Eye, Lightbulb];
const valueKeys = ["trust", "transparency", "innovation"] as const;

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-[#222222] mb-4">
            {t("title")}
          </h1>
          <div className="h-1 w-16 bg-[#F5A623] rounded-full mx-auto" />
        </div>

        {/* Mission */}
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#222222] mb-4">
            {t("mission.title")}
          </h2>
          <p className="text-[#717171] leading-relaxed text-lg">
            {t("mission.text")}
          </p>
        </div>

        {/* Story */}
        <div className="bg-[#F9F9F9] rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-[#222222] mb-4">
            {t("story.title")}
          </h2>
          <p className="text-[#717171] leading-relaxed">
            {t("story.text")}
          </p>
        </div>

        {/* Values */}
        <h2 className="text-2xl font-bold text-[#222222] mb-8 text-center">
          {t("values.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {valueKeys.map((key, i) => {
            const Icon = valueIcons[i];
            return (
              <div
                key={key}
                className="bg-white border border-gray-100 rounded-2xl p-7 text-center shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={26} className="text-[#F5A623]" />
                </div>
                <h3 className="text-lg font-bold text-[#222222] mb-2">
                  {t(`values.${key}.title`)}
                </h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  {t(`values.${key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-[#222222] mb-3">
            {t("contact.title")}
          </h3>
          <a
            href={`mailto:${t("contact.email")}`}
            className="inline-flex items-center gap-2 text-[#F5A623] font-semibold text-lg hover:text-[#E09400] transition-colors"
          >
            📧 {t("contact.email")}
          </a>
        </div>
      </div>
    </PageShell>
  );
}

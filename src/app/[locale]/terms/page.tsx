import { getTranslations } from "next-intl/server";
import PageShell from "@/components/PageShell";

export async function generateMetadata() {
  return { title: "الشروط والأحكام | أقورا" };
}

export default async function TermsPage() {
  const t = await getTranslations("terms");

  const listSections = ["usage", "listings", "payments", "prohibited"] as const;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-[#222222] mb-3">{t("title")}</h1>
          <p className="text-sm text-[#717171]">{t("lastUpdated")}</p>
          <div className="mt-4 h-1 w-16 bg-[#F5A623] rounded-full" />
        </div>

        <p className="text-base text-[#717171] leading-relaxed mb-12">
          {t("intro")}
        </p>

        <div className="space-y-10">
          {listSections.map((key) => (
            <section key={key} className="bg-[#F9F9F9] rounded-2xl p-7">
              <h2 className="text-xl font-bold text-[#222222] mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#F5A623] rounded-full inline-block" />
                {t(`sections.${key}.title`)}
              </h2>
              <ul className="space-y-3">
                {(t.raw(`sections.${key}.items`) as string[]).map(
                  (item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-[#717171]">
                      <span className="mt-1 text-[#F5A623] shrink-0">•</span>
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </section>
          ))}

          {/* Termination */}
          <section className="bg-[#F9F9F9] rounded-2xl p-7">
            <h2 className="text-xl font-bold text-[#222222] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#F5A623] rounded-full inline-block" />
              {t("sections.termination.title")}
            </h2>
            <p className="text-[#717171] text-sm leading-relaxed">
              {t("sections.termination.text")}
            </p>
          </section>

          {/* Governing law */}
          <section className="bg-amber-50 border border-amber-100 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-[#222222] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#F5A623] rounded-full inline-block" />
              {t("sections.law.title")}
            </h2>
            <p className="text-[#717171] text-sm leading-relaxed">
              {t("sections.law.text")}
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

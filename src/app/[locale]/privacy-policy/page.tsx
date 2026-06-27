import { getTranslations } from "next-intl/server";
import PageShell from "@/components/PageShell";

export async function generateMetadata() {
  return { title: "سياسة الخصوصية | أقورا" };
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("privacy");

  const sections = [
    { key: "collect", items: true },
    { key: "use", items: true },
    { key: "third", items: true },
    { key: "rights", items: true },
  ] as const;

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
          {sections.map(({ key }) => (
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

          {/* Contact */}
          <section className="bg-[#F9F9F9] rounded-2xl p-7">
            <h2 className="text-xl font-bold text-[#222222] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#F5A623] rounded-full inline-block" />
              {t("sections.contact.title")}
            </h2>
            <p className="text-[#717171] text-sm mb-3">
              {t("sections.contact.text")}
            </p>
            <a
              href="mailto:yazeed@aqora.sa"
              className="text-[#F5A623] font-semibold hover:text-[#E09400] transition-colors"
            >
              yazeed@aqora.sa
            </a>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

import { getTranslations } from "next-intl/server";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/ContactForm";
import { Mail, MessageCircle } from "lucide-react";

export async function generateMetadata() {
  return { title: "اتصل بنا | أقورا" };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-black text-[#222222] mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-[#717171]">{t("subtitle")}</p>
          <div className="mt-5 h-1 w-16 bg-[#F5A623] rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact channels */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xl font-bold text-[#222222]">
              {t("channels.title")}
            </h2>

            <a
              href="mailto:yazeed@aqora.sa"
              className="flex items-center gap-4 p-5 bg-[#F9F9F9] hover:bg-[#F5A623]/10 border border-gray-100 hover:border-[#F5A623]/30 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 bg-[#F5A623]/15 rounded-xl flex items-center justify-center shrink-0">
                <Mail size={22} className="text-[#F5A623]" />
              </div>
              <div>
                <div className="text-xs text-[#717171] mb-0.5">
                  {t("channels.email")}
                </div>
                <div className="font-semibold text-[#222222] group-hover:text-[#F5A623] transition-colors text-sm">
                  yazeed@aqora.sa
                </div>
              </div>
            </a>

            <a
              href="https://wa.me/966"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 bg-[#F9F9F9] hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle size={22} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs text-[#717171] mb-0.5">
                  {t("channels.whatsapp")}
                </div>
                <div className="font-semibold text-[#222222] group-hover:text-green-600 transition-colors text-sm">
                  WhatsApp
                </div>
              </div>
            </a>

            <div className="p-5 bg-[#F5A623]/8 border border-[#F5A623]/20 rounded-2xl">
              <p className="text-sm text-[#717171] leading-relaxed">
                نرد على جميع الاستفسارات خلال 24 ساعة في أيام العمل.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

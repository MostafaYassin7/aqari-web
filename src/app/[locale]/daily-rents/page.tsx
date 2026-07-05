import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingsClient from "@/components/listings/ListingsClient";
import { useTranslations } from "next-intl";

export default function DailyRentsPage() {
  const t = useTranslations("dailyRents");

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col">
        <div className="bg-white border-b border-gray-100 py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-black text-[#222222]">{t("title")}</h1>
            <p className="text-sm text-[#717171] mt-1">{t("subtitle")}</p>
          </div>
        </div>
        <ListingsClient forcedListingType="rent_short" hideListingType={true} hrefBase="/daily-rents" />
      </main>
      <Footer />
    </>
  );
}

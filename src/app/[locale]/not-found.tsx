import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
        <p className="text-8xl font-black text-[#F5A623] mb-4">404</p>
        <h1 className="text-2xl font-bold text-[#222222] mb-3">الصفحة غير موجودة</h1>
        <p className="text-[#717171] mb-8 max-w-sm">
          العقار الذي تبحث عنه غير متاح أو تم حذفه.
        </p>
        <Link
          href="/listings"
          className="bg-[#F5A623] hover:bg-[#E09400] text-white font-bold px-8 py-3 rounded-2xl transition-colors"
        >
          تصفح العقارات
        </Link>
      </main>
      <Footer />
    </>
  );
}

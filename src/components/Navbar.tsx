"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import Image from "next/image";

const navLinks = [
  { key: "home", href: "/" },
  { href: "/listings", label: "العقارات" },
  { href: "/daily-rents", label: "الإيجار اليومي" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
];

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isLoggedIn, user, logout } = useAuthStore();

  function toggleLocale() {
    router.replace(pathname, { locale: locale === "ar" ? "en" : "ar" });
  }

  async function handleLogout() {
    logout();
    import('@/lib/socket').then(({ disconnectChatSocket }) => disconnectChatSocket()).catch(() => {});
    setDropdownOpen(false);
    router.push("/");
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const avatarContent = user?.profilePhoto ? (
    <Image
      src={user.profilePhoto}
      alt={user.name ?? ""}
      width={36}
      height={36}
      className="rounded-full object-cover"
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center text-white font-bold text-sm select-none">
      {user?.name?.charAt(0) ?? "؟"}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-black text-[#F5A623] tracking-tight">
            أقورا
          </span>
          <span className="hidden sm:block text-xs text-gray-400 border-l border-gray-200 pl-2 ml-1 leading-tight">
            Aqora
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-gray-600 hover:text-[#F5A623] transition-colors font-medium"
              >
                {"label" in link ? link.label : t(link.key as Parameters<typeof t>[0])}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-[#F5A623] hover:text-[#F5A623] transition-all font-medium"
          >
            {locale === "ar" ? "EN" : "عربي"}
          </button>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full hover:ring-2 hover:ring-[#F5A623]/40 transition-all"
              >
                {avatarContent}
                <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50" dir="rtl">
                  <Link
                    href="/account/my-ads"
                    className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-gray-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    إعلاناتي
                  </Link>
                  <Link
                    href="/account/favorites"
                    className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-gray-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    المفضلة
                  </Link>
                  <Link
                    href="/account/wallet"
                    className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-gray-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    المحفظة
                  </Link>
                  <Link
                    href="/account/chat"
                    className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-gray-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    المحادثات
                  </Link>
                  <Link
                    href="/account/profile"
                    className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-gray-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    حسابي
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-full border border-[#F5A623] text-[#F5A623] hover:bg-orange-50 transition-all font-medium"
              >
                تسجيل الدخول
              </Link>
              <a
                href="#download"
                className="hidden sm:inline-flex items-center gap-1 bg-[#F5A623] hover:bg-[#E09400] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
              >
                {t("download")}
              </a>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-gray-700 hover:text-[#F5A623] font-medium py-1"
              onClick={() => setOpen(false)}
            >
              {"label" in link ? link.label : t(link.key as Parameters<typeof t>[0])}
            </Link>
          ))}
          {isLoggedIn ? (
            <>
              <Link href="/account/my-ads" className="text-base text-gray-700 hover:text-[#F5A623] font-medium py-1" onClick={() => setOpen(false)}>إعلاناتي</Link>
              <Link href="/account/favorites" className="text-base text-gray-700 hover:text-[#F5A623] font-medium py-1" onClick={() => setOpen(false)}>المفضلة</Link>
              <Link href="/account/wallet" className="text-base text-gray-700 hover:text-[#F5A623] font-medium py-1" onClick={() => setOpen(false)}>المحفظة</Link>
              <Link href="/account/chat" className="text-base text-gray-700 hover:text-[#F5A623] font-medium py-1" onClick={() => setOpen(false)}>المحادثات</Link>
              <Link href="/account/profile" className="text-base text-gray-700 hover:text-[#F5A623] font-medium py-1" onClick={() => setOpen(false)}>حسابي</Link>
              <button onClick={() => { handleLogout(); setOpen(false); }} className="text-right text-base text-red-500 font-medium py-1">تسجيل الخروج</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-base text-[#F5A623] font-semibold py-1" onClick={() => setOpen(false)}>تسجيل الدخول</Link>
              <a href="#download" className="mt-2 inline-flex justify-center bg-[#F5A623] hover:bg-[#E09400] text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors" onClick={() => setOpen(false)}>{t("download")}</a>
            </>
          )}
        </div>
      )}
    </header>
  );
}

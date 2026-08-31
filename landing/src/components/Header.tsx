import { Languages } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export function Header() {
  const { t, lang, toggleLang } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-white">C</span>
          ClubHub
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-black/70 md:flex">
          <a href="#product" className="hover:text-ink">
            {t.header.product}
          </a>
          <a href="#security" className="hover:text-ink">
            {t.header.security}
          </a>
          <a href="#customers" className="hover:text-ink">
            {t.header.customers}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-black/5"
            aria-label={lang === "en" ? "Ver em português" : "View in English"}
          >
            <Languages size={16} />
            {lang === "en" ? "PT" : "EN"}
          </button>
          <a
            href="#contact"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            {t.header.cta}
          </a>
        </div>
      </div>
    </header>
  );
}

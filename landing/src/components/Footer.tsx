import { useLanguage } from "../i18n/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-black/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-black/50 sm:flex-row">
        <div className="flex items-center gap-2 font-bold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs text-white">
            C
          </span>
          ClubHub
        </div>
        <p>
          &copy; {new Date().getFullYear()} ClubHub. {t.footer.tagline}
        </p>
      </div>
    </footer>
  );
}

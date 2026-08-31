import { useLanguage } from "../i18n/LanguageContext";

export function Hero() {
  const { t } = useLanguage();

  return (
    <>
      <section id="top" className="hero-grid relative overflow-hidden px-6 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm font-medium text-primary-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t.hero.badge}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-6xl">{t.hero.title}</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-black/60 md:text-xl">{t.hero.subtitle}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#contact"
              className="w-full rounded-full bg-primary px-7 py-3.5 text-center font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark sm:w-auto"
            >
              {t.hero.ctaPrimary}
            </a>
            <a
              href="#product"
              className="w-full rounded-full border border-black/10 px-7 py-3.5 text-center font-semibold text-ink transition hover:bg-black/5 sm:w-auto"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-black/[0.02] px-6 py-8">
        <p className="mx-auto max-w-3xl text-center text-sm font-medium text-black/50">{t.hero.painPoint}</p>
      </section>
    </>
  );
}

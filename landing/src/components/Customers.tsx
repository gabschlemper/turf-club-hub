import { useLanguage } from "../i18n/LanguageContext";

export function Customers() {
  const { t } = useLanguage();
  const [before, after] = t.customers.text.split(t.customers.clubName);

  return (
    <section id="customers" className="px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm font-medium text-primary-dark">
          {t.customers.badge}
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t.customers.title}</h2>
        <p className="mt-6 text-xl text-black/70">
          {before}
          <span className="font-semibold text-ink">{t.customers.clubName}</span>
          {after}
        </p>
      </div>
    </section>
  );
}

import { useLanguage } from "../i18n/LanguageContext";
import { SECURITY_KEYS } from "../i18n/translations";

export function Security() {
  const { t } = useLanguage();

  return (
    <section id="security" className="bg-ink px-6 py-24 text-white">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80">
            {t.security.badge}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t.security.title}</h2>
          <p className="mt-4 text-lg text-white/60">{t.security.subtitle}</p>
        </div>
        <div className="space-y-5">
          {SECURITY_KEYS.map((key) => {
            const point = t.security.points[key];
            return (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-bold">{point.title}</h3>
                <p className="mt-1.5 text-white/60">{point.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

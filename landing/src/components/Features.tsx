import { Users, CheckCircle2, Calendar, Repeat, Wallet, ShieldCheck, type LucideIcon } from "lucide-react";
import { FadeUp } from "./FadeUp";
import { useLanguage } from "../i18n/LanguageContext";
import { FEATURE_KEYS } from "../i18n/translations";

const ICONS: Record<(typeof FEATURE_KEYS)[number], LucideIcon> = {
  athletes: Users,
  attendance: CheckCircle2,
  events: Calendar,
  rotation: Repeat,
  finance: Wallet,
  roles: ShieldCheck,
};

export function Features() {
  const { t } = useLanguage();

  return (
    <section id="product" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t.features.title}</h2>
          <p className="mt-4 text-lg text-black/60">{t.features.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((key) => {
            const Icon = ICONS[key];
            const item = t.features.items[key];
            return (
              <FadeUp key={key}>
                <div className="h-full rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-black/60">{item.description}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

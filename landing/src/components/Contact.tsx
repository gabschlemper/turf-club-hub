import { useLanguage } from "../i18n/LanguageContext";

const CONTACT_EMAIL = "gabschlemper@gmail.com";

export function Contact() {
  const { t } = useLanguage();

  return (
    <section id="contact" className="border-t border-black/5 bg-primary-light px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t.contact.title}</h2>
        <p className="mt-4 text-lg text-black/60">{t.contact.subtitle}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-8 inline-block rounded-full bg-primary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
        >
          {t.contact.cta}
        </a>
      </div>
    </section>
  );
}

import { LanguageProvider } from "./i18n/LanguageContext";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Security } from "./components/Security";
import { Customers } from "./components/Customers";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <LanguageProvider>
      <div className="bg-white text-ink antialiased">
        <Header />
        <main>
          <Hero />
          <Features />
          <Security />
          <Customers />
          <Contact />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}

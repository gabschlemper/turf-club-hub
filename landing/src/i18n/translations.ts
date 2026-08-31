export type Lang = "en" | "pt";

const FEATURE_KEYS = [
  "athletes",
  "attendance",
  "events",
  "rotation",
  "finance",
  "roles",
] as const;

const SECURITY_KEYS = ["isolation", "login", "permissions"] as const;

export const translations = {
  en: {
    header: {
      product: "Product",
      security: "Security",
      customers: "Customers",
      cta: "Get in touch",
    },
    hero: {
      badge: "Live in production",
      title: "Stop running your club on spreadsheets and group chats.",
      subtitle:
        "ClubHub is the all-in-one platform for athlete management, attendance, events, duty rotations, and finances — built for how real clubs actually run, not bent into shape from generic scheduling software.",
      ctaPrimary: "Get in touch",
      ctaSecondary: "See what it does",
      painPoint:
        "Every club hits the same wall: attendance lives in someone's notebook, nobody can say who's behind on dues, and duty rotations get remembered by a WhatsApp message calling someone out.",
    },
    features: {
      title: "Everything your club needs, in one system",
      subtitle: "One login for athletes, coaches, and admins — instead of five disconnected tools.",
      items: {
        athletes: {
          title: "Athlete management",
          description: "Registration, categories, and a full history for every athlete in the club.",
        },
        attendance: {
          title: "Attendance & performance",
          description:
            "A weighted points system tracks mandatory vs. optional sessions, attendance rate, and progress toward each athlete's yearly goal.",
        },
        events: {
          title: "Events & calendar",
          description: "Schedule training sessions and club events, with athlete confirmation built in.",
        },
        rotation: {
          title: "Duty rotation",
          description: "Automated rotation scheduling for recurring club responsibilities — no more manual reminders.",
        },
        finance: {
          title: "Finance",
          description: "Dues, debts, and financial reporting per athlete and per club — always up to date.",
        },
        roles: {
          title: "Roles & audit log",
          description:
            "Athlete, club admin, and super admin roles — each scoped to what they should see — with a full audit trail of admin actions.",
        },
      },
    },
    security: {
      badge: "Multi-tenant by design",
      title: "Built on real security, not an afterthought",
      subtitle:
        "ClubHub was architected from day one to host multiple clubs on shared infrastructure without any risk of data crossing between them.",
      points: {
        isolation: {
          title: "Data isolation by club",
          description:
            "Postgres Row-Level Security enforces that a club's data — athletes, events, attendance, finances — is never visible to another club, at the database layer.",
        },
        login: {
          title: "Login restricted to registered athletes",
          description:
            "Accounts not tied to a registered athlete are blocked at login, instead of landing in a broken or empty app.",
        },
        permissions: {
          title: "Tiered permissions",
          description:
            "Athlete, club admin, and super admin roles are enforced consistently across every table and query — not re-implemented per feature.",
        },
      },
    },
    customers: {
      badge: "In production, not a prototype",
      title: "Trusted by a real club",
      text: "ClubHub currently runs the day-to-day operations of Desterro Hóquei Clube — real athletes, real training sessions, real attendance data.",
      clubName: "Desterro Hóquei Clube",
    },
    contact: {
      title: "Ready to bring your club into one system?",
      subtitle: "Tell us about your club and we'll walk you through how ClubHub can replace the spreadsheets.",
      cta: "Get in Touch",
    },
    footer: {
      tagline: "Sports club management software.",
    },
  },
  pt: {
    header: {
      product: "Produto",
      security: "Segurança",
      customers: "Clientes",
      cta: "Fale conosco",
    },
    hero: {
      badge: "Em produção",
      title: "Chega de gerenciar seu clube com planilhas e grupos de WhatsApp.",
      subtitle:
        "O ClubHub é a plataforma completa para gestão de atletas, presenças, eventos, escalas de rodízio e finanças — feita para como os clubes realmente funcionam, não adaptada de um software de agendamento genérico.",
      ctaPrimary: "Fale conosco",
      ctaSecondary: "Veja o que ele faz",
      painPoint:
        "Todo clube enfrenta o mesmo problema: a presença fica anotada no caderno de alguém, ninguém consegue dizer rapidamente quem está com a mensalidade atrasada, e as escalas de rodízio só são lembradas quando alguém cobra no grupo do WhatsApp.",
    },
    features: {
      title: "Tudo que seu clube precisa, em um só sistema",
      subtitle: "Um único login para atletas, técnicos e administradores — em vez de cinco ferramentas desconectadas.",
      items: {
        athletes: {
          title: "Gestão de atletas",
          description: "Cadastro, categorias e histórico completo de cada atleta do clube.",
        },
        attendance: {
          title: "Presença e desempenho",
          description:
            "Um sistema de pontos ponderado acompanha treinos obrigatórios e opcionais, taxa de presença e o progresso até a meta anual de cada atleta.",
        },
        events: {
          title: "Eventos e calendário",
          description: "Agende treinos e eventos do clube, com confirmação de presença integrada.",
        },
        rotation: {
          title: "Rodízio de tarefas",
          description: "Escalas de rodízio automáticas para responsabilidades recorrentes do clube — sem mais lembretes manuais.",
        },
        finance: {
          title: "Financeiro",
          description: "Mensalidades, débitos e relatórios financeiros por atleta e por clube — sempre atualizados.",
        },
        roles: {
          title: "Permissões e auditoria",
          description:
            "Perfis de atleta, admin do clube e super admin — cada um vendo apenas o que deve — com um registro completo das ações administrativas.",
        },
      },
    },
    security: {
      badge: "Multi-tenant por design",
      title: "Construído sobre segurança de verdade, não um detalhe posterior",
      subtitle:
        "O ClubHub foi arquitetado desde o início para hospedar vários clubes em uma infraestrutura compartilhada sem nenhum risco de dados se misturarem entre eles.",
      points: {
        isolation: {
          title: "Isolamento de dados por clube",
          description:
            "Row-Level Security do Postgres garante que os dados de um clube — atletas, eventos, presenças, finanças — nunca fiquem visíveis para outro clube, na camada do banco de dados.",
        },
        login: {
          title: "Login restrito a atletas cadastrados",
          description:
            "Contas não vinculadas a um atleta cadastrado são bloqueadas no login, em vez de caírem em um app quebrado ou vazio.",
        },
        permissions: {
          title: "Permissões em camadas",
          description:
            "Os perfis de atleta, admin do clube e super admin são aplicados de forma consistente em todas as tabelas e consultas — não reimplementados a cada funcionalidade.",
        },
      },
    },
    customers: {
      badge: "Em produção, não um protótipo",
      title: "Já é a confiança de um clube de verdade",
      text: "O ClubHub roda hoje a operação do dia a dia do Desterro Hóquei Clube — atletas reais, treinos reais, dados reais de presença.",
      clubName: "Desterro Hóquei Clube",
    },
    contact: {
      title: "Pronto para colocar seu clube em um só sistema?",
      subtitle: "Conte um pouco sobre o seu clube e mostramos como o ClubHub pode substituir as planilhas.",
      cta: "Fale conosco",
    },
    footer: {
      tagline: "Software de gestão para clubes esportivos.",
    },
  },
} satisfies Record<Lang, unknown>;

export type Translations = typeof translations.en;
export { FEATURE_KEYS, SECURITY_KEYS };

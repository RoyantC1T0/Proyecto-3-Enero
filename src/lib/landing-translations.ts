// Landing page translations
export const landingTranslations = {
  en: {
    // Header
    signIn: "Sign In",
    getStarted: "Get Started",

    // Hero
    heroTitle: "Take Control of Your",
    heroTitleHighlight: "Finances",
    heroDescription:
      "Track income, expenses, and savings goals with voice commands. Beautiful charts, multi-currency support, and a minimalist design.",
    startFree: "Start Free",

    // Features
    featuresTitle: "Everything You Need",
    featuresDescription:
      "Powerful features to help you understand and improve your financial health",

    voiceCommandsTitle: "Voice Commands - coming soon",
    voiceCommandsDescription:
      "Add transactions by simply speaking. Say 'Gasté 5000 pesos en el super' and we'll do the rest.",

    visualReportsTitle: "Visual Reports",
    visualReportsDescription:
      "Beautiful charts and graphs to understand your spending patterns and trends.",

    savingsGoalsTitle: "Savings Goals",
    savingsGoalsDescription:
      "Set and track savings goals with progress visualization and contribution tracking.",

    multiCurrencyTitle: "Multi-Currency",
    multiCurrencyDescription:
      "Support for USD, ARS, and EUR with automatic exchange rate conversion.",

    secureTitle: "Secure",
    secureDescription:
      "Your data is encrypted and protected. We never share your financial information.",

    mobileReadyTitle: "Mobile Ready",
    mobileReadyDescription:
      "Access your finances from any device with our fully responsive design.",

    // CTA
    ctaTitle: "Ready to Get Started?",
    ctaDescription:
      "Join thousands of users who have taken control of their finances with Minimalist Wealth.",
    createFreeAccount: "Create Free Account",

    // Footer
    allRightsReserved: "All rights reserved.",
  },
  es: {
    // Header
    signIn: "Iniciar Sesión",
    getStarted: "Comenzar",

    // Hero
    heroTitle: "Toma el Control de tus",
    heroTitleHighlight: "Finanzas",
    heroDescription:
      "Registra ingresos, gastos y metas de ahorro con comandos de voz. Gráficos hermosos, soporte multi-moneda y un diseño minimalista.",
    startFree: "Comenzar Gratis",

    // Features
    featuresTitle: "Todo lo que Necesitas",
    featuresDescription:
      "Funciones poderosas para entender y mejorar tu salud financiera",

    voiceCommandsTitle: "Comandos de Voz - próximamente",
    voiceCommandsDescription:
      "Agrega transacciones simplemente hablando. Decí 'Gasté 5000 pesos en el super' y nosotros hacemos el resto.",

    visualReportsTitle: "Reportes Visuales",
    visualReportsDescription:
      "Gráficos hermosos para entender tus patrones de gasto y tendencias.",

    savingsGoalsTitle: "Metas de Ahorro",
    savingsGoalsDescription:
      "Establecé y seguí metas de ahorro con visualización de progreso y seguimiento de aportes.",

    multiCurrencyTitle: "Multi-Moneda",
    multiCurrencyDescription:
      "Soporte para USD, ARS y EUR con conversión automática de tipo de cambio.",

    secureTitle: "Seguro",
    secureDescription:
      "Tus datos están encriptados y protegidos. Nunca compartimos tu información financiera.",

    mobileReadyTitle: "Listo para Móviles",
    mobileReadyDescription:
      "Accedé a tus finanzas desde cualquier dispositivo con nuestro diseño responsivo.",

    // CTA
    ctaTitle: "¿Listo para Comenzar?",
    ctaDescription:
      "Unite a miles de usuarios que tomaron el control de sus finanzas con Minimalist Wealth.",
    createFreeAccount: "Crear Cuenta Gratis",

    // Footer
    allRightsReserved: "Todos los derechos reservados.",
  },
} as const;

export type Language = keyof typeof landingTranslations;
export type TranslationKey = keyof typeof landingTranslations.en;

export function getTranslation(lang: Language, key: TranslationKey): string {
  return landingTranslations[lang][key] || landingTranslations.en[key];
}

export function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const browserLang = navigator.language.toLowerCase();

  // Check if browser language starts with 'es' (Spanish)
  if (browserLang.startsWith("es")) {
    return "es";
  }

  // Default to English
  return "en";
}

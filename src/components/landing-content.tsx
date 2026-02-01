"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowRight,
  Mic,
  BarChart3,
  PiggyBank,
  TrendingUp,
  Shield,
  Smartphone,
  Globe,
} from "lucide-react";
import {
  landingTranslations,
  Language,
  detectBrowserLanguage,
} from "@/lib/landing-translations";

export default function LandingContent() {
  const [lang, setLang] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Detect browser language on mount
    const detectedLang = detectBrowserLanguage();
    setLang(detectedLang);
    setMounted(true);
  }, []);

  const t = landingTranslations[lang];

  // Prevent hydration mismatch by showing loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="animate-pulse">
          <Wallet className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Minimalist Wealth</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="flex items-center gap-1"
            >
              <Globe className="h-4 w-4" />
              {lang.toUpperCase()}
            </Button>
            <Link href="/login">
              <Button variant="ghost">{t.signIn}</Button>
            </Link>
            <Link href="/register">
              <Button>{t.getStarted}</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            {t.heroTitle}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t.heroTitleHighlight}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                {t.startFree}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t.signIn}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t.featuresTitle}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.featuresDescription}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Mic className="h-6 w-6" />}
            title={t.voiceCommandsTitle}
            description={t.voiceCommandsDescription}
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title={t.visualReportsTitle}
            description={t.visualReportsDescription}
          />
          <FeatureCard
            icon={<PiggyBank className="h-6 w-6" />}
            title={t.savingsGoalsTitle}
            description={t.savingsGoalsDescription}
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title={t.multiCurrencyTitle}
            description={t.multiCurrencyDescription}
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title={t.secureTitle}
            description={t.secureDescription}
          />
          <FeatureCard
            icon={<Smartphone className="h-6 w-6" />}
            title={t.mobileReadyTitle}
            description={t.mobileReadyDescription}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">{t.ctaTitle}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            {t.ctaDescription}
          </p>
          <Link href="/register">
            <Button size="lg">
              {t.createFreeAccount}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-semibold">Minimalist Wealth</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Minimalist Wealth.{" "}
            {t.allRightsReserved}
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

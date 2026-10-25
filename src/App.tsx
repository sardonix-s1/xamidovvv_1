import { useEffect } from 'react';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { InterestsSection } from './components/InterestsSection';
import { Navigation } from './components/Navigation';
import { ProjectsSection } from './components/ProjectsSection';
import { QuoteSection } from './components/QuoteSection';
import { SceneCanvas } from './components/SceneCanvas';
import { SkillsSection } from './components/SkillsSection';
import { useActiveSection } from './hooks/useActiveSection';
import { useI18n } from './i18n/I18nProvider';

export function App() {
  const { t } = useI18n();
  const active = useActiveSection();

  // The CSS atmosphere (glow position and strength) follows the active section.
  useEffect(() => {
    document.body.dataset.mood = active;
  }, [active]);

  return (
    <>
      <a className="skip" href="#main">
        {t.nav.skip}
      </a>

      <div className="atmosphere" aria-hidden="true" />
      <ErrorBoundary fallback={<div className="scene-fallback" aria-hidden="true" />}>
        <SceneCanvas section={active} />
      </ErrorBoundary>

      <Navigation active={active} />

      <main id="main">
        <HeroSection />
        <QuoteSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <InterestsSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}

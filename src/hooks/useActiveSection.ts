import { useEffect, useState } from 'react';
import { SECTION_IDS, type SectionId } from '../config/site';

/**
 * Tracks which section sits in the middle band of the viewport.
 * Drives the navigation highlight and the scene's atmosphere.
 */
export function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>('hero');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return active;
}

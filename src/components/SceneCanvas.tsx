import { useEffect, useRef, useState } from 'react';
import type { SectionId } from '../config/site';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SceneEngine } from '../scene/engine';

interface Props {
  section: SectionId;
}

/**
 * Decorative background. aria-hidden, never receives pointer events, and if the
 * canvas can't start the CSS atmosphere behind it (see global.css) carries the look.
 */
export function SceneCanvas({ section }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Create the engine once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: SceneEngine;
    try {
      const compact =
        window.matchMedia('(max-width: 760px)').matches ||
        window.matchMedia('(pointer: coarse)').matches;
      engine = new SceneEngine({ canvas, compact, reducedMotion: reducedRef.current });
    } catch (error) {
      console.warn('Scene disabled:', error);
      setFailed(true);
      return;
    }
    engineRef.current = engine;
    engine.setMood(sectionRef.current, true);

    const onResize = () => engine.resize();
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      engine.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) engine.setPointer(null, null);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      engine.setScroll(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onVisibility = () => (document.hidden ? engine.stop() : engine.start());

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mouseout', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    onScroll();
    engine.start();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mouseout', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setMood(section);
  }, [section]);

  useEffect(() => {
    engineRef.current?.setReducedMotion(reduced);
  }, [reduced]);

  if (failed) return <div className="scene-fallback" aria-hidden="true" />;
  return <canvas ref={canvasRef} className="scene" aria-hidden="true" />;
}

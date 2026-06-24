"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "decomp-academy-progress-v1";

export interface Progress {
  /** lessonId -> best match percent achieved (100 = solved). */
  solved: Record<string, number>;
}

function read(): Progress {
  if (typeof window === "undefined") return { solved: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { solved: {} };
    const parsed = JSON.parse(raw);
    return { solved: parsed.solved || {} };
  } catch {
    return { solved: {} };
  }
}

function write(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota errors */
  }
  window.dispatchEvent(new Event("decomp-progress"));
}

export function recordResult(lessonId: string, percent: number) {
  const p = read();
  const prev = p.solved[lessonId] ?? 0;
  if (percent > prev) {
    p.solved[lessonId] = percent;
    write(p);
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>({ solved: {} });

  useEffect(() => {
    setProgress(read());
    const handler = () => setProgress(read());
    window.addEventListener("decomp-progress", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("decomp-progress", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isSolved = useCallback(
    (id: string) => (progress.solved[id] ?? 0) >= 100,
    [progress],
  );
  const bestPercent = useCallback(
    (id: string) => progress.solved[id] ?? 0,
    [progress],
  );

  return { progress, isSolved, bestPercent };
}

// Per-lesson saved code so the learner doesn't lose work between visits.
export function loadCode(lessonId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`decomp-code-${lessonId}`);
  } catch {
    return null;
  }
}
export function saveCode(lessonId: string, code: string) {
  try {
    localStorage.setItem(`decomp-code-${lessonId}`, code);
  } catch {
    /* ignore */
  }
}

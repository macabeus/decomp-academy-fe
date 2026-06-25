"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/auth/api";

// Legacy anonymous storage (kept as the signed-out backend + migration source).
const LEGACY_KEY = "decomp-academy-progress-v1";
const MIGRATED_KEY = "decomp-migrated-v1";
const CODE_PREFIX = "decomp-code-";
const codeKey = (id: string) => `${CODE_PREFIX}${id}`;

export interface LessonProgress {
  bestPercent: number; // 0–100, highest ever achieved (never decreases)
  completed: boolean; // bestPercent >= 100
  code?: string; // the learner's last saved C source
  updatedAt?: string;
}

type Lessons = Record<string, LessonProgress>;

// --- module singleton: one in-memory map shared by the hook + imperative API.
let lessons: Lessons = {};
let mode: "anon" | "authed" = "anon";
let ready = false;
// Synchronous local prime so the very first lesson load sees saved code/percent
// before the provider effect (which runs after child effects) has configured us.
let primed = false;

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("decomp-progress"));
  }
}

/* --------------------------------- local --------------------------------- */

function readLocal(): Lessons {
  if (typeof window === "undefined") return {};
  const out: Lessons = {};
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const solved: Record<string, number> = raw ? JSON.parse(raw).solved ?? {} : {};
    for (const [id, pct] of Object.entries(solved)) {
      out[id] = { bestPercent: pct, completed: pct >= 100 };
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(CODE_PREFIX)) continue;
      const id = k.slice(CODE_PREFIX.length);
      const existing = out[id] ?? { bestPercent: 0, completed: false };
      out[id] = { ...existing, code: localStorage.getItem(k) ?? undefined };
    }
  } catch {
    /* ignore */
  }
  return out;
}

function writeLocalBest(id: string, pct: number) {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const solved: Record<string, number> = raw ? JSON.parse(raw).solved ?? {} : {};
    solved[id] = pct;
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ solved }));
  } catch {
    /* ignore quota errors */
  }
}

function writeLocalCode(id: string, code: string) {
  try {
    localStorage.setItem(codeKey(id), code);
  } catch {
    /* ignore */
  }
}

function primeLocal() {
  if (primed || ready) return;
  lessons = readLocal();
  primed = true;
}

/* --------------------------------- server -------------------------------- */

// Debounced per-lesson code PUTs so autosave-on-keystroke doesn't hammer the API.
const codeTimers: Record<string, ReturnType<typeof setTimeout>> = {};
function putCodeServer(id: string, code: string) {
  clearTimeout(codeTimers[id]);
  codeTimers[id] = setTimeout(() => {
    api(`/progress/${id}`, { method: "PUT", body: JSON.stringify({ code }) }).catch(
      () => {},
    );
  }, 800);
}

function putBestServer(id: string, bestPercent: number) {
  api(`/progress/${id}`, { method: "PUT", body: JSON.stringify({ bestPercent }) }).catch(
    () => {},
  );
}

/* ------------------------------- public API ------------------------------ */

export function recordResult(lessonId: string, percent: number) {
  primeLocal();
  const prev = lessons[lessonId]?.bestPercent ?? 0;
  if (percent <= prev) return; // bestPercent only moves up (server enforces this too)
  lessons[lessonId] = {
    ...lessons[lessonId],
    bestPercent: percent,
    completed: percent >= 100,
  };
  notify();
  if (mode === "authed") putBestServer(lessonId, percent);
  else writeLocalBest(lessonId, percent);
}

export function saveCode(lessonId: string, code: string) {
  primeLocal();
  const existing = lessons[lessonId] ?? { bestPercent: 0, completed: false };
  lessons[lessonId] = { ...existing, code };
  if (mode === "authed") putCodeServer(lessonId, code);
  else writeLocalCode(lessonId, code);
}

// Synchronous read of the learner's last saved code (from the hydrated map).
export function loadCode(lessonId: string): string | null {
  primeLocal();
  return lessons[lessonId]?.code ?? null;
}

export function totalSolved(): number {
  primeLocal();
  return Object.values(lessons).filter((l) => l.bestPercent >= 100).length;
}

/* ------------------------------ configuration ---------------------------- */
// Called by ProgressProvider as auth state resolves.

export function configureAnon() {
  mode = "anon";
  lessons = readLocal();
  primed = true;
  ready = true;
  notify();
}

export async function configureAuthed() {
  mode = "authed";
  const local = readLocal();

  let server: Lessons = {};
  try {
    const res = await api<{ lessons: Lessons }>("/progress");
    server = res.lessons ?? {};
  } catch {
    /* fall through with an empty server set */
  }

  const alreadyMigrated =
    typeof window !== "undefined" && localStorage.getItem(MIGRATED_KEY);

  if (!alreadyMigrated) {
    await Promise.all(
      Object.entries(local).map(async ([id, lp]) => {
        const s = server[id];
        const body: { bestPercent?: number; code?: string } = {};
        if (lp.bestPercent > (s?.bestPercent ?? 0)) body.bestPercent = lp.bestPercent;
        if (lp.code && !s?.code) body.code = lp.code;
        if (!Object.keys(body).length) return;
        const best = Math.max(s?.bestPercent ?? 0, body.bestPercent ?? 0);
        server[id] = {
          bestPercent: best,
          completed: best >= 100,
          code: body.code ?? s?.code,
          updatedAt: s?.updatedAt,
        };
        await api(`/progress/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }).catch(() => {});
      }),
    );
    try {
      localStorage.setItem(MIGRATED_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  lessons = server;
  primed = true;
  ready = true;
  notify();
}

/* --------------------------------- hook ---------------------------------- */

export function useProgress() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    primeLocal();
    setTick((n) => n + 1);
    const handler = () => setTick((n) => n + 1);
    window.addEventListener("decomp-progress", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("decomp-progress", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Keyed on `tick` so consumers' useMemo (e.g. MatchLog) re-runs when progress
  // changes — the callbacks must change identity, not just close over live data.
  const isSolved = useCallback(
    (id: string) => (lessons[id]?.bestPercent ?? 0) >= 100,
    [tick],
  );
  const bestPercent = useCallback((id: string) => lessons[id]?.bestPercent ?? 0, [tick]);

  return { isSolved, bestPercent, ready };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/auth/api";
import { LESSONS } from "@/lib/lessons/registry.client";

// Legacy anonymous storage (kept as the signed-out backend + migration source).
const LEGACY_KEY = "decomp-academy-progress-v1";
const CODE_PREFIX = "decomp-code-";
const codeKey = (id: string) => `${CODE_PREFIX}${id}`;

// Progress is keyed by a lesson's stable UUIDv5 (progressId) everywhere it's
// persisted or transmitted — never the human slug. Components still call us with
// the slug `lesson.id`; we translate here so they don't have to care. `resolveId`
// maps slug → progressId; `normalizeKeys` upgrades any legacy slug-keyed data
// (older localStorage / server rows) to the progressId keyspace on read.
const SLUG_TO_PID = new Map(LESSONS.map((l) => [l.id, l.progressId]));

function resolveId(id: string): string {
  return SLUG_TO_PID.get(id) ?? id;
}

function normalizeKeys(ls: Lessons): Lessons {
  const out: Lessons = {};
  for (const [k, v] of Object.entries(ls)) {
    const id = SLUG_TO_PID.get(k) ?? k; // legacy slug → progressId; else unchanged
    const prev = out[id];
    if (!prev) {
      out[id] = v;
      continue;
    }
    // A legacy slug row and its progressId row can coexist mid-migration — fold
    // them: highest score wins, prefer whichever already has code.
    const best = Math.max(prev.bestPercent ?? 0, v.bestPercent ?? 0);
    out[id] = {
      bestPercent: best,
      completed: best >= 100,
      code: prev.code ?? v.code,
      updatedAt: prev.updatedAt ?? v.updatedAt,
    };
  }
  return out;
}

export interface LessonProgress {
  bestPercent: number; // 0–100, highest ever achieved (never decreases)
  completed: boolean; // bestPercent >= 100
  code?: string; // the learner's last saved C source
  updatedAt?: string;
}

type Lessons = Record<string, LessonProgress>;

// --- module singleton: one in-memory map shared by the hook + imperative API.
let lessons: Lessons = {};
// "loading" until auth resolves: writes during this window (e.g. the lesson's
// auto-run autosaving the seeded code) stay in memory only — never localStorage —
// so a signed-in learner doesn't leak a phantom local entry that later prompts a
// merge. configureAnon/configureAuthed flip us to the real backend.
let mode: "loading" | "anon" | "authed" = "loading";
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
  return normalizeKeys(out);
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

// Wipe the anonymous mirror once its contents have been reconciled onto the
// server, so a later sign-in on this device doesn't re-prompt over stale data.
function clearLocal() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_KEY);
    const codeKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CODE_PREFIX)) codeKeys.push(k);
    }
    codeKeys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
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
  const id = resolveId(lessonId);
  const prev = lessons[id]?.bestPercent ?? 0;
  if (percent <= prev) return; // bestPercent only moves up (server enforces this too)
  lessons[id] = {
    ...lessons[id],
    bestPercent: percent,
    completed: percent >= 100,
  };
  notify();
  if (mode === "authed") putBestServer(id, percent);
  else if (mode === "anon") writeLocalBest(id, percent);
  // "loading": in-memory only until auth resolves.
}

export function saveCode(lessonId: string, code: string) {
  primeLocal();
  const id = resolveId(lessonId);
  const existing = lessons[id] ?? { bestPercent: 0, completed: false };
  lessons[id] = { ...existing, code };
  if (mode === "authed") putCodeServer(id, code);
  else if (mode === "anon") writeLocalCode(id, code);
  // "loading": in-memory only until auth resolves.
}

// Synchronous read of the learner's last saved code (from the hydrated map).
export function loadCode(lessonId: string): string | null {
  primeLocal();
  return lessons[resolveId(lessonId)]?.code ?? null;
}

export function totalSolved(): number {
  primeLocal();
  return Object.values(lessons).filter((l) => l.bestPercent >= 100).length;
}

/* ---------------------------- reconciliation ----------------------------- */
// When a learner signs in with progress on this device *and* on their account,
// we don't silently pick a winner — we surface a choice (merge / keep this
// device / use account). The provider renders <ProgressMergeDialog/>, which
// reads the pending conflict via useReconcile() and calls resolve().

export type MergeStrategy = "merge" | "local" | "server";

let pending: {
  local: Lessons;
  server: Lessons;
  resolve: (s: MergeStrategy) => void;
} | null = null;

// Progress of the sequential upload that follows the learner's choice. Non-null
// only while we're draining the queue; the dialog reads it to draw its bar.
let sync: { done: number; total: number } | null = null;

function notifyReconcile() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("decomp-reconcile"));
  }
}

export function getReconcile(): { local: Lessons; server: Lessons } | null {
  return pending ? { local: pending.local, server: pending.server } : null;
}

export function getSync(): { done: number; total: number } | null {
  return sync;
}

// Open the conflict modal and resolve once the learner picks a strategy. We
// leave `pending` set so the dialog stays mounted for the upload phase;
// runConfigureAuthed clears it once finalize() has drained the queue.
function promptUser(local: Lessons, server: Lessons): Promise<MergeStrategy> {
  return new Promise((resolve) => {
    pending = { local, server, resolve };
    notifyReconcile();
  });
}

function hasData(ls: Lessons): boolean {
  return Object.values(ls).some(
    (l) => (l.bestPercent ?? 0) > 0 || (l.code != null && l.code !== ""),
  );
}

// Lossless union: the higher bestPercent always wins; prefer this device's code
// (the freshest edit here), falling back to the account's.
function mergeProgress(local: Lessons, server: Lessons): Lessons {
  const out: Lessons = {};
  for (const id of new Set([...Object.keys(local), ...Object.keys(server)])) {
    const l = local[id];
    const s = server[id];
    const best = Math.max(l?.bestPercent ?? 0, s?.bestPercent ?? 0);
    out[id] = {
      bestPercent: best,
      completed: best >= 100,
      code: l?.code ?? s?.code,
      updatedAt: s?.updatedAt,
    };
  }
  return out;
}

function sameProgress(a: Lessons, b: Lessons): boolean {
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if ((a[id]?.bestPercent ?? 0) !== (b[id]?.bestPercent ?? 0)) return false;
    if ((a[id]?.code ?? "") !== (b[id]?.code ?? "")) return false;
  }
  return true;
}

// Push every non-empty lesson up to the account — one PUT at a time, so we
// don't flood the API (concurrent fan-out was getting us 503s). Returns true
// iff all PUTs landed; we only clear the local mirror on a clean upload.
async function pushAll(
  ls: Lessons,
  onProgress?: (done: number, total: number) => void,
): Promise<boolean> {
  const entries = Object.entries(ls).filter(
    ([, l]) => (l.bestPercent ?? 0) > 0 || (l.code != null && l.code !== ""),
  );
  let ok = true;
  onProgress?.(0, entries.length);
  for (let i = 0; i < entries.length; i++) {
    const [id, l] = entries[i];
    const body: { bestPercent?: number; code?: string } = {};
    if ((l.bestPercent ?? 0) > 0) body.bestPercent = l.bestPercent;
    if (l.code) body.code = l.code;
    try {
      await api(`/progress/${id}`, { method: "PUT", body: JSON.stringify(body) });
    } catch {
      ok = false;
    }
    onProgress?.(i + 1, entries.length);
  }
  return ok;
}

async function finalize(
  result: Lessons,
  opts: {
    push: boolean;
    clear?: boolean;
    onProgress?: (done: number, total: number) => void;
  },
) {
  const pushedOk = opts.push ? await pushAll(result, opts.onProgress) : true;
  lessons = result;
  primed = true;
  ready = true;
  if (opts.clear !== false && pushedOk) clearLocal();
  notify();
}

/* ------------------------------ configuration ---------------------------- */
// Called by ProgressProvider as auth state resolves.

export function configureAnon() {
  mode = "anon";
  authInflight = null;
  if (pending || sync) {
    pending = null;
    sync = null;
    notifyReconcile();
  }
  lessons = readLocal();
  primed = true;
  ready = true;
  notify();
}

// Guard against the effect firing twice (StrictMode / re-renders) launching two
// reconciliations. Reset in configureAnon so a sign-out → sign-in still runs.
let authInflight: Promise<void> | null = null;

export function configureAuthed(): Promise<void> {
  if (authInflight) return authInflight;
  authInflight = runConfigureAuthed();
  return authInflight;
}

async function runConfigureAuthed() {
  mode = "authed";
  const local = readLocal();

  let server: Lessons = {};
  try {
    const res = await api<{ lessons: Lessons }>("/progress");
    // Upgrade any legacy slug-keyed rows to the progressId keyspace so they line
    // up with `local` (also normalized) and with the keys we PUT going forward.
    server = normalizeKeys(res.lessons ?? {});
  } catch {
    // Couldn't reach the account: keep the local view rather than blank it, and
    // don't clear local — there's nothing to safely reconcile against.
    await finalize(local, { push: false, clear: false });
    return;
  }

  // Nothing local to lose → adopt the account (the signed-in source of truth).
  if (!hasData(local)) {
    await finalize(server, { push: false, clear: false });
    return;
  }
  // Empty account → first-time upload, no conflict worth a prompt.
  if (!hasData(server)) {
    await finalize(mergeProgress(local, server), { push: true });
    return;
  }
  // Already in sync → nothing to choose.
  if (sameProgress(local, server)) {
    await finalize(server, { push: false });
    return;
  }

  // Genuine divergence → let the learner decide.
  const strategy = await promptUser(local, server);
  const result =
    strategy === "server"
      ? server
      : strategy === "local"
        ? local
        : mergeProgress(local, server);
  const push = strategy !== "server";

  // Keep the dialog mounted through the upload so it can show a progress bar;
  // tear it down only once the queue has drained.
  await finalize(result, {
    push,
    onProgress: (done, total) => {
      sync = { done, total };
      notifyReconcile();
    },
  });
  pending = null;
  sync = null;
  notifyReconcile();
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
    (id: string) => (lessons[resolveId(id)]?.bestPercent ?? 0) >= 100,
    [tick],
  );
  const bestPercent = useCallback(
    (id: string) => lessons[resolveId(id)]?.bestPercent ?? 0,
    [tick],
  );

  return { isSolved, bestPercent, ready };
}

// Subscribes to the pending sign-in conflict (if any). The dialog renders when
// `reconcile` is non-null and calls `resolve` with the learner's choice.
export function useReconcile() {
  const [state, setState] = useState(() => ({
    reconcile: getReconcile(),
    sync: getSync(),
  }));
  useEffect(() => {
    const handler = () => setState({ reconcile: getReconcile(), sync: getSync() });
    window.addEventListener("decomp-reconcile", handler);
    return () => window.removeEventListener("decomp-reconcile", handler);
  }, []);
  const resolve = useCallback((s: MergeStrategy) => pending?.resolve(s), []);
  return { reconcile: state.reconcile, sync: state.sync, resolve };
}

import { NextResponse } from "next/server";
import { LESSONS } from "@/lib/lessons/registry";
import { getTarget } from "@/lib/lessons/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

// Dev/QA endpoint: compile every lesson's authoritative reference solution and
// report which ones fail (broken solution, wrong symbol name, etc.).
export async function GET() {
  const results: { id: string; ok: boolean; count?: number; error?: string }[] = [];
  // Bounded concurrency so we don't spawn hundreds of compilers at once.
  const CONCURRENCY = 6;
  let i = 0;
  async function worker() {
    while (i < LESSONS.length) {
      const lesson = LESSONS[i++];
      try {
        const t = await getTarget(lesson);
        results.push({
          id: lesson.id,
          ok: t.ok,
          count: t.instructions?.length,
          error: t.ok ? undefined : t.error,
        });
      } catch (e) {
        results.push({ id: lesson.id, ok: false, error: String(e) });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const ordered = LESSONS.map((l) => results.find((r) => r.id === l.id)!);
  const failures = ordered.filter((r) => !r.ok);
  return NextResponse.json({
    total: ordered.length,
    passed: ordered.length - failures.length,
    failed: failures.length,
    failures,
  });
}

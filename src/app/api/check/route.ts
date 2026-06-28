import { NextRequest, NextResponse } from "next/server";
import { checkLesson } from "@/lib/lessons/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { course?: string; lesson?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.course || !body.lesson || typeof body.code !== "string") {
    return NextResponse.json(
      { ok: false, error: "Missing course, lesson id, or code." },
      { status: 400 },
    );
  }
  if (body.code.length > 20000) {
    return NextResponse.json({ ok: false, error: "Code too long." }, { status: 413 });
  }
  const result = await checkLesson(body.course, body.lesson, body.code);
  return NextResponse.json(result);
}

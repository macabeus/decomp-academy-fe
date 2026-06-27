import { chaptersWithLessons, LESSONS, TIERS } from "@/lib/lessons/registry";
import { SITE_URL } from "@/lib/seo";

// Served at /llms.txt — a plain-text, AI-friendly map of the whole site, built
// from the live curriculum so it never drifts. Follows the llms.txt convention:
// an H1 title, a blockquote summary, prose, then linked sections.
export const dynamic = "force-static";

export function GET() {
  const chapters = chaptersWithLessons().filter((c) => c.lessons.length > 0);
  const tiers = [...TIERS].sort((a, b) => a.order - b.order);
  const first = LESSONS[0];
  const lines: string[] = [];

  lines.push("# Decomp Academy", "");
  lines.push(
    "> Decomp Academy is a free, interactive course that teaches you to " +
      "decompile GameCube (PowerPC) assembly back into byte-matching C, graded " +
      "live by the real Metrowerks CodeWarrior GC/2.0 compiler (mwcceppc.exe).",
    "",
  );
  lines.push(
    'Decomp Academy teaches "matching decompilation": you read the PowerPC ' +
      "assembly the retail compiler produced, write C, and the real 2001 " +
      "Metrowerks CodeWarrior GC/2.0 compiler compiles and diffs your code " +
      "against the target instruction by instruction. When every byte matches, " +
      "the function is solved. The curriculum takes you from never having read a " +
      "register to matching real Star Fox Adventures functions.",
    "",
  );
  lines.push(
    "- Audience: programmers learning reverse engineering and decompilation, " +
      "contributors to GameCube/Wii decompilation projects, and anyone curious " +
      "how C compiles down to PowerPC.",
    `- Format: ${LESSONS.length} hands-on lessons across ${tiers.length} tiers, ` +
      "in the browser, free, with no signup required to start.",
    "- Topics: PowerPC (Gekko) assembly, the PowerPC EABI, MWCC GC/2.0 code " +
      "generation, integer/float/bitwise idioms, stack frames, globals, the " +
      "optimizer, and complete real-game functions.",
    "",
  );

  lines.push("## Key pages");
  if (first) {
    lines.push(
      `- [Start the course](${SITE_URL}/lesson/${first.id}): the first lesson, from zero.`,
    );
  }
  lines.push(
    `- [Playground](${SITE_URL}/playground): compile arbitrary C with MWCC GC/2.0 and inspect the assembly it produces.`,
    `- [Glossary](${SITE_URL}/glossary): definitions of the PowerPC, ABI, and compiler terms used throughout.`,
    "",
  );

  lines.push("## Curriculum");
  for (const t of tiers) {
    lines.push("", `### ${t.title} — ${t.blurb}`);
    const tierChapters = chapters
      .filter((c) => c.tier === t.id)
      .sort((a, b) => a.order - b.order);
    for (const c of tierChapters) {
      lines.push("", `#### ${c.title} — ${c.blurb}`);
      for (const l of c.lessons) {
        const tag = l.concepts?.length ? ` — ${l.concepts.join(", ")}` : "";
        lines.push(`- [${l.title}](${SITE_URL}/lesson/${l.id})${tag}`);
      }
    }
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

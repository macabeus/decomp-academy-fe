import Link from "next/link";
import { IconCpu, IconBrandGithub } from "@tabler/icons-react";
import { chaptersWithLessons, LESSONS } from "@/lib/lessons/registry";
import { CurriculumMap } from "@/components/CurriculumMap";
import { Hero } from "@/components/Hero";

export default function Home() {
  // Slim the payload: the map only needs lesson metadata, never briefs/solutions.
  const chapters = chaptersWithLessons()
    .filter((c) => c.lessons.length > 0)
    .map((c) => ({
      id: c.id,
      title: c.title,
      blurb: c.blurb,
      order: c.order,
      lessons: c.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        difficulty: l.difficulty,
        concepts: l.concepts,
        concept: l.concept ?? false,
      })),
    }));
  const total = LESSONS.length;
  const firstLesson = LESSONS[0];

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15">
            <IconCpu size={17} className="text-accent" />
          </div>
          <span className="font-bold tracking-tight text-[#e6ebf2]">Decomp Academy</span>
          <span className="ml-1 hidden rounded bg-bg-softer px-1.5 py-0.5 text-[10px] font-medium text-[#8b97a6] sm:inline">
            MWCC GC/2.0
          </span>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="#curriculum" className="text-[#aab4c2] transition hover:text-[#e6ebf2]">
              Curriculum
            </Link>
            {firstLesson && (
              <Link
                href={`/lesson/${firstLesson.id}`}
                className="rounded-md bg-accent/10 px-3 py-1.5 font-medium text-accent transition hover:bg-accent/20"
              >
                Start
              </Link>
            )}
          </div>
        </div>
      </nav>
      <Hero total={total} firstLessonId={firstLesson?.id} />
      <section id="curriculum" className="mx-auto max-w-5xl scroll-mt-16 px-5 pb-24 pt-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-[#f0f3f8]">The Curriculum</h2>
          <Link
            href={firstLesson ? `/lesson/${firstLesson.id}` : "#"}
            className="text-sm text-accent hover:underline"
          >
            Jump back in →
          </Link>
        </div>
        <CurriculumMap chapters={chapters} />
      </section>
      <footer className="border-t border-line bg-bg-soft/40">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-[#8b97a6] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <IconCpu size={15} className="text-accent" />
            <span>
              <span className="font-semibold text-[#c4cdd9]">Decomp Academy</span> · graded live by the
              real Metrowerks CodeWarrior GC/2.0 compiler.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>{total} lessons</span>
            <a
              href="https://decomp.dev/zcanann/SFA-Decomp"
              className="inline-flex items-center gap-1.5 transition hover:text-[#c4cdd9]"
              target="_blank"
              rel="noreferrer"
            >
              <IconBrandGithub size={15} /> SFA-Decomp
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adjacentLessons, getLesson, LESSONS } from "@/lib/lessons/registry";
import { CHAPTER_BY_ID } from "@/curriculum/chapters";
import { renderMarkdown, stripMarkdown } from "@/lib/markdown";
import { LessonWorkspace, LessonDTO } from "@/components/LessonWorkspace";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, lessonLd, SITE_URL } from "@/lib/seo";

// Pre-render every lesson at build time (the data is fully static, from the
// curriculum registry) so each page ships as crawlable, indexable HTML.
export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

// Per-lesson title + description, so all 254 lessons are distinct to search
// engines instead of inheriting the generic site-wide metadata.
export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const lesson = getLesson(params.id);
  if (!lesson) return {};

  const chapter = CHAPTER_BY_ID.get(lesson.chapter);
  const chapterTitle = chapter?.title ?? lesson.chapter;
  const kind = lesson.concept ? "concept" : "exercise";
  const description = stripMarkdown(lesson.brief);
  const url = `${SITE_URL}/lesson/${lesson.id}`;

  return {
    title: `${lesson.title} — ${chapterTitle}`,
    description,
    keywords: lesson.concepts,
    alternates: { canonical: `/lesson/${lesson.id}` },
    openGraph: {
      type: "article",
      title: `${lesson.title} — ${chapterTitle} · Decomp Academy`,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${lesson.title} · Decomp Academy`,
      description,
    },
    other: { "decomp:lesson-type": kind },
  };
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const lesson = getLesson(params.id);
  if (!lesson) notFound();

  const { prev, next } = adjacentLessons(lesson.id);
  const chapter = CHAPTER_BY_ID.get(lesson.chapter);
  const chapterTitle = chapter?.title ?? lesson.chapter;

  const dto: LessonDTO = {
    id: lesson.id,
    title: lesson.title,
    chapterId: lesson.chapter,
    chapterTitle,
    difficulty: lesson.difficulty,
    concepts: lesson.concepts,
    briefHtml: renderMarkdown(lesson.brief),
    concept: lesson.concept ?? false,
    symbol: lesson.symbol,
    starter: lesson.starter,
    solution: lesson.solution,
    hints: lesson.hints,
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
  };

  return (
    <>
      <JsonLd
        data={[
          lessonLd({
            id: lesson.id,
            title: lesson.title,
            description: stripMarkdown(lesson.brief),
            concepts: lesson.concepts,
            difficulty: lesson.difficulty,
            concept: lesson.concept ?? false,
          }),
          breadcrumbLd([
            { name: "Decomp Academy", url: SITE_URL },
            { name: chapterTitle, url: `${SITE_URL}/#curriculum` },
            { name: lesson.title, url: `${SITE_URL}/lesson/${lesson.id}` },
          ]),
        ]}
      />
      <LessonWorkspace lesson={dto} />
    </>
  );
}

// Centralized SEO constants and JSON-LD (schema.org) builders. These feed both
// the per-page <JsonLd> structured data and the metadata in each route, so the
// facts a search engine or an AI assistant reads stay in one place.

import { GlossaryEntry } from "./glossary";

export const SITE_URL = "https://decomp-academy.dev";
export const SITE_NAME = "Decomp Academy";
export const GITHUB_URL = "https://github.com/JackPriceBurns/decomp-academy-fe";

export const SITE_DESCRIPTION =
  "Learn to decompile GameCube PowerPC assembly into byte-matching C, graded " +
  "live by the real Metrowerks CodeWarrior GC/2.0 compiler. Free, interactive lessons.";

const ORGANIZATION = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/png/icon-512.png`,
  sameAs: [GITHUB_URL],
} as const;

export function organizationLd() {
  return { "@context": "https://schema.org", ...ORGANIZATION };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
  };
}

/** The whole curriculum, as a free online Course. Drives Google's Course rich
 *  result and gives AI assistants a one-shot summary of what the site teaches. */
export function courseLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Decomp Academy — Learn GameCube Decompilation",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    provider: ORGANIZATION,
    inLanguage: "en",
    isAccessibleForFree: true,
    educationalLevel: "Beginner to Advanced",
    about: [
      "Decompilation",
      "Reverse engineering",
      "PowerPC assembly",
      "GameCube",
    ],
    teaches: [
      "Reading PowerPC (Gekko) assembly",
      "Matching decompilation",
      "Metrowerks CodeWarrior GC/2.0 (MWCC) code generation",
      "The PowerPC EABI",
      "C programming",
    ],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT40H",
    },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

/** A single lesson, as a free LearningResource that is part of the Course. */
export function lessonLd(args: {
  id: string;
  title: string;
  description: string;
  concepts: string[];
  difficulty: number;
  concept: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: args.title,
    url: `${SITE_URL}/lesson/${args.id}`,
    description: args.description,
    learningResourceType: args.concept ? "concept" : "exercise",
    educationalLevel: `Difficulty ${args.difficulty}/5`,
    teaches: args.concepts,
    inLanguage: "en",
    isAccessibleForFree: true,
    provider: ORGANIZATION,
    isPartOf: {
      "@type": "Course",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/** Home > … > page trail for the breadcrumb rich result. */
export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** The glossary, as a DefinedTermSet — each acronym a deep-linkable DefinedTerm. */
export function definedTermSetLd(entries: GlossaryEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Decompilation Glossary",
    url: `${SITE_URL}/glossary`,
    description:
      "Plain-English definitions of the PowerPC, ABI, and compiler terms used " +
      "when decompiling GameCube code.",
    hasDefinedTerm: entries.map((e) => ({
      "@type": "DefinedTerm",
      name: e.term,
      description: `${e.full} — ${e.desc}`,
      url: `${SITE_URL}/glossary#${e.term}`,
      inDefinedTermSet: `${SITE_URL}/glossary`,
    })),
  };
}

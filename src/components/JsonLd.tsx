// Renders one or more schema.org JSON-LD objects as a <script> tag. Server-only
// (no "use client"), so the structured data is in the initial HTML that crawlers
// and AI assistants read without executing JavaScript.

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe inside a script tag; no user input flows here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// "Create scratch" — hand the current playground code off to decomp.me, the
// open-source decompilation workbench, as a real, shareable scratch.
//
// decomp.me's scratch API is anonymous and CORS-open (it reflects any Origin),
// so we POST straight from the browser. A server-to-server call would hit its
// Cloudflare bot challenge; a real browser passes it transparently, so this must
// run client-side. We upload the user's freshly compiled object as the scratch's
// target (multipart `target_obj`, so no assembler is needed) plus the same
// source, context and flags we compiled with — decomp.me recompiles the source
// with the same MWCC build, so the scratch opens matching and ready to fork.
//
// API verified against github.com/decompme/decomp.me. See https://decomp.me.

const DECOMPME_ORIGIN = "https://decomp.me";

// decomp.me's id for Metrowerks CodeWarrior "GC/2.0" (2.4.7 build 92), the same
// compiler this site grades with, on the GameCube / Wii platform.
export const DECOMPME_COMPILER = "mwcc_247_92";
export const DECOMPME_PLATFORM = "gc_wii";

// The codegen flags the compile service builds with (BASE_FLAGS in
// compiler/src/compile.rs), so decomp.me's recompile reproduces the uploaded
// object. `-maxerrors 1` is intentionally dropped: it only caps error output
// (no effect on codegen) and gets in the way once you start iterating there.
export const DECOMPME_FLAGS =
  "-nodefaults -proc gekko -align powerpc -enum int -fp hardware " +
  "-Cpp_exceptions off -O4,p -inline auto -nosyspath -RTTI off -fp_contract on -lang=c";

// The GameCube type/macro preamble the compile service injects for `withTypes`
// (TYPES_PREAMBLE in compiler/src/compile.rs). Sent as the scratch's context so
// decomp.me compiles exactly what we did. Keep byte-identical to the Rust copy.
export const TYPES_PREAMBLE = `typedef signed char s8;
typedef signed short s16;
typedef signed long s32;
typedef signed long long s64;
typedef unsigned char u8;
typedef unsigned short u16;
typedef unsigned long u32;
typedef unsigned long long u64;
typedef volatile u8 vu8;
typedef volatile u16 vu16;
typedef volatile u32 vu32;
typedef volatile s8 vs8;
typedef volatile s16 vs16;
typedef volatile s32 vs32;
typedef float f32;
typedef double f64;
typedef volatile f32 vf32;
typedef volatile f64 vf64;
typedef int BOOL;
#define TRUE 1
#define FALSE 0
#ifndef NULL
#define NULL 0
#endif
`;

function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return buf;
}

export interface ScratchResult {
  slug: string;
  url: string;
  /** Owner token returned only on create — lets a user later claim the scratch. */
  claimToken?: string;
}

/**
 * Create an anonymous decomp.me scratch from the playground's current state and
 * return its permalink. Throws with a human-readable message on failure.
 */
export async function createScratch(opts: {
  code: string;
  symbol: string;
  objBase64: string;
  context?: string;
}): Promise<ScratchResult> {
  const name = opts.symbol || "Decomp Academy scratch";
  const fd = new FormData();
  fd.append("compiler", DECOMPME_COMPILER);
  fd.append("platform", DECOMPME_PLATFORM);
  fd.append("compiler_flags", DECOMPME_FLAGS);
  fd.append("source_code", opts.code);
  fd.append("context", opts.context ?? TYPES_PREAMBLE);
  if (opts.symbol) fd.append("diff_label", opts.symbol);
  fd.append("name", name);
  const obj = b64ToArrayBuffer(opts.objBase64);
  fd.append(
    "target_obj",
    new Blob([obj], { type: "application/octet-stream" }),
    `${opts.symbol || "target"}.o`,
  );

  let res: Response;
  try {
    res = await fetch(`${DECOMPME_ORIGIN}/api/scratch`, { method: "POST", body: fd });
  } catch {
    throw new Error("Couldn't reach decomp.me. Check your connection and try again.");
  }
  if (!res.ok) {
    let detail = `decomp.me returned ${res.status}.`;
    try {
      const e = await res.json();
      detail = (e?.detail || e?.error || detail) as string;
    } catch {
      /* non-JSON error body (e.g. a Cloudflare challenge page) */
    }
    throw new Error(detail);
  }
  const data = await res.json();
  if (!data?.slug) throw new Error("decomp.me did not return a scratch id.");
  return {
    slug: data.slug as string,
    url: `${DECOMPME_ORIGIN}/scratch/${data.slug}`,
    claimToken: data.claim_token as string | undefined,
  };
}

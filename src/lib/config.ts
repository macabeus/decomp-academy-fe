import path from "node:path";

// Root of the SFA decompilation project, which ships the authoritative
// MWCC GC/2.0 toolchain (run through `wibo`) and the PowerPC binutils.
// Override with SFA_ROOT env var if the repo lives elsewhere.
export const SFA_ROOT =
  process.env.SFA_ROOT || path.resolve(process.cwd(), "..", "sfa");

export const WIBO = path.join(SFA_ROOT, "build", "tools", "wibo");
export const MWCC = path.join(SFA_ROOT, "build", "compilers", "GC", "2.0", "mwcceppc.exe");
export const OBJDUMP = path.join(SFA_ROOT, "build", "binutils", "powerpc-eabi-objdump");

// The canonical flags the SFA main library is built with (MWCC GC/2.0).
// `-O4,p` + gekko proc is what produces retail-matching code.
export const BASE_FLAGS: string[] = [
  "-nodefaults",
  "-proc", "gekko",
  "-align", "powerpc",
  "-enum", "int",
  "-fp", "hardware",
  "-Cpp_exceptions", "off",
  "-O4,p",
  "-inline", "auto",
  "-maxerrors", "1",
  "-nosyspath",
  "-RTTI", "off",
  "-fp_contract", "on",
  "-lang=c",
];

// A self-contained types preamble so lessons never depend on the game's
// header tree. Mirrors dolphin/types.h.
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

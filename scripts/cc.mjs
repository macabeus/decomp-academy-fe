#!/usr/bin/env node
// Standalone MWCC GC/2.0 compile + disassemble helper.
//
//   node scripts/cc.mjs <file.c> [symbol]
//   echo 'int add(int a,int b){return a+b;}' | node scripts/cc.mjs - add
//
// Prints the PowerPC disassembly (optionally just one symbol), or the compiler
// errors. Exit code 0 on success, 1 on failure. Used to verify that lesson
// reference solutions actually compile to the symbol they claim.

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SFA_ROOT = process.env.SFA_ROOT || path.resolve(process.cwd(), "..", "sfa");
const WIBO = path.join(SFA_ROOT, "build", "tools", "wibo");
const MWCC = path.join(SFA_ROOT, "build", "compilers", "GC", "2.0", "mwcceppc.exe");
const OBJDUMP = path.join(SFA_ROOT, "build", "binutils", "powerpc-eabi-objdump");

const FLAGS = [
  "-nodefaults", "-proc", "gekko", "-align", "powerpc", "-enum", "int",
  "-fp", "hardware", "-Cpp_exceptions", "off", "-O4,p", "-inline", "auto",
  "-maxerrors", "1", "-nosyspath", "-RTTI", "off", "-fp_contract", "on", "-lang=c",
];

const PREAMBLE = `typedef signed char s8;typedef signed short s16;typedef signed long s32;
typedef signed long long s64;typedef unsigned char u8;typedef unsigned short u16;
typedef unsigned long u32;typedef unsigned long long u64;typedef float f32;typedef double f64;
typedef volatile u8 vu8;typedef volatile u16 vu16;typedef volatile u32 vu32;
typedef volatile s8 vs8;typedef volatile s16 vs16;typedef volatile s32 vs32;
typedef volatile f32 vf32;typedef int BOOL;
#define TRUE 1
#define FALSE 0
#ifndef NULL
#define NULL 0
#endif
`;

const fileArg = process.argv[2];
const symbol = process.argv[3];
if (!fileArg) {
  console.error("usage: node scripts/cc.mjs <file.c|-> [symbol]");
  process.exit(2);
}

const src = fileArg === "-" ? readFileSync(0, "utf8") : readFileSync(fileArg, "utf8");
const dir = mkdtempSync(path.join(tmpdir(), "cc-"));
const cFile = path.join(dir, "u.c");
const oFile = path.join(dir, "u.o");
writeFileSync(cFile, PREAMBLE + "\n" + src + "\n");

try {
  try {
    execFileSync(WIBO, [MWCC, ...FLAGS, "-c", cFile, "-o", oFile], {
      cwd: SFA_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const out = (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
    try {
      readFileSync(oFile); // object may still exist despite nonzero exit
    } catch {
      console.error("COMPILE FAILED:\n" + out.trim());
      process.exit(1);
    }
  }
  const dump = execFileSync(OBJDUMP, ["-M", "gekko", "-drz", oFile], {
    cwd: SFA_ROOT,
  }).toString();

  if (!symbol) {
    console.log(dump);
  } else {
    const re = new RegExp(`<${symbol}>:[\\s\\S]*?(?=\\n[0-9a-f]{8} <|$)`);
    const m = dump.match(re);
    if (!m) {
      const syms = [...dump.matchAll(/<([^>]+)>:/g)].map((x) => x[1]);
      console.error(`symbol '${symbol}' not found. present: ${syms.join(", ")}`);
      process.exit(1);
    }
    console.log(m[0].trim());
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

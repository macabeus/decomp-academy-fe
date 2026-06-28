---
id: floats-double-add
title: Doubles Drop the 's'
difficulty: 2
concepts:
  - floating-point
  - double-precision
  - types
symbol: add_d
hints:
  - Double precision drops the `s` suffix.
  - "`a + b` on f64 becomes `fadd f1, f1, f2`."
---

# `f64` is double precision

Single precision is `f32`. Double precision is `f64`, the C `double`, and the hardware mirrors every float op in a second flavor *without* that trailing `s`. So `a + b` on `f64` operands lands on `fadd`, not `fadds`:

```asm
fadd f1, f1, f2    # f1 = a + b, double precision
blr
```

So `fadd`/`fmul`/`fsub`/`fdiv` handle doubles and `fadds`/`fmuls`/`fsubs`/`fdivs` handle singles. **One letter, and it pins down the operand type.** That little difference is gold when you're rebuilding the original C declarations from nothing but disassembly.

## Your task

Write `add_d` to compile to the `fadd` above.

<!-- starter -->
```c
f64 add_d(f64 a, f64 b) {
    return 0.0;
}
```

<!-- solution -->
```c
f64 add_d(f64 a, f64 b) {
    return a + b;
}
```

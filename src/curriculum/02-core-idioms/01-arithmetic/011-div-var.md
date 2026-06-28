---
id: arithmetic-div-var
title: Real Division
difficulty: 2
concepts:
  - arithmetic
  - divide
  - signed
symbol: div2
hints:
  - Dividing by a variable can't be reduced to shifts — it's a hardware divide.
  - The signed `int` type selects `divw` (an unsigned divide would use `divwu`).
---

# When it really is a divide

When the divisor is a *variable*, none of the shift tricks apply. The compiler
has to fall back on real hardware division, **`divw rD, rA, rB`** (signed divide
word):

```asm
divw r3, r3, r4
blr
```

Swap to unsigned operands and you'd get `divwu` instead. Nothing in the source
picks between them except the C types, which is one more case of *types decide
the instruction*.

## Your task

Write `div2` for signed `int`s to match the target.

<!-- starter -->
```c
int div2(int a, int b) {
    return 0;
}
```

<!-- solution -->
```c
int div2(int a, int b) {
    return a / b;
}
```

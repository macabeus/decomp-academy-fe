---
id: pointers-sum-two
title: Reading Two Elements and Combining Them
difficulty: 2
concepts:
  - loads
  - arrays
  - chaining
symbol: sum_two
hints:
  - Each element is its own load; the two loaded values then feed one arithmetic
    instruction.
  - Two `lwz` at different displacements, then a single combine into r3.
---

# Two loads feed one operation

Everything so far has read or written a *single* location. Real code rarely
stops there — it pulls several values out of an array and combines them. The
pattern is exactly what you would guess from stacking the earlier lessons: one
**load per element**, each at its own constant displacement, then an arithmetic
instruction that joins the loaded registers.

The loads come first because each must land in a register before the combine can
run. The displacements identify which elements were read — divide each by the
element size, just as in the constant-index lesson.

Consider `diff_two(q)`, which reads two `int`s from an array and subtracts the
first from the third:

```asm
lwz  r4, 0(r3)    # q[0]
lwz  r0, 8(r3)    # q[2]   (displacement 8 / 4 = index 2)
subf r3, r4, r0   # r0 - r4  =  q[2] - q[0]
blr
```

Two independent loads, then one `subf` (`subf rD, rA, rB` is `rB − rA`). The
displacements `0` and `8` name the elements; the combining instruction names the
operation. The target assembly uses the same two-loads-then-combine shape, but
read its displacements and its combining instruction to see which elements and
which operation it wants.

## Your task

Write `sum_two`, taking one `int*`, to reproduce the assembly above.

<!-- starter -->
```c
int sum_two(int* p) {
    return 0;
}
```

<!-- solution -->
```c
int sum_two(int* p) {
    return p[0] + p[1];
}
```

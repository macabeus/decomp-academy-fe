---
id: pointers-weighted-elements
title: Scaling One Element Before Combining
difficulty: 2
concepts:
  - loads
  - arrays
  - multiplication
  - chaining
symbol: weight
hints:
  - One loaded element is multiplied by a constant before being combined with
    another.
  - "Look for `mulli rD, rA, n` between the loads and the combine — the `n` is
    the literal multiplier."
---

# Pointer reads meet integer arithmetic

The values you pull out of an array are just integers once they are in registers,
so all the arithmetic idioms from the Integer Arithmetic chapter apply to them.
A common case: load an element, scale it by a constant, then fold in another
element. When the constant is not a power of two, the multiply shows up as
`mulli rD, rA, n` — *multiply low immediate* — with the multiplier sitting right
in the instruction. (A power-of-two constant would strength-reduce to `slwi`
instead, exactly as in the arithmetic lessons.)

Consider `blend(q)`, which reads three elements, scales the middle one by 5, and
combines all three:

```asm
lwz   r0, 4(r3)    # q[1]
lwz   r4, 0(r3)    # q[0]
mulli r0, r0, 5    # q[1] * 5
lwz   r3, 12(r3)   # q[3]   (displacement 12 / 4 = index 3)
add   r0, r4, r0   # q[0] + q[1]*5
subf  r3, r3, r0   # r0 - q[3]
blr
```

The loads gather the elements, `mulli` applies the constant scale, and the
`add`/`subf` thread the running total. Read each displacement to recover the
index and the `mulli` immediate to recover the multiplier. The target uses the
same load-scale-combine pattern with its own indices, multiplier, and combining
operation.

## Your task

Write `weight`, taking one `int*`, to reproduce the assembly above.

<!-- starter -->
```c
int weight(int* p) {
    return 0;
}
```

<!-- solution -->
```c
int weight(int* p) {
    return p[0] * 3 + p[2];
}
```

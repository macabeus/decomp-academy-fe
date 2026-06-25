---
id: pointers-deref-then-compute
title: Dereference, Then Compute With an Argument
difficulty: 3
concepts:
  - loads
  - arrays
  - multiplication
  - chaining
symbol: scaled_first
hints:
  - A loaded element is multiplied by a *register* argument, not a constant — so
    the multiply is `mullw`, not `mulli`.
  - The scalar arrives in r4; the pointer in r3. The product then combines with a
    second element.
---

# A loaded value and a scalar argument

So far the arithmetic applied to loaded elements has used *constants*. When a
loaded element is combined with a function *argument* instead, the multiply
becomes the full register-register form `mullw rD, rA, rB` rather than the
immediate `mulli`. This is the same distinction you saw in the arithmetic
chapter — constant operand versus variable operand — now sitting on top of a
dereference.

The order of work is: load the element(s), then run the arithmetic that mixes a
loaded value with the scalar in its argument register.

Consider `offset_first(q, n)`, which dereferences the pointer, adds the scalar
`n`, and subtracts a later element:

```asm
lwz  r0, 0(r3)    # *q   (q[0])
lwz  r3, 8(r3)    # q[2]
add  r0, r0, r4   # *q + n        (n is the argument in r4)
subf r3, r3, r0   # r0 - q[2]
blr
```

The scalar `n` lives in `r4` and joins the computation with an ordinary `add`;
no scaling is needed for an addition. The target assembly instead *multiplies*
a loaded element by its scalar argument — watch for `mullw` reading `r4` — before
combining with another element. Trace the registers to recover which element is
scaled and how the second element joins in.

## Your task

Write `scaled_first`, taking an `int*` and an `int`, to reproduce the assembly
above.

<!-- starter -->
```c
int scaled_first(int* p, int k) {
    return 0;
}
```

<!-- solution -->
```c
int scaled_first(int* p, int k) {
    return *p * k + p[1];
}
```

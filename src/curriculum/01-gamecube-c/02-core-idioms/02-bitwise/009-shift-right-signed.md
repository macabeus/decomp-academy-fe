---
id: bitwise-shift-right-signed
title: Arithmetic Right Shift (Signed)
difficulty: 3
concepts:
  - bitwise
  - shifts
  - signed
  - srawi
symbol: asr3
hints:
  - A signed right shift preserves the sign — use the algebraic shift.
  - "`x >> 3` on an s32 compiles to `srawi r3, r3, 3`."
  - The type, not the operator, picks `srawi` over `srwi`.
---

# `srawi` — shift right, fill with the sign

Shift a *signed* value right and the shift turns *arithmetic*. The high bits left
empty get backfilled with copies of the sign bit, which keeps a negative number
negative. PowerPC has a purpose-built opcode for that, `srawi`, the
shift-right-algebraic-word-immediate. Watch a signed value shifted right by 5:

```asm
srawi   r3,r3,5
blr
```

Note that this one is a genuine opcode, not an `rlwinm` in disguise, since a
rotate-and-mask simply can't manufacture sign extension. Nothing in the C
operator gives the choice away, because `>>` reads the same either way. The
operand's type is what settles it, `srwi` for a `u32` and `srawi` for an `s32`.

Once the shift *amount* becomes a variable rather than a constant, you move to
the register forms `sraw`/`srw`/`slw`, which the next lesson covers.

Two facts in the target tell you everything, the shift count next to `srawi` and
the parameter's declared type.

## Your task

Write `asr3` so it compiles to the `srawi` above.

<!-- starter -->
```c
s32 asr3(s32 x) {
    return 0;
}
```

<!-- solution -->
```c
s32 asr3(s32 x) {
    return x >> 3;
}
```

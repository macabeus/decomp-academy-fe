// Shape of a single PowerPC instruction as returned by the compile API's
// /target endpoint. The API parses and normalizes objdump output server-side;
// the frontend renders the target listing and diffs the object files via
// objdiff (see lib/objdiff), so it only needs this type.

export interface Instruction {
  /** Original mnemonic, e.g. "add", "stw", "bl". */
  mnemonic: string;
  /** Raw operand text as objdump printed it. */
  rawOperands: string;
  /** Canonical text used for equality, e.g. "add r3, r3, r4". */
  norm: string;
  /** Relocation symbol attached to this instruction, if any. */
  reloc?: string;
}

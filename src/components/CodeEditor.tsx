"use client";

import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useRef } from "react";
import { palette } from "@/lib/theme";

const hx = (c: string) => c.replace("#", "");

export function CodeEditor({
  value,
  onChange,
  onRun,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun?: () => void;
}) {
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  function handleMount(ed: editor.IStandaloneCodeEditor, monaco: Monaco) {
    const s = palette.syntax;
    monaco.editor.defineTheme("decomp", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: hx(s.comment), fontStyle: "italic" },
        { token: "keyword", foreground: hx(s.keyword) },
        { token: "type", foreground: hx(s.reg) },
        { token: "number", foreground: hx(s.num) },
        { token: "string", foreground: hx(s.str) },
        { token: "identifier", foreground: hx(s.ident) },
      ],
      colors: {
        "editor.background": palette.bg.inset,
        "editor.lineHighlightBackground": "#12171f",
        "editorLineNumber.foreground": palette.content.ghost,
        "editorLineNumber.activeForeground": palette.accent.DEFAULT,
        "editor.selectionBackground": "#2b3960",
        "editorCursor.foreground": palette.accent.DEFAULT,
        "editorIndentGuide.background1": palette.line.faint,
      },
    });
    monaco.editor.setTheme("decomp");
    ed.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => onRunRef.current?.(),
    );
  }

  return (
    <Editor
      height="100%"
      language="c"
      theme="decomp"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      options={{
        fontSize: 13,
        fontFamily: "var(--font-mono)",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 14, bottom: 14 },
        lineNumbersMinChars: 3,
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        tabSize: 4,
        automaticLayout: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        overviewRulerLanes: 0,
        bracketPairColorization: { enabled: true },
      }}
    />
  );
}

"use client";

import Editor, { Monaco } from "@monaco-editor/react";
import { useRef } from "react";

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

  function handleMount(editor: any, monaco: Monaco) {
    monaco.editor.defineTheme("decomp", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7686", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "type", foreground: "7ee787" },
        { token: "number", foreground: "79c0ff" },
        { token: "string", foreground: "a5d6ff" },
        { token: "identifier", foreground: "c9d1d9" },
      ],
      colors: {
        "editor.background": "#0a0d12",
        "editor.lineHighlightBackground": "#12171f",
        "editorLineNumber.foreground": "#3a4757",
        "editorLineNumber.activeForeground": "#7c93ff",
        "editor.selectionBackground": "#2b3960",
        "editorCursor.foreground": "#7c93ff",
        "editorIndentGuide.background1": "#1c2530",
      },
    });
    monaco.editor.setTheme("decomp");
    editor.addCommand(
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

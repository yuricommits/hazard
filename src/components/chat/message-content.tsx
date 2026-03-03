"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

// Aliases people commonly type in fences
const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  py: "python",
  yml: "yaml",
  rs: "rust",
};

function resolveLanguage(lang: string | null): string {
  if (!lang) return "plaintext";
  const normalized = lang.toLowerCase();
  return LANG_MAP[normalized] ?? normalized;
}

function CodeBlock({
  language,
  children,
}: {
  language: string | null;
  children: string;
}) {
  const [copied, setCopied] = useState(false);
  const resolved = resolveLanguage(language);

  function handleCopy() {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative group my-2 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-black">
        <span className="text-[10px] text-zinc-600 font-mono">
          {language ?? "plaintext"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <>
              <Check size={10} />
              Copied
            </>
          ) : (
            <>
              <Copy size={10} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Body */}
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={resolved}
        PreTag="div"
        useInlineStyles
        customStyle={{
          margin: 0,
          borderRadius: 0,
          border: "none",
          fontSize: "12px",
          lineHeight: "1.6",
          background: "#09090b",
          padding: "12px",
        }}
        codeTagProps={{
          style: { fontFamily: "ui-monospace, SFMono-Regular, monospace" },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

export default function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-sm text-zinc-300 wrap-break-words leading-relaxed my-0.5">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-50">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-300">{children}</em>
        ),
        pre: ({ children }) => <>{children}</>,
        code: ({ children, className }) => {
          const match = /language-(\w+)/.exec(className || "");
          const language = match?.[1] ?? null;
          const raw = String(children).replace(/\n$/, "");
          const isInline = !className && !raw.includes("\n");

          if (isInline) {
            return (
              <code className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono px-1.5 py-0.5">
                {children}
              </code>
            );
          }

          return <CodeBlock language={language}>{raw}</CodeBlock>;
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-600 pl-3 my-1 text-zinc-400 italic">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-0.5 my-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-sm text-zinc-300 space-y-0.5 my-1">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="text-zinc-300">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// What changed:

// SyntaxHighlighter from Prism replaces the plain code block
// oneDark theme — dark, professional, matches our zinc palette
// Language is extracted from the markdown fence (```javascript) and passed to the highlighter
// Custom styles override the default background with our zinc-950 and add our border style
// Inline code stays the same — only fenced code blocks get syntax highlighting

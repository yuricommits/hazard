import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-sm text-zinc-300 wrap-break-word leading-relaxed">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-50">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-300">{children}</em>
        ),
        code: ({ children, className }) => {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : null;

          if (language) {
            return (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                  margin: "4px 0",
                  borderRadius: "8px",
                  border: "1px solid #27272a",
                  fontSize: "12px",
                  background: "#09090b",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          }

          return (
            <code className="bg-zinc-800 text-violet-300 text-xs font-mono px-1.5 py-0.5 rounded">
              {children}
            </code>
          );
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

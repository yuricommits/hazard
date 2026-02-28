import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre my-1">
                {children}
              </code>
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

// What this does:

// Each markdown element gets its own styled component matching our design system
// Inline code gets violet text on zinc background — matches our color meaning
// Block code gets a dark bordered box with monospace font
// Links open in new tab with noopener noreferrer for security
// Blockquotes get a left border accent
// GFM adds support for task lists, tables, strikethrough

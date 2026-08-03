import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

/** Tipografía compacta a escala de burbuja de chat (text-sm). Los `mb-2` +
 *  `last:mb-0` mantienen el ritmo vertical sin colita al final del mensaje. */
const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0">{children}</ol>,
    h1: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
    h2: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
    h3: ({ children }) => <h4 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h4>,
    h4: ({ children }) => <h5 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h5>,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
        >
            {children}
        </a>
    ),
    code: ({ children, className }) =>
        // Sin className = código inline; con className (language-*) es un bloque
        // y el wrapper <pre> de abajo ya se encarga del contenedor.
        className ? (
            <code className={className}>{children}</code>
        ) : (
            <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
        ),
    pre: ({ children }) => (
        <pre className="mb-2 overflow-x-auto rounded-md bg-background/60 p-2 font-mono text-xs last:mb-0">
            {children}
        </pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-2 border-border" />,
    table: ({ children }) => (
        <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
        </div>
    ),
    th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border border-border px-2 py-1 align-top">{children}</td>,
};

/** Markdown de las respuestas de Forge. remark-breaks: los LLM usan saltos
 *  simples esperando <br> (convención de chat). memo: durante el stream solo
 *  re-parsea el mensaje que está creciendo, no todo el historial. */
export const ForgeMarkdown = memo(({ content }: { content: string }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
    </ReactMarkdown>
));

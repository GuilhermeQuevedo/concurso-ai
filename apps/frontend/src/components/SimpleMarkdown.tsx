import { Fragment, type ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  // Negrito (**texto**) e itálico (*texto*)
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'p'; text: string };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push({ kind: 'ul', items: bullets });
      bullets = [];
    }
    if (ordered.length) {
      blocks.push({ kind: 'ol', items: ordered });
      ordered = [];
    }
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].replace(/[:\s]+$/, '') });
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      if (ordered.length) flush();
      bullets.push(line.replace(/^[-*•]\s+/, ''));
      continue;
    }

    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ol) {
      if (bullets.length) flush();
      ordered.push(ol[1]);
      continue;
    }

    flush();
    blocks.push({ kind: 'p', text: line });
  }

  flush();
  return blocks;
}

export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = parse(text);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          // Níveis 1-2: título de seção; 3+: subtítulo destacado
          if (block.level <= 2) {
            return (
              <h4
                key={i}
                className="mt-4 border-b border-gray-200 pb-1 text-base font-bold text-gray-900 first:mt-0 dark:border-gray-700 dark:text-white"
              >
                {renderInline(block.text)}
              </h4>
            );
          }
          return (
            <h5
              key={i}
              className="mt-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-600 first:mt-0 dark:text-primary-400"
            >
              <span className="h-3.5 w-1 rounded-full bg-primary-500" />
              {renderInline(block.text)}
            </h5>
          );
        }

        if (block.kind === 'ul') {
          return (
            <ul key={i} className="ml-1 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary-400" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'ol') {
          return (
            <ol key={i} className="ml-1 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {j + 1}
                  </span>
                  <span className="pt-0.5">{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

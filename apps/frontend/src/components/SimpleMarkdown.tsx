import { Fragment, type ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="ml-4 list-disc space-y-1">
        {list.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      list.push(line.slice(2));
      return;
    }
    flushList(`ul-${index}`);

    if (!line) return;
    if (line.startsWith('### ')) {
      blocks.push(
        <h5 key={index} className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
          {renderInline(line.slice(4))}
        </h5>,
      );
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h4 key={index} className="mt-3 text-base font-semibold text-gray-900 dark:text-white">
          {renderInline(line.slice(3))}
        </h4>,
      );
    } else if (line.startsWith('# ')) {
      blocks.push(
        <h4 key={index} className="mt-3 text-base font-bold text-gray-900 dark:text-white">
          {renderInline(line.slice(2))}
        </h4>,
      );
    } else {
      blocks.push(
        <p key={index} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {renderInline(line)}
        </p>,
      );
    }
  });

  flushList('ul-end');

  return <div className="space-y-2">{blocks}</div>;
}

import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

interface RichExplanationViewProps {
  explanation: string;
  correctAnswer?: string;
  className?: string;
}

interface ParsedSection {
  type: 'synthesis' | 'sources' | 'distractors' | 'tip' | 'general';
  title: string;
  content: string;
}

function parseExplanationSections(rawText: string): ParsedSection[] {
  if (!rawText || !rawText.trim()) return [];

  // Padrões de cabeçalhos de blocos
  const sectionHeaders = [
    { type: 'synthesis' as const, regex: /(?:^|\n)(?:💡\s*)?(?:\*\*)?(?:Gabarito\s+e\s+S[íi]ntese|S[íi]ntese\s+do\s+Gabarito)(?:\*\*)?[:\s]*/i, defaultTitle: 'Gabarito e Síntese' },
    { type: 'sources' as const, regex: /(?:^|\n)(?:📖\s*)?(?:\*\*)?(?:Fundamenta[çc][ãa]o\s*(?:&|e)?\s*Fontes?|Base\s+Legal|Dispositivos?\s+Normativos?)(?:\*\*)?[:\s]*/i, defaultTitle: 'Fundamentação & Fontes Normativas' },
    { type: 'distractors' as const, regex: /(?:^|\n)(?:🔍\s*)?(?:\*\*)?(?:An[áa]lise\s+dos\s+Distratores|An[áa]lise\s+das\s+Alternativas|Por\s+que\s+as\s+outras\s+est[ãa]o\s+erradas)(?:\*\*)?[:\s]*/i, defaultTitle: 'Análise dos Distratores (Alternativas Incorretas)' },
    { type: 'tip' as const, regex: /(?:^|\n)(?:⚠️\s*)?(?:\*\*)?(?:Dica\s+do\s+Especialista|Pegadinha\s+da\s+Banca|Dica\s+de\s+Mestre|Aten[çc][ãa]o)(?:\*\*)?[:\s]*/i, defaultTitle: 'Dica do Especialista & Pegadinha da Banca' },
  ];

  // Encontra as posições dos títulos presentes
  const matches: Array<{ type: ParsedSection['type']; title: string; index: number; headerLength: number }> = [];

  for (const h of sectionHeaders) {
    const m = h.regex.exec(rawText);
    if (m && m.index >= 0) {
      matches.push({
        type: h.type,
        title: h.defaultTitle,
        index: m.index,
        headerLength: m[0].length,
      });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    return [
      {
        type: 'general',
        title: 'Fundamentação e Justificativa',
        content: rawText.trim(),
      },
    ];
  }

  const sections: ParsedSection[] = [];

  // Se houver texto antes da primeira seção identificada
  if (matches[0].index > 0) {
    const prefix = rawText.slice(0, matches[0].index).trim();
    if (prefix) {
      sections.push({
        type: 'general',
        title: 'Introdução / Comentário',
        content: prefix,
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    const content = rawText.slice(current.index + current.headerLength, nextIndex).trim();

    if (content) {
      sections.push({
        type: current.type,
        title: current.title,
        content,
      });
    }
  }

  return sections;
}

function FormattedContent({ text }: { text: string }) {
  // Renderiza linhas preservando quebras e marcadores simples
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        // Itens de lista com bullet ou hífen
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-•*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
              <span className="flex-1 font-normal">{renderInlineBold(itemText)}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="font-normal">
            {renderInlineBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineBold(str: string): React.ReactNode {
  // Converte **texto** em negrito
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function RichExplanationView({ explanation, correctAnswer, className = '' }: RichExplanationViewProps) {
  const [copied, setCopied] = useState(false);
  const sections = parseExplanationSections(explanation);

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getSectionIcon = (type: ParsedSection['type']) => {
    switch (type) {
      case 'synthesis':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'sources':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'distractors':
        return <Search className="w-4 h-4 text-purple-500" />;
      case 'tip':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary-500" />;
    }
  };

  const getSectionStyle = (type: ParsedSection['type']) => {
    switch (type) {
      case 'synthesis':
        return 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20';
      case 'sources':
        return 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20';
      case 'distractors':
        return 'border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20';
      case 'tip':
        return 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20';
      default:
        return 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-850/40';
    }
  };

  return (
    <div className={`space-y-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs ${className}`}>
      {/* Header da Explicação */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600 dark:text-primary-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Explicação & Fundamentação Completa
              {correctAnswer && (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Gabarito: {correctAnswer}
                </span>
              )}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          title="Copiar explicação comentada"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>

      {/* Blocos Estruturados */}
      <div className="space-y-3">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-3.5 transition-all ${getSectionStyle(sec.type)}`}
          >
            <div className="mb-2 flex items-center gap-2">
              {getSectionIcon(sec.type)}
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                {sec.title}
              </h5>
            </div>
            <FormattedContent text={sec.content} />
          </div>
        ))}
      </div>
    </div>
  );
}

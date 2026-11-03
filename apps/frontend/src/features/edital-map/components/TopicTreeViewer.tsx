import React, { useState } from 'react';
import type { EditalTree, TopicCoverage, TopicProbability, EditalSubject, EditalTopic } from '../types';
import { ChevronDown, ChevronRight, CheckCircle2, CircleDashed, AlertTriangle, BrainCircuit, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityPopover } from './PriorityPopover';

interface TopicTreeViewerProps {
  tree: EditalTree;
  coverageMap?: Record<string, TopicCoverage>;
  probabilityMap?: Record<string, TopicProbability>;
  filterUncoveredOnly: boolean;
  onAnalyzeProbabilities?: () => void;
}

export const TopicTreeViewer: React.FC<TopicTreeViewerProps> = ({
  tree,
  coverageMap = {},
  probabilityMap,
  filterUncoveredOnly,
  onAnalyzeProbabilities,
}) => {
  const [forceOpen, setForceOpen] = useState<boolean | null>(null);

  const getCoverageData = (subject: string, topic: string) =>
    coverageMap ? coverageMap[`${subject}_${topic}`] : undefined;

  const getProbabilityData = (subject: string, topic: string) =>
    probabilityMap ? probabilityMap[`${subject}_${topic}`] : undefined;

  const subjectsCount = tree?.subjects?.length || 0;

  return (
    <div className="space-y-4">
      {subjectsCount > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
          <span>
            Exibindo <strong className="text-foreground">{subjectsCount}</strong> matérias e especialidades
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForceOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer font-medium"
            >
              Expandir todas
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => setForceOpen(false)}
              className="hover:text-primary transition-colors cursor-pointer font-medium"
            >
              Recolher todas
            </button>
          </div>
        </div>
      )}

      {tree?.subjects &&
        Array.isArray(tree.subjects) &&
        tree.subjects.map((subject, idx) => (
          <SubjectNode
            key={idx}
            subject={subject}
            getCoverageData={getCoverageData}
            getProbabilityData={getProbabilityData}
            probabilityMap={probabilityMap}
            filterUncoveredOnly={filterUncoveredOnly}
            onAnalyzeProbabilities={onAnalyzeProbabilities}
            forceOpen={forceOpen}
          />
        ))}
    </div>
  );
};

interface SubjectNodeProps {
  subject: EditalSubject;
  getCoverageData: (sub: string, top: string) => TopicCoverage | undefined;
  getProbabilityData: (sub: string, top: string) => TopicProbability | undefined;
  probabilityMap?: Record<string, TopicProbability>;
  filterUncoveredOnly: boolean;
  onAnalyzeProbabilities?: () => void;
  forceOpen?: boolean | null;
}

const SubjectNode: React.FC<SubjectNodeProps> = ({
  subject,
  getCoverageData,
  getProbabilityData,
  probabilityMap,
  filterUncoveredOnly,
  onAnalyzeProbabilities,
  forceOpen,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  React.useEffect(() => {
    if (forceOpen !== null && forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  const topicsArray = Array.isArray(subject?.topics) ? subject.topics : [];
  const visibleTopics = topicsArray.filter((topic: EditalTopic) => {
    if (!topic || !topic.name) return false;
    if (!filterUncoveredOnly) return true;
    const cov = getCoverageData(subject.name, topic.name);
    return cov && cov.status !== 'covered';
  });

  const hasAnalysisRan = probabilityMap !== undefined;
  const justification = hasAnalysisRan
    ? 'A prioridade da matéria é definida estruturalmente com base no peso e na relevância extraídos do edital original (quantidade de tópicos e complexidade).'
    : null;

  const subjectBadgeNode = (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity border',
        subject.weight === 'alta' && 'bg-red-500/10 border-red-500/30 text-red-500',
        subject.weight === 'media' && 'bg-amber-500/10 border-amber-500/30 text-amber-500',
        subject.weight === 'baixa' && 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      )}
      title="Clique para ver a justificativa"
    >
      <Info className="w-3 h-3" />
      Prioridade {subject.weight}
    </div>
  );

  if (visibleTopics.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors outline-none cursor-pointer',
          isOpen ? 'rounded-t-xl border-b border-border/50' : 'rounded-xl'
        )}
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-display font-medium text-lg text-foreground text-left">
            {subject.name}
          </h3>
        </div>

        <PriorityPopover
          title={`Matéria: ${subject.name}`}
          badgeNode={subjectBadgeNode}
          justification={justification}
          hasAnalysisRan={hasAnalysisRan}
          align="right"
          onAnalyzeProbabilities={onAnalyzeProbabilities}
        >
          {({ onClick }) => <div onClick={onClick}>{subjectBadgeNode}</div>}
        </PriorityPopover>
      </button>

      {isOpen && (
        <div className="divide-y divide-border/50">
          {visibleTopics.map((topic: EditalTopic, idx: number) => (
            <TopicNode
              key={idx}
              subjectName={subject.name}
              topic={topic}
              coverage={getCoverageData(subject.name, topic.name)}
              probability={getProbabilityData(subject.name, topic.name)}
              probabilityMap={probabilityMap}
              onAnalyzeProbabilities={onAnalyzeProbabilities}
              isLast={idx === visibleTopics.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TopicNodeProps {
  subjectName: string;
  topic: EditalTopic;
  coverage?: TopicCoverage;
  probability?: TopicProbability;
  probabilityMap?: Record<string, TopicProbability>;
  onAnalyzeProbabilities?: () => void;
  isLast?: boolean;
}

const TopicNode: React.FC<TopicNodeProps> = ({
  subjectName,
  topic,
  coverage,
  probability,
  probabilityMap,
  onAnalyzeProbabilities,
  isLast,
}) => {
  let StatusIcon = CircleDashed;
  let statusColor = 'text-muted-foreground';

  if (coverage?.status === 'covered') {
    StatusIcon = CheckCircle2;
    statusColor = 'text-emerald-500';
  } else if (coverage?.status === 'uncovered') {
    StatusIcon = AlertTriangle;
    statusColor = 'text-amber-500';
  } else if (coverage?.status === 'partial') {
    StatusIcon = CircleDashed;
    statusColor = 'text-blue-400';
  }

  const hasAnalysisRan = probabilityMap !== undefined;
  const key = `${subjectName}_${topic.name}`;
  const justification = probabilityMap?.[key]?.justification || null;

  const topicBadgeNode = probability ? (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium border px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity',
        probability.probability === 'alta'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : probability.probability === 'media'
          ? 'bg-muted border-border text-muted-foreground'
          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
      )}
      title="Clique para ver a justificativa"
    >
      <Info className="w-3 h-3" />
      <BrainCircuit className="w-3.5 h-3.5" />
      Probabilidade {probability.probability.toUpperCase()}
    </div>
  ) : (
    <div
      className="flex items-center gap-1.5 text-xs font-medium border px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-secondary/60 border-border text-muted-foreground"
      title="Clique para ver a justificativa"
    >
      <Info className="w-3 h-3" />
      <BrainCircuit className="w-3.5 h-3.5" />
      Probabilidade -
    </div>
  );

  return (
    <div
      className={cn(
        'p-4 pl-8 sm:pl-12 flex flex-col md:flex-row md:items-start justify-between gap-4 bg-background hover:bg-secondary/10 transition-all duration-150',
        isLast && 'rounded-b-xl'
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-start gap-3">
          <StatusIcon className={cn('w-5 h-5 mt-0.5 shrink-0', statusColor)} />
          <div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">{topic?.name}</h4>
            {topic?.subtopics && Array.isArray(topic.subtopics) && topic.subtopics.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {topic.subtopics
                  .map((sub: unknown) => {
                    if (typeof sub === 'string') return sub;
                    if (sub && typeof sub === 'object') {
                      const record = sub as Record<string, unknown>;
                      return String(
                        record.name ||
                          record.title ||
                          Object.values(record)
                            .filter((v) => typeof v === 'string')
                            .join(' - ') ||
                          JSON.stringify(sub)
                      );
                    }
                    return String(sub);
                  })
                  .join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="pl-8 pt-2 relative">
          <PriorityPopover
            title={`Tópico: ${topic.name}`}
            badgeNode={topicBadgeNode}
            justification={justification}
            hasAnalysisRan={hasAnalysisRan}
            align="left"
            onAnalyzeProbabilities={onAnalyzeProbabilities}
          >
            {({ onClick }) => (
              <div onClick={onClick} className="cursor-pointer inline-block">
                {topicBadgeNode}
              </div>
            )}
          </PriorityPopover>
        </div>
      </div>
    </div>
  );
};

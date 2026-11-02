import React, { useState } from 'react';
import type { EditalTree, TopicCoverage, TopicProbability, EditalSubject, EditalTopic } from '../types';
import { ChevronDown, ChevronRight, CheckCircle2, CircleDashed, AlertTriangle, BrainCircuit, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityPopover } from './PriorityPopover';
import { useNavigate } from 'react-router';

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
  const getCoverageData = (subject: string, topic: string) =>
    coverageMap ? coverageMap[`${subject}_${topic}`] : undefined;

  const getProbabilityData = (subject: string, topic: string) =>
    probabilityMap ? probabilityMap[`${subject}_${topic}`] : undefined;

  return (
    <div className="space-y-4">
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
}

const SubjectNode: React.FC<SubjectNodeProps> = ({
  subject,
  getCoverageData,
  getProbabilityData,
  probabilityMap,
  filterUncoveredOnly,
  onAnalyzeProbabilities,
}) => {
  const [isOpen, setIsOpen] = useState(true);

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
        'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-sm uppercase tracking-wide cursor-pointer hover:opacity-80 transition-all border',
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
    <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left outline-none cursor-pointer',
          isOpen && 'border-b border-border/50'
        )}
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-display font-medium text-base sm:text-lg text-foreground">
            {subject.name}
          </h3>
          <span className="text-xs text-muted-foreground">({visibleTopics.length} tópicos)</span>
        </div>

        <PriorityPopover
          title={`Matéria: ${subject.name}`}
          badgeNode={subjectBadgeNode}
          justification={justification}
          hasAnalysisRan={hasAnalysisRan}
          onAnalyzeProbabilities={onAnalyzeProbabilities}
        >
          {({ onClick }) => <div onClick={onClick}>{subjectBadgeNode}</div>}
        </PriorityPopover>
      </button>

      {isOpen && (
        <div className="divide-y divide-border/40">
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
}) => {
  const navigate = useNavigate();

  let StatusIcon = CircleDashed;
  let statusText = 'Não coberto';
  let statusBadgeClass = 'text-amber-500 bg-amber-500/10 border-amber-500/30';

  if (coverage?.status === 'covered') {
    StatusIcon = CheckCircle2;
    statusText = 'Coberto';
    statusBadgeClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  } else if (coverage?.status === 'partial') {
    StatusIcon = CircleDashed;
    statusText = 'Parcial';
    statusBadgeClass = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  } else {
    StatusIcon = AlertTriangle;
    statusText = 'Não coberto';
    statusBadgeClass = 'text-red-400 bg-red-500/10 border-red-500/30';
  }

  const hasAnalysisRan = probabilityMap !== undefined;
  const key = `${subjectName}_${topic.name}`;
  const justification = probabilityMap?.[key]?.justification || null;

  const topicBadgeNode = probability ? (
    <div
      className={cn(
        'flex items-center gap-1.5 text-[11px] font-medium border px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity',
        probability.probability === 'alta'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : probability.probability === 'media'
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
      )}
      title="Clique para ver a justificativa histórica"
    >
      <BrainCircuit className="w-3.5 h-3.5" />
      Probabilidade {probability.probability.toUpperCase()}
    </div>
  ) : (
    <div
      className="flex items-center gap-1.5 text-[11px] font-medium border border-border px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity bg-secondary/50 text-muted-foreground"
      title="Clique para ver a justificativa"
    >
      <BrainCircuit className="w-3.5 h-3.5" />
      Probabilidade -
    </div>
  );

  return (
    <div className="p-4 pl-8 sm:pl-12 flex flex-col md:flex-row md:items-start justify-between gap-4 bg-background/50 hover:bg-secondary/15 transition-all duration-150">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-sm', statusBadgeClass)}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusText}
          </span>
          <h4 className="font-medium text-sm text-foreground">{topic.name}</h4>
        </div>

        {topic.subtopics && topic.subtopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 pl-2">
            {topic.subtopics.map((sub, sIdx) => (
              <span
                key={sIdx}
                className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded border border-border/40"
              >
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
        <PriorityPopover
          title={`Tópico: ${topic.name}`}
          badgeNode={topicBadgeNode}
          justification={justification}
          hasAnalysisRan={hasAnalysisRan}
          onAnalyzeProbabilities={onAnalyzeProbabilities}
        >
          {({ onClick }) => <div onClick={onClick}>{topicBadgeNode}</div>}
        </PriorityPopover>

        <button
          type="button"
          onClick={() => {
            navigate('/flashcards', {
              state: {
                initialSubject: subjectName,
                initialTopic: topic.name,
              },
            });
          }}
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          title="Estudar este tópico nos Flashcards"
        >
          <Sparkles className="w-3 h-3" />
          Estudar
        </button>
      </div>
    </div>
  );
};

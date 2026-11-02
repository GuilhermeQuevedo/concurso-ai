import React, { useState, useEffect } from 'react';
import { editalMapService } from '@/features/edital-map/services/edital-map.service';
import type { EditalMap } from '@/features/edital-map/types';
import { TopicTreeViewer } from '@/features/edital-map/components/TopicTreeViewer';
import { PdfDropzone } from '@/components/ui/PdfDropzone';
import {
  Loader2,
  BrainCircuit,
  Filter,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  Check,
  Save,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const EditalPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingProb, setLoadingProb] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editalMap, setEditalMap] = useState<EditalMap | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [editalName, setEditalName] = useState('');
  const [filterUncovered, setFilterUncovered] = useState(false);

  const [savedEditals, setSavedEditals] = useState<EditalMap[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [isInitialized, setIsInitialized] = useState(false);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const list = await editalMapService.listEditais();
        if (list && list.length > 0) {
          setSavedEditals(list);
        }

        const isCreatingNew = localStorage.getItem('@zion_creating_edital');
        if (!isCreatingNew) {
          const draftStr = localStorage.getItem('@edital_draft');
          if (draftStr) {
            try {
              const draft = JSON.parse(draftStr) as { editalMap?: EditalMap; editalName?: string };
              if (draft.editalMap) {
                setEditalMap(draft.editalMap);
                setEditalName(draft.editalName || '');
                setIsInitialized(true);
                return;
              }
            } catch (e: unknown) {
              console.warn('Erro ao restaurar rascunho de edital:', e);
            }
          }

          if (list && list.length > 0) {
            setEditalMap(list[0]);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao listar editais';
        console.warn('Erro ao carregar editais salvos:', message);
      } finally {
        setIsInitialized(true);
      }
    };
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!editalMap && !editalName) {
      localStorage.removeItem('@edital_draft');
      return;
    }
    const draft = { editalMap, editalName };
    localStorage.setItem('@edital_draft', JSON.stringify(draft));
  }, [isInitialized, editalMap, editalName]);

  const handleProcessEdital = async () => {
    if (!file || !editalName.trim()) {
      showNotification('Informe o nome e anexe o PDF do edital.', true);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await editalMapService.mapEdital(file, editalName.trim(), false);
      setEditalMap(result);
      localStorage.removeItem('@zion_creating_edital');
      showNotification('Edital Mapeado! Sua árvore de tópicos foi gerada e cruzada com seus decks. Salve o mapa para mantê-lo.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na extração do edital.';
      showNotification(message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdital = async () => {
    if (!editalMap) return;
    if (editalMap.id) {
      showNotification('Este edital já está salvo!');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await editalMapService.saveEdital(editalMap);
      setEditalMap(saved);
      setSavedEditals((prev) => [saved, ...prev]);
      localStorage.removeItem('@edital_draft');
      showNotification('Edital salvo com sucesso!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar edital.';
      showNotification(message, true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeProbabilities = async () => {
    const mapId = editalMap?.id;
    const tree = editalMap?.topicsTree || editalMap?.topics_tree;
    const banca = editalMap?.banca || tree?.banca;

    if (!mapId || !tree || !banca) {
      showNotification('Salve o mapa primeiro para executar a análise histórica de probabilidades.', true);
      return;
    }

    setLoadingProb(true);
    setErrorMessage(null);
    try {
      const updatedMap = await editalMapService.analyzeProbabilities(mapId, tree, banca);
      setEditalMap(updatedMap);
      setSavedEditals((prev) => prev.map((item) => (item.id === mapId ? updatedMap : item)));
      showNotification('Probabilidades Analisadas! Cruzamos o perfil estatístico histórico da banca.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar probabilidades.';
      showNotification(message, true);
    } finally {
      setLoadingProb(false);
    }
  };

  const handleDeleteEdital = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este mapa de edital?')) return;

    try {
      await editalMapService.deleteEdital(id);
      setSavedEditals((prev) => prev.filter((item) => item.id !== id));
      if (editalMap?.id === id) {
        setEditalMap(null);
        setEditalName('');
        setFile(null);
        localStorage.removeItem('@edital_draft');
      }
      showNotification('Edital excluído com sucesso.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir.';
      showNotification(message, true);
    }
  };

  const handleEditName = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveName = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!editName.trim()) return;

    try {
      await editalMapService.updateName(id, editName.trim());
      setSavedEditals((prev) =>
        prev.map((item) => (item.id === id ? { ...item, editalName: editName.trim(), edital_name: editName.trim() } : item))
      );
      if (editalMap?.id === id) {
        setEditalMap({ ...editalMap, editalName: editName.trim(), edital_name: editName.trim() });
      }
      setEditingId(null);
      showNotification('Nome atualizado!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar nome.';
      showNotification(message, true);
    }
  };

  const calculateOverallProgress = () => {
    const coverage = editalMap?.coverageStatus || editalMap?.coverage_status;
    if (!coverage) return 0;
    let total = 0;
    let covered = 0;
    Object.values(coverage).forEach((cov) => {
      total++;
      if (cov.status === 'covered') covered++;
      if (cov.status === 'partial') covered += 0.5;
    });
    return total === 0 ? 0 : Math.round((covered / total) * 100);
  };

  const currentTree = editalMap?.topicsTree || editalMap?.topics_tree;
  const currentCoverage = editalMap?.coverageStatus || editalMap?.coverage_status;
  const currentProbabilities = editalMap?.probabilityAnalysis || editalMap?.probability_analysis;
  const currentName = editalMap?.editalName || editalMap?.edital_name || editalName;

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Banner de notificações */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between animate-in fade-in">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between animate-in fade-in">
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header da Página */}
        <div className="mb-8 border-b border-border/60 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Mapa do Edital
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Transforme PDFs maçantes em árvores de conhecimento rastreáveis e otimizadas por IA.
            </p>
          </div>

          {savedEditals.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSavedModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/70 hover:bg-secondary text-foreground text-sm font-medium rounded-lg border border-border/60 transition-colors cursor-pointer"
            >
              Meus Mapas ({savedEditals.length})
            </button>
          )}
        </div>

        {/* ESTADO VAZIO: Formulário de criação */}
        {!editalMap && (
          <div className="max-w-xl mx-auto rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6 pb-2 border-b border-border/50">
              MAPEAR NOVO EDITAL
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  NOME DO CONCURSO / EDITAL
                </label>
                <input
                  type="text"
                  className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                  placeholder="Ex: Polícia Federal 2024 - Agente Administrativo"
                  value={editalName}
                  onChange={(e) => setEditalName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  PDF DO EDITAL
                </label>
                <PdfDropzone
                  file={file}
                  onFileSelect={setFile}
                  disabled={loading}
                  title="Seleção do PDF do Edital"
                  subtitle="Envie a seção de conteúdo programático (até 50MB)"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleProcessEdital()}
                disabled={loading || !file || !editalName.trim()}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mapeando Edital com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Mapear Edital agora
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ESTADO COM MAPA GERADO / CARREGADO */}
        {editalMap && currentTree && (
          <div className="space-y-8 animate-fade-in">
            {/* Resumo do Edital e Métrica */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-1.5">
                  {currentName}
                </h2>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    Banca: <strong className="text-foreground">{currentTree.banca || 'Não identificada'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Cargo: <strong className="text-foreground">{currentTree.cargo || 'Não identificado'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Matérias: <strong className="text-foreground">{currentTree.subjects?.length || 0}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-left md:text-right">
                  <div className="text-3xl font-bold font-display text-primary">
                    {calculateOverallProgress()}%
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Edital Coberto
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {!editalMap.id && (
                    <button
                      type="button"
                      onClick={() => void handleSaveEdital()}
                      disabled={isSaving || loading}
                      className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary/10 text-primary border border-primary/30 font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50 text-xs cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Salvar Mapa
                    </button>
                  )}

                  {!currentProbabilities ? (
                    <button
                      type="button"
                      onClick={() => void handleAnalyzeProbabilities()}
                      disabled={loadingProb}
                      className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-xs shadow-sm cursor-pointer"
                    >
                      {loadingProb ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BrainCircuit className="w-3.5 h-3.5" />
                      )}
                      Analisar Probabilidades
                    </button>
                  ) : (
                    <div className="h-9 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Probabilidades ativas
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Árvore de Tópicos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-semibold text-base sm:text-lg text-foreground">
                  Matérias e Conteúdo Programático
                </h3>
                <button
                  type="button"
                  onClick={() => setFilterUncovered(!filterUncovered)}
                  className={cn(
                    'flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer',
                    filterUncovered
                      ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                      : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <Filter className="w-3.5 h-3.5" /> Exibir apenas não cobertos
                </button>
              </div>

              <TopicTreeViewer
                tree={currentTree}
                coverageMap={currentCoverage}
                probabilityMap={currentProbabilities}
                filterUncoveredOnly={filterUncovered}
                onAnalyzeProbabilities={() => void handleAnalyzeProbabilities()}
              />
            </div>

            {/* Ação para mapear outro edital */}
            <div className="text-center pt-8 border-t border-border/50">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('@zion_creating_edital', 'true');
                  localStorage.removeItem('@edital_draft');
                  setEditalMap(null);
                  setFile(null);
                  setEditalName('');
                }}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer"
              >
                Mapear outro edital
              </button>
            </div>
          </div>
        )}

        {/* Modal: Meus Mapas Salvos */}
        {showSavedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                <h3 className="text-lg font-bold text-foreground">Editais Salvos</h3>
                <button
                  type="button"
                  onClick={() => setShowSavedModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {savedEditals.map((edital) => {
                  const edName = edital.editalName || edital.edital_name || 'Sem título';
                  const edTree = edital.topicsTree || edital.topics_tree;

                  return (
                    <div
                      key={edital.id}
                      onClick={() => {
                        if (editingId === edital.id) return;
                        localStorage.removeItem('@zion_creating_edital');
                        setEditalMap(edital);
                        setShowSavedModal(false);
                      }}
                      className="p-4 rounded-xl border border-border bg-background hover:border-primary/50 cursor-pointer transition-all relative group"
                    >
                      {editingId === edital.id ? (
                        <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 h-8 px-2.5 text-sm border rounded-md text-foreground bg-card focus:ring-1 focus:ring-primary outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              if (edital.id) void handleSaveName(e, edital.id);
                            }}
                            className="p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                            className="p-1.5 bg-secondary text-muted-foreground rounded-md hover:bg-secondary/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-foreground text-sm pr-16">{edName}</p>
                          <div className="absolute top-3.5 right-3.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                if (edital.id) handleEditName(e, edital.id, edName);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-primary rounded-md bg-secondary/60 hover:bg-secondary"
                              title="Renomear"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                if (edital.id) void handleDeleteEdital(e, edital.id);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-destructive rounded-md bg-secondary/60 hover:bg-secondary"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>{edTree?.banca || 'Banca não info.'}</span>
                        <span>{edTree?.subjects?.length || 0} matérias</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

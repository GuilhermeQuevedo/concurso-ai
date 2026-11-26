import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { contestService } from '../services/contest.service';
import { EditalUpload } from './EditalUpload';
import { PresetEditalPicker } from './PresetEditalPicker';

type Mode = 'preset' | 'edital' | 'manual';

export interface NewContestFormProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

export function NewContestForm({ onBack, onCreated }: NewContestFormProps) {
  const [mode, setMode] = useState<Mode>('preset');

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Voltar</span>
      </button>

      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
        Novo Edital ou Objetivo de Estudo
      </h2>

      <div className="mb-5 flex flex-wrap gap-2">
        <ModeButton
          active={mode === 'preset'}
          onClick={() => setMode('preset')}
          label="Editais prontos"
        />
        <ModeButton
          active={mode === 'edital'}
          onClick={() => setMode('edital')}
          label="A partir de um arquivo (IA)"
        />
        <ModeButton
          active={mode === 'manual'}
          onClick={() => setMode('manual')}
          label="Cadastro manual"
        />
      </div>

      {mode === 'preset' && <PresetEditalPicker onCreated={onCreated} />}
      {mode === 'edital' && <EditalUpload onCreated={onCreated} />}
      {mode === 'manual' && <ManualForm onCreated={onCreated} />}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-fast touch-manipulation cursor-pointer active:scale-95 ${
        active
          ? 'bg-[#2E8C82] text-white shadow-xs'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
      }`}
    >
      {label}
    </button>
  );
}

function ManualForm({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [role, setRole] = useState('');
  const [examDate, setExamDate] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      contestService.create({
        name,
        organization: organization || undefined,
        examBoard: examBoard || undefined,
        role: role || undefined,
        examDate: examDate || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      onCreated(data.id);
    },
  });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast">
      <Field
        label="Nome do objetivo *"
        value={name}
        onChange={setName}
        placeholder="Ex: SEEDF — Professor de Sociologia"
      />
      <Field
        label="Órgão"
        value={organization}
        onChange={setOrganization}
        placeholder="Ex: Secretaria de Educação do DF"
      />
      <Field
        label="Banca Examinadora"
        value={examBoard}
        onChange={setExamBoard}
        placeholder="Ex: CESPE/CEBRASPE"
      />
      <Field
        label="Cargo"
        value={role}
        onChange={setRole}
        placeholder="Ex: Professor de Educação Básica"
      />
      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
          Data da prova
        </label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 transition-colors focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white touch-manipulation"
        />
      </div>

      {mutation.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-300">
          Erro ao criar edital manual. Verifique as informações e tente novamente.
        </div>
      )}

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={name.trim().length < 3 || mutation.isPending}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-fast hover:bg-[#26776f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99] touch-manipulation cursor-pointer"
      >
        {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        <span>Salvar objetivo</span>
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 transition-colors focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white touch-manipulation"
      />
    </div>
  );
}

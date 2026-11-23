import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { contestService } from '../services/contest.service';
import { EditalUpload } from './EditalUpload';
import { PresetEditalPicker } from './PresetEditalPicker';

type Mode = 'preset' | 'edital' | 'manual';

export function NewContestForm({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [mode, setMode] = useState<Mode>('preset');

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <ChevronLeft className="mr-1 inline h-4 w-4" />
        Voltar
      </button>

      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Novo Edital ou Estudo</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <ModeButton active={mode === 'preset'} onClick={() => setMode('preset')} label="Editais prontos" />
        <ModeButton active={mode === 'edital'} onClick={() => setMode('edital')} label="A partir de um arquivo (IA)" />
        <ModeButton active={mode === 'manual'} onClick={() => setMode('manual')} label="Cadastro manual" />
      </div>

      {mode === 'preset' && <PresetEditalPicker onCreated={onCreated} />}
      {mode === 'edital' && <EditalUpload onCreated={onCreated} />}
      {mode === 'manual' && <ManualForm onCreated={onCreated} />}
    </div>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
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
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <Field label="Nome do objetivo *" value={name} onChange={setName} placeholder="Ex: SEEDF — Professor de Sociologia" />
      <Field label="Órgão" value={organization} onChange={setOrganization} placeholder="Ex: Secretaria de Educação do DF" />
      <Field label="Banca" value={examBoard} onChange={setExamBoard} placeholder="Ex: CESPE/CEBRASPE" />
      <Field label="Cargo" value={role} onChange={setRole} placeholder="Ex: Professor de Educação Básica" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Data da prova</label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {mutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Erro ao criar. Tente novamente. Tente novamente.
        </div>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={name.trim().length < 3 || mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Criar Objetivo
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}

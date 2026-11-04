interface DocumentNameInputProps {
  value: string;
  onChange: (value: string) => void;
  showError?: boolean;
}

export function DocumentNameInput({ value, onChange, showError = false }: DocumentNameInputProps) {
  const invalid = showError && value.trim().length === 0;

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300" htmlFor="document-name">
        Nome do documento <span className="text-red-500">*</span>
      </label>
      <input
        id="document-name"
        type="text"
        required
        maxLength={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex.: Edital Prefeitura 2026"
        aria-invalid={invalid}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-white ${
          invalid ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'
        }`}
      />
      {invalid && <p className="mt-1 text-xs text-red-500">Informe o nome do documento antes de enviar.</p>}
    </div>
  );
}

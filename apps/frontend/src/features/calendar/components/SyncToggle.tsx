interface SyncToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SyncToggle({ title, description, checked, onChange }: SyncToggleProps) {
  return (
    <label className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-200/80 cursor-pointer dark:bg-gray-800 dark:border-gray-700/80">
      <div>
        <span className="text-xs font-semibold text-gray-900 dark:text-white">{title}</span>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-primary-600 cursor-pointer"
      />
    </label>
  );
}

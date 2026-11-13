import type { CalendarItem } from '../calendar-items';

interface ItemChipProps {
  item: CalendarItem;
  onOpen: (item: CalendarItem) => void;
  large?: boolean;
}

// Item do calendário: bolinha na cor da matéria + título; riscado quando concluído.
export function ItemChip({ item, onOpen, large }: ItemChipProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item);
      }}
      title={item.title}
      className={`flex w-full items-center gap-1.5 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
        large ? 'border border-gray-200 bg-white px-2.5 py-2 text-sm dark:border-gray-700 dark:bg-gray-900' : 'px-1 py-0.5 text-[11px]'
      } ${item.done ? 'opacity-50' : ''}`}
      style={large ? { borderLeft: `4px solid ${item.color}` } : undefined}
    >
      {!large && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />}
      <span className={`min-w-0 flex-1 ${large ? 'whitespace-normal break-words' : 'truncate'} text-gray-800 dark:text-gray-100 ${item.done ? 'line-through' : ''}`}>
        {item.title}
      </span>
    </button>
  );
}

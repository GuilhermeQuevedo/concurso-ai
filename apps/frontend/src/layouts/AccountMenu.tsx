import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronUp } from 'lucide-react';

import { CreditCardIcon, SettingsIcon } from '@/components/icons/EngramaIcons';

export interface AccountMenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export interface AccountMenuProps {
  items: AccountMenuItem[];
  onNavigate: () => void;
  onOpenBilling: () => void;
}

const ITEM_CLASS =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/8 hover:text-white';

// "Conta & Ajustes" como janela suspensa: some do menu até ser aberta.
export function AccountMenu({ items, onNavigate, onOpenBilling }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate();
  };

  return (
    <div ref={rootRef} className="relative mt-3 border-t border-white/8 pt-3">
      {open && (
        <div
          role="menu"
          aria-label="Conta e ajustes"
          className="absolute bottom-full left-0 right-0 z-10 mb-2 rounded-xl border border-white/10 bg-[#1B2547] p-1.5 shadow-2xl"
        >
          {items.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} role="menuitem" onClick={close} className={ITEM_CLASS}>
              <Icon size={17} className="shrink-0 text-white/55" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onOpenBilling();
            }}
            className={ITEM_CLASS}
          >
            <CreditCardIcon size={17} className="shrink-0 text-white/55" />
            Assinatura & Planos
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/6 hover:text-white"
      >
        <span className="flex items-center gap-2.5">
          <SettingsIcon size={18} className="text-white/50" />
          Conta & Ajustes
        </span>
        <ChevronUp size={15} className={`text-white/40 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}

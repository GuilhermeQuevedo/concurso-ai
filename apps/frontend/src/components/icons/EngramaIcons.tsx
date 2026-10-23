export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

// ═══════════════════════════════════════════════════════════════
// NÚCLEO ZION ICONS (Design System Flashcards-Inteligentes)
// ═══════════════════════════════════════════════════════════════

export const FlashcardsIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="3" width="12" height="9" rx="1.5" opacity="0.4" />
    <rect x="3" y="6" width="12" height="9" rx="1.5" />
    <line x1="6" y1="10" x2="12" y2="10" />
    <line x1="6" y1="12.5" x2="10" y2="12.5" />
  </svg>
);

export const SimuladosIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 2.5h7l3 3v12a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5v-15A.5.5 0 015 2.5z" />
    <path d="M12 2.5v3h3" opacity="0.5" />
    <line x1="7" y1="8" x2="13" y2="8" />
    <line x1="7" y1="10.5" x2="13" y2="10.5" />
    <path d="M7 13.5l1.5 1.5 3-3" strokeWidth={1.8} />
  </svg>
);

export const ProvasComentadasIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 3h8l2.5 2.5V13H4V3z" />
    <line x1="6" y1="7" x2="11" y2="7" />
    <line x1="6" y1="9.5" x2="9" y2="9.5" />
    <path d="M10 12h6a1 1 0 011 1v3a1 1 0 01-1 1h-3l-2 1.5V16h-1a1 1 0 01-1-1v-3a1 1 0 011-1z" />
  </svg>
);

export const CadernoErrosIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 4v13M4 4h6v13H4a1 1 0 01-1-1V5a1 1 0 011-1zM16 4h-6v13h6a1 1 0 001-1V5a1 1 0 00-1-1z" />
    <line x1="12" y1="8" x2="15" y2="11" strokeWidth={1.8} />
    <line x1="15" y1="8" x2="12" y2="11" strokeWidth={1.8} />
    <line x1="5.5" y1="8" x2="8.5" y2="8" />
    <line x1="5.5" y1="10.5" x2="8.5" y2="10.5" />
  </svg>
);

export const MapaEditalIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="7.5" y="2" width="5" height="3.5" rx="1" />
    <line x1="10" y1="5.5" x2="10" y2="9" />
    <line x1="5" y1="9" x2="15" y2="9" />
    <line x1="5" y1="9" x2="5" y2="11.5" />
    <line x1="15" y1="9" x2="15" y2="11.5" />
    <rect x="2" y="11.5" width="6" height="3.5" rx="1" />
    <rect x="12" y="11.5" width="6" height="3.5" rx="1" />
  </svg>
);

export const CronogramaIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2.5" y="3.5" width="15" height="14" rx="1.5" />
    <line x1="2.5" y1="7.5" x2="17.5" y2="7.5" />
    <line x1="6.5" y1="2" x2="6.5" y2="5" />
    <line x1="13.5" y1="2" x2="13.5" y2="5" />
    <line x1="8" y1="7.5" x2="8" y2="17.5" opacity="0.3" />
    <line x1="12" y1="7.5" x2="12" y2="17.5" opacity="0.3" />
    <line x1="2.5" y1="11.5" x2="17.5" y2="11.5" opacity="0.3" />
    <path d="M5 9.5l1 1 2-2" strokeWidth={1.8} />
  </svg>
);

export const DashboardIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="2.5" y1="16" x2="17.5" y2="16" />
    <rect x="3.5" y="12" width="3" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.3" />
    <rect x="8.5" y="9" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" opacity="0.5" />
    <rect x="13.5" y="5.5" width="3" height="10.5" rx="0.5" fill="currentColor" stroke="none" />
    <path d="M5 11.5 L10 8.5 L15 5" strokeWidth={1.2} opacity="0.6" />
  </svg>
);

export const FlameIcon = ({ size = 20, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2C12 2 8 6 8 10C8 12.2 9.8 14 12 14C14.2 14 16 12.2 16 10C16 8 14 5 14 5C14 5 13.5 7 12 7C10.5 7 10 5.5 10 5C10 5 12 2 12 2Z" />
    <path d="M12 14C9.2 14 7 16.2 7 19C7 21 9 22 12 22C15 22 17 21 17 19C17 16.2 14.8 14 12 14Z" />
  </svg>
);

export const TargetIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="7.5" />
    <circle cx="10" cy="10" r="4.5" opacity="0.5" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const LayersIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="10 3 3 6.5 10 10 17 6.5 10 3" />
    <polyline points="3 10.5 10 14 17 10.5" opacity="0.6" />
    <polyline points="3 14.5 10 18 17 14.5" opacity="0.3" />
  </svg>
);

export const ClockIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="7.5" />
    <polyline points="10 5.5 10 10 13 12" />
  </svg>
);

export const CheckCircleIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="7.5" opacity="0.3" />
    <path d="M6.5 10l2.5 2.5 5-5" strokeWidth={strokeWidth * 1.2} />
  </svg>
);

export const CheckIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="4 10 8 14 16 6" strokeWidth={strokeWidth * 1.1} />
  </svg>
);

export const ShieldIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 2.5S4 4.5 4 8.5c0 5 6 9 6 9s6-4 6-9c0-4-6-6-6-6z" />
  </svg>
);

export const AwardIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="8" r="5" />
    <polyline points="7.5 12.5 6 17.5 10 15 14 17.5 12.5 12.5" />
  </svg>
);

export const MedalIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="13" r="4" />
    <path d="M7 2.5l1.5 5.5M13 2.5l-1.5 5.5" />
  </svg>
);

export const StarIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="10 2.5 12.3 7.2 17.5 7.9 13.7 11.6 14.6 16.8 10 14.4 5.4 16.8 6.3 11.6 2.5 7.9 7.7 7.2 10 2.5" />
  </svg>
);

export const AlertTriangleIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 2.5L2.5 16.5h15L10 2.5z" />
    <line x1="10" y1="8" x2="10" y2="11.5" />
    <circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export const BookOpenIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 4.5v12M3.5 5h5a2 2 0 012 2v9.5a1.5 1.5 0 00-1.5-1.5h-5.5V5zM16.5 5h-5a2 2 0 00-2 2v9.5a1.5 1.5 0 011.5-1.5h5.5V5z" />
  </svg>
);

export const FileTextIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M12 3v4h4" opacity="0.5" />
    <line x1="6.5" y1="8" x2="13.5" y2="8" />
    <line x1="6.5" y1="11" x2="13.5" y2="11" />
    <line x1="6.5" y1="14" x2="10" y2="14" opacity="0.6" />
  </svg>
);

export const BrainCircuitIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 3a4 4 0 00-4 4c0 1.5.8 2.8 2 3.5V13h4v-2.5c1.2-.7 2-2 2-3.5a4 4 0 00-4-4z" />
    <line x1="8.5" y1="15.5" x2="11.5" y2="15.5" />
    <line x1="9" y1="17.5" x2="11" y2="17.5" />
    <circle cx="10" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const UserIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="6" r="3.5" />
    <path d="M3.5 17c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" />
  </svg>
);

export const FolderIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 4.5h4.5l2 2H17a1 1 0 011 1V15a1 1 0 01-1 1H3a1 1 0 01-1-1V5.5a1 1 0 011-1z" />
  </svg>
);

export const ZapIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="11 2 3.5 11 10 11 9 18 16.5 9 10 9 11 2" />
  </svg>
);

export const BeakerIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 2.5h6M8.5 2.5v4L4 14.5a1.5 1.5 0 001.3 2.2h9.4a1.5 1.5 0 001.3-2.2L11.5 6.5v-4" />
    <line x1="6.2" y1="12" x2="13.8" y2="12" opacity="0.5" />
  </svg>
);

export const ArrowRightIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3.5" y1="10" x2="16.5" y2="10" />
    <polyline points="11.5 5 16.5 10 11.5 15" />
  </svg>
);

export const LockIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4.5" y="9" width="11" height="8.5" rx="1.5" />
    <path d="M7 9V6a3 3 0 016 0v3" />
  </svg>
);

export const SettingsIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 2.5v1.5M10 16v1.5M4.7 4.7l1 1M14.3 14.3l1 1M2.5 10h1.5M16 10h1.5M4.7 15.3l1-1M14.3 5.7l1-1" />
  </svg>
);

export const Trash2Icon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3.5 5h13M7.5 5V3.5a1 1 0 011-1h3a1 1 0 011 1V5M15 5v11.5a1 1 0 01-1 1H6a1 1 0 01-1-1V5" />
    <line x1="8.5" y1="8.5" x2="8.5" y2="13.5" opacity="0.6" />
    <line x1="11.5" y1="8.5" x2="11.5" y2="13.5" opacity="0.6" />
  </svg>
);

export const PencilIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M13.5 3.5l3 3L6.5 16.5H3.5v-3L13.5 3.5z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// ÍCONES DE ESTATÍSTICAS E DASHBOARD NO PADRÃO ZION (20x20)
// ═══════════════════════════════════════════════════════════════

export const BarChartIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="2.5" y1="16.5" x2="17.5" y2="16.5" />
    <rect x="3.5" y="10" width="3" height="6.5" rx="0.75" />
    <rect x="8.5" y="6" width="3" height="10.5" rx="0.75" />
    <rect x="13.5" y="3" width="3" height="13.5" rx="0.75" />
  </svg>
);

export const SparklesIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 2.5C10 6 11.5 8.5 15.5 8.5C11.5 8.5 10 11 10 14.5C10 11 8.5 8.5 4.5 8.5C8.5 8.5 10 6 10 2.5Z" />
    <path
      d="M15 13.5C15 15 15.6 15.8 17 15.8C15.6 15.8 15 16.6 15 18C15 16.6 14.4 15.8 13 15.8C14.4 15.8 15 15 15 13.5Z"
      opacity="0.6"
    />
  </svg>
);

export const BuildingIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3.5" y="3.5" width="8" height="13.5" rx="1" />
    <path d="M11.5 7.5h4a1 1 0 011 1v8.5h-5" />
    <line x1="6" y1="6.5" x2="7.5" y2="6.5" />
    <line x1="9" y1="6.5" x2="9.5" y2="6.5" />
    <line x1="6" y1="9.5" x2="7.5" y2="9.5" />
    <line x1="9" y1="9.5" x2="9.5" y2="9.5" />
    <line x1="6" y1="12.5" x2="7.5" y2="12.5" />
    <line x1="9" y1="12.5" x2="9.5" y2="12.5" />
    <line x1="13.5" y1="11" x2="14.5" y2="11" opacity="0.6" />
    <line x1="13.5" y1="14" x2="14.5" y2="14" opacity="0.6" />
  </svg>
);

export const CreditCardIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2.5" y="4" width="15" height="12" rx="1.5" />
    <line x1="2.5" y1="8" x2="17.5" y2="8" />
    <line x1="5.5" y1="12.5" x2="9.5" y2="12.5" />
  </svg>
);

export const HelpCircleIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="7.5" />
    <path d="M7.5 7.5a2.5 2.5 0 014.5 1.5c0 1.5-2 2-2 3" />
    <circle cx="10" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export const ContactIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
    <circle cx="8" cy="8" r="2" />
    <path d="M5 13.5c0-1.8 1.5-2.5 3-2.5s3 .7 3 2.5" />
    <line x1="12.5" y1="7.5" x2="15" y2="7.5" opacity="0.6" />
    <line x1="12.5" y1="10" x2="15" y2="10" opacity="0.6" />
  </svg>
);

export const TrendingUpIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="3 14 8 9 12 12 17 6" />
    <polyline points="13 6 17 6 17 10" />
  </svg>
);

export const PlayIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="6 4.5 16 10 6 15.5 6 4.5" />
  </svg>
);

export const RotateCcwIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3.5 8A6.5 6.5 0 113.8 12" />
    <polyline points="3.5 4 3.5 8 7.5 8" />
  </svg>
);

export const GamepadIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2.5" y="6" width="15" height="9" rx="3.5" />
    <line x1="5.5" y1="10.5" x2="8.5" y2="10.5" />
    <line x1="7" y1="9" x2="7" y2="12" />
    <circle cx="12.5" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="9.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export const TrophyIcon = ({ size = 18, className, strokeWidth = 1.5 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5.5 3.5h9v5a4.5 4.5 0 01-9 0v-5z" />
    <path d="M5.5 5.5H3a1.5 1.5 0 00-1.5 1.5v.5A2.5 2.5 0 004 10h1.5" />
    <path d="M14.5 5.5H17a1.5 1.5 0 011.5 1.5v.5A2.5 2.5 0 0116 10h-1.5" />
    <line x1="10" y1="13" x2="10" y2="16.5" />
    <line x1="6.5" y1="16.5" x2="13.5" y2="16.5" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// ALIASES PARA COMPATIBILIDADE RETROATIVA TOTAL
// ═══════════════════════════════════════════════════════════════
export {
  BookOpenIcon as BookOpen,
  BarChartIcon as BarChart3,
  ClockIcon as Clock,
  SparklesIcon as Sparkles,
  UserIcon as User,
  SettingsIcon as Settings,
  HelpCircleIcon as HelpCircle,
  BeakerIcon as FlaskConical,
  CreditCardIcon as CreditCard,
  BuildingIcon as Building2,
  TargetIcon as Target,
  LayersIcon as Layers,
  FlameIcon as Flame,
  TrophyIcon as Trophy,
  RotateCcwIcon as History,
  RotateCcwIcon as RotateCcw,
  PlayIcon as Play,
  CheckCircleIcon as CheckCircle2,
  FileTextIcon as FileText,
  Trash2Icon as Trash2,
  PencilIcon as Edit2,
  TrendingUpIcon as TrendingUp,
  GamepadIcon as Gamepad2,
};

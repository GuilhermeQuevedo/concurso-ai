// Logo da marca Engrama: um "E" feito de conexões (o traço da memória).
// As três hastes lembram os três estágios da memória; o nó do meio, em
// âmbar, é o conteúdo que foi codificado e ficou. Usa currentColor nas
// hastes/nós para herdar a cor do contexto (branco no header colorido, etc.).
export function EngramaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M6 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 5H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 12H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 19H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6" cy="5" r="1.5" fill="currentColor" />
      <circle cx="6" cy="19" r="1.5" fill="currentColor" />
      <circle cx="17" cy="5" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19" r="1.3" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="6" cy="12" r="2.4" fill="#F2A93B" />
    </svg>
  );
}

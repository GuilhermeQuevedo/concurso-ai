// Ícone oficial da marca Engrama: "E" de hastes arredondadas em Papel sobre
// fundo Tinta; nós branco no topo e na base; nó central em Âmbar (o conteúdo
// que foi codificado e ficou). Vetor — nítido em qualquer tamanho.
export function EngramaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="1024" height="1024" rx="232" fill="#121A33" />
      <g stroke="#F5F6F8" strokeWidth="60" strokeLinecap="round" fill="none">
        <path d="M360 302V722" />
        <path d="M360 302H662" />
        <path d="M360 512H556" />
        <path d="M360 722H662" />
      </g>
      <circle cx="688" cy="302" r="56" fill="#F5F6F8" />
      <circle cx="688" cy="722" r="56" fill="#F5F6F8" />
      <circle cx="598" cy="512" r="74" fill="#F2A93B" />
    </svg>
  );
}

/**
 * Frontend Security Guardrail
 * Proteção ativa contra inspeção, DevTools, Self-XSS, Clickjacking e extração de dados sensíveis.
 */

export function initializeFrontendSecurity(): void {
  // Executa apenas em ambiente de produção
  if (import.meta.env.DEV) {
    return;
  }

  // 1. Bloqueia o menu de contexto (botão direito -> Inspecionar elemento)
  document.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
  });

  // 2. Bloqueia atalhos de teclado de abertura do DevTools e visualização de código-fonte
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    // Tecla F12
    if (event.key === 'F12') {
      event.preventDefault();
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShiftOrAlt = event.shiftKey || event.altKey;

    // Atalhos:
    // Ctrl + Shift + I (Inspecionar)
    // Ctrl + Shift + J (Console)
    // Ctrl + Shift + C (Selecionador de elementos)
    // Ctrl + U (Código-fonte)
    // Ctrl + S (Salvar página)
    const blockedKeys = ['i', 'I', 'j', 'J', 'c', 'C', 'u', 'U', 's', 'S'];
    if (isCtrlOrCmd && (isShiftOrAlt || ['u', 'U', 's', 'S'].includes(event.key))) {
      if (blockedKeys.includes(event.key)) {
        event.preventDefault();
      }
    }
  });

  // 3. Proteção contra Clickjacking e Framing por sites de terceiros
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.self.location.href;
    }
  } catch {
    // Caso de sandbox cross-origin
  }

  // 4. Banner de aviso contra Self-XSS e ataques de engenharia social no Console
  try {
    const titleStyle = 'color: #dc2626; font-size: 26px; font-weight: 800; -webkit-text-stroke: 1px black;';
    const messageStyle = 'color: #475569; font-size: 14px; line-height: 1.6; font-weight: 500;';
    console.log('%c⚠️ ÁREA DE SEGURANÇA RESTRITA', titleStyle);
    console.log(
      '%cEsta interface é restrita aos usuários autenticados da plataforma Engrama.\n' +
      'NUNCA cole códigos, tokens ou comandos instruídos por terceiros nesta aba (ataque Self-XSS).\n' +
      'Todas as credenciais sensíveis e chaves de IA são mantidas exclusivamente no servidor seguro e não residem no navegador.',
      messageStyle,
    );
  } catch {
    // Protege contra ambientes sem console nativo
  }
}

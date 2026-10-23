export const EmailTemplates = {
  passwordReset(name: string, resetUrl: string): { html: string; text: string } {
    const firstName = name.trim().split(' ')[0] ?? 'Estudante';

    const text = `Olá, ${firstName}!\n\nRecebemos uma solicitação para redefinir a sua senha no Engrama.\n\nPara cadastrar uma nova senha, acesse o link abaixo (válido por 30 minutos):\n${resetUrl}\n\nSe você não solicitou a redefinição de senha, desconsidere esta mensagem. Sua conta permanece segura.\n\nEquipe Engrama`;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha - Engrama</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 36px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Engrama</h1>
              <p style="margin: 6px 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">Inteligência Artificial & Neurociência para Concursos</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 700;">Redefinição de Senha</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Olá, <strong>${firstName}</strong>!
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Engrama</strong>. Clique no botão abaixo para cadastrar sua nova senha:
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">
                      Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin: 24px 0 20px;">
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  ⏱️ <strong>Atenção:</strong> Por motivos de segurança, este link é válido por <strong>30 minutos</strong> e só pode ser utilizado uma única vez.
                </p>
              </div>

              <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Se o botão não funcionar, copie e cole o endereço abaixo no seu navegador:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; color: #6366f1; word-break: break-all;">
                <a href="${resetUrl}" style="color: #6366f1; text-decoration: underline;">${resetUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                Se você não solicitou esta redefinição, fique tranquilo: nenhuma alteração foi feita e sua conta permanece totalmente segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} Engrama. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return { html, text };
  },

  welcome(name: string, loginUrl: string): { html: string; text: string } {
    const firstName = name.trim().split(' ')[0] ?? 'Estudante';

    const text = `Olá, ${firstName}!\n\nSeja muito bem-vindo ao Engrama!\n\nSua conta foi criada com sucesso. Acesse a plataforma e comece a estudar:\n${loginUrl}\n\nBons estudos!\nEquipe Engrama`;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Engrama</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 36px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800;">Engrama</h1>
              <p style="margin: 6px 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">O que você estuda, fica.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 700;">Bem-vindo ao time dos aprovados!</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Olá, <strong>${firstName}</strong>! Estamos felizes em ter você aqui.
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Sua conta no Engrama está pronta. Explore questões no padrão da sua banca geradas por IA, flashcards com repetição espaçada e seu plano de estudos diário.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
                      Começar a Estudar Agora
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} Engrama. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return { html, text };
  },
};

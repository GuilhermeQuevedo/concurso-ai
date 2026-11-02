import type { StudySchedule } from '../types';

export function exportScheduleToCsv(schedule: StudySchedule): void {
  if (!schedule || !schedule.schedule || !schedule.schedule.weeks) return;

  let csv = 'Semana,Fase,Data,Dia,Materia,Tipo,Horas,Concluido,Observacoes\n';
  schedule.schedule.weeks.forEach((week) => {
    week.days.forEach((day) => {
      if (day.blocks && day.blocks.length > 0) {
        day.blocks.forEach((b) => {
          csv += `"${week.weekNumber}","${week.phase}","${day.date}","${day.dayOfWeek}","${(b.subject || '').replace(/"/g, '""')}","${b.type}","${b.hours}","${day.completed ? 'Sim' : 'Nao'}","${(b.notes || '').replace(/"/g, '""')}"\n`;
        });
      } else {
        csv += `"${week.weekNumber}","${week.phase}","${day.date}","${day.dayOfWeek}","${(day.subject || '').replace(/"/g, '""')}","${day.type}","${day.totalHours || day.hours || 0}","${day.completed ? 'Sim' : 'Nao'}",""\n`;
      }
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cronograma_Estudos_${schedule.examDate || schedule.exam_date || 'Plano'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportScheduleToPrint(schedule: StudySchedule, userName = 'Estudante'): void {
  if (!schedule || !schedule.schedule || !schedule.schedule.weeks) return;

  const title = schedule.schedule.title || `Cronograma de Estudos - Prova em ${schedule.examDate || schedule.exam_date}`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  let weeksHtml = '';
  schedule.schedule.weeks.forEach((week) => {
    let daysHtml = '';
    week.days.forEach((day) => {
      let blocksHtml = '';
      if (day.blocks && day.blocks.length > 0) {
        day.blocks.forEach((b) => {
          blocksHtml += `
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #e2e8f0; font-size:12px;">
              <span><strong>${b.subject}</strong> <span style="color:#64748b;">(${b.type.toUpperCase()}${b.priority === 'alta' ? ' - FOCO' : ''})</span></span>
              <span>${b.hours}h</span>
            </div>
          `;
        });
      } else {
        blocksHtml = `<div style="font-size:12px; color:#64748b;">${day.subject || 'Descanso / Livre'} (${day.totalHours || day.hours || 0}h)</div>`;
      }

      daysHtml += `
        <div style="margin-bottom:10px; padding:8px 12px; border:1px solid #e2e8f0; border-radius:6px; background:${day.completed ? '#f8fafc' : '#ffffff'};">
          <div style="display:flex; justify-content:space-between; font-weight:600; font-size:13px; margin-bottom:6px; color:#1e293b;">
            <span>${day.dayOfWeek} - ${day.date} ${day.completed ? '✓ (Concluído)' : ''}</span>
            <span>${day.totalHours || day.hours || 0}h</span>
          </div>
          ${blocksHtml}
        </div>
      `;
    });

    weeksHtml += `
      <div style="page-break-inside:avoid; margin-bottom:24px;">
        <h3 style="font-size:16px; margin:0 0 10px 0; padding-bottom:4px; border-bottom:2px solid #3b82f6; color:#0f172a;">
          Semana ${week.weekNumber} <span style="font-size:12px; font-weight:normal; color:#64748b;">[Fase: ${week.phase.toUpperCase()}]</span>
        </h3>
        <div style="display:grid; grid-template-columns:1fr; gap:8px;">
          ${daysHtml}
        </div>
      </div>
    `;
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1 { font-size: 20px; margin: 0 0 6px 0; }
        .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div>
          <h1>${title}</h1>
          <div class="meta">Aluno: ${userName} | Carga Diária: ${schedule.dailyHours || schedule.daily_hours}h/dia | Data da Prova: ${schedule.examDate || schedule.exam_date}</div>
        </div>
        <button onclick="window.print()" style="padding:8px 16px; background:#3b82f6; color:#ffffff; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Imprimir / Salvar PDF</button>
      </div>
      <hr style="border:none; border-top:1px solid #cbd5e1; margin-bottom:20px;" />
      ${weeksHtml}
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

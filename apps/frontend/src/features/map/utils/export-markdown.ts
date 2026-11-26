import type { GraphNode, GraphEdge } from '../types/map.types';

export interface ExportMarkdownOptions {
  readonly title?: string;
  readonly date?: Date;
  readonly includeStats?: boolean;
}

interface TreeNodeItem {
  readonly node: GraphNode;
  readonly children: TreeNodeItem[];
}

function buildTree(nodes: readonly GraphNode[]): TreeNodeItem[] {
  const nodeMap = new Map<string, TreeNodeItem>();
  for (const node of nodes) {
    nodeMap.set(node.id, { node, children: [] });
  }

  const roots: TreeNodeItem[] = [];
  for (const item of nodeMap.values()) {
    const parent = item.node.parentId ? nodeMap.get(item.node.parentId) : undefined;
    if (parent) {
      parent.children.push(item);
    } else {
      roots.push(item);
    }
  }

  roots.sort((a, b) => a.node.order - b.node.order);
  for (const item of nodeMap.values()) {
    item.children.sort((a, b) => a.node.order - b.node.order);
  }

  return roots;
}

/**
 * Utilitário puro para geração de resumo estruturado do edital em Markdown
 * compatível com Obsidian, Notion e Logseq.
 *
 * Não inclui dados privados ou pessoais do usuário (LGPD by design).
 */
export function generateSyllabusMarkdown(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[] = [],
  options: ExportMarkdownOptions = {}
): string {
  const {
    title = 'Mapa de Revisão do Edital — Concurso AI',
    date = new Date(),
    includeStats = true,
  } = options;

  const dateStr = date.toLocaleDateString('pt-BR');
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push(`> Exportado em: ${dateStr}`);
  lines.push('');

  if (includeStats) {
    lines.push('## Resumo Geral');
    lines.push(`- **Total de Tópicos:** ${nodes.length}`);
    lines.push(`- **Relações Interdisciplinares:** ${edges.length}`);
    lines.push('');
  }

  lines.push('## Estrutura do Edital');
  const roots = buildTree(nodes);

  const appendTreeItem = (item: TreeNodeItem, indentLevel: number) => {
    const indent = '  '.repeat(indentLevel);
    const incidenceBadge = item.node.incidenceWeight > 0 ? ` [Incidência: ${item.node.incidenceWeight}]` : '';
    const levelPrefix = item.node.level === 'DISCIPLINE' ? '### ' : `${indent}- `;
    
    if (item.node.level === 'DISCIPLINE') {
      lines.push(`${levelPrefix}${item.node.name}`);
    } else {
      lines.push(`${levelPrefix}**${item.node.name}**${incidenceBadge}`);
    }

    for (const child of item.children) {
      appendTreeItem(child, item.node.level === 'DISCIPLINE' ? 0 : indentLevel + 1);
    }
  };

  for (const root of roots) {
    appendTreeItem(root, 0);
    lines.push('');
  }

  // Relações interdisciplinares canônicas
  if (edges.length > 0) {
    lines.push('## Conexões e Relações entre Tópicos');
    const nodeMap = new Map(nodes.map((n) => [n.id, n.name]));

    for (const edge of edges) {
      const sourceName = nodeMap.get(edge.source) ?? edge.source;
      const targetName = nodeMap.get(edge.target) ?? edge.target;
      const typeLabel = edge.typeLabel || edge.type;
      lines.push(`- **${sourceName}** ➔ **${targetName}** (${typeLabel})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

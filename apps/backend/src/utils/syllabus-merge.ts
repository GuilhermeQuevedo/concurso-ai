export interface SyllabusEntryLike {
  discipline: string;
  topics: string[];
}

const norm = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export interface MergedTopic {
  discipline: string;
  topic: string;
}

// Tópicos da segunda leitura que o edital ainda não tem (compara sem acento e sem diferença de maiúsculas).
// Mantém o nome da disciplina já existente quando ela aparece de novo.
export function newTopics(existing: readonly SyllabusEntryLike[], incoming: readonly SyllabusEntryLike[]): MergedTopic[] {
  const known = new Map<string, { name: string; topics: Set<string> }>();
  for (const entry of existing) {
    const key = norm(entry.discipline);
    const bucket = known.get(key) ?? { name: entry.discipline, topics: new Set<string>() };
    for (const topic of entry.topics) bucket.topics.add(norm(topic));
    known.set(key, bucket);
  }

  const added: MergedTopic[] = [];
  for (const entry of incoming) {
    const key = norm(entry.discipline);
    const bucket = known.get(key) ?? { name: entry.discipline, topics: new Set<string>() };
    known.set(key, bucket);
    for (const topic of entry.topics) {
      const topicKey = norm(topic);
      if (!topicKey || bucket.topics.has(topicKey)) continue;
      bucket.topics.add(topicKey);
      added.push({ discipline: bucket.name, topic: topic.trim() });
    }
  }
  return added;
}

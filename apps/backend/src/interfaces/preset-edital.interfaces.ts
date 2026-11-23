import { z } from 'zod';

const disciplineSchema = z.object({
  name: z.string().min(1),
  topics: z.array(z.string().min(1)).min(1),
});

const cargoSchema = z.object({
  id: z.string().min(1),
  group: z.string().min(1),
  label: z.string().min(1),
  name: z.string().min(1),
  cargoCode: z.string(),
  track: z.enum(['magisterio', 'assistencia']),
  specific: z.array(disciplineSchema).min(1),
});

export const presetCatalogSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  shortName: z.string().min(1),
  organization: z.string().min(1),
  description: z.string(),
  shared: z.object({
    basicos: z.array(disciplineSchema),
    magisterio: z.array(disciplineSchema),
    assistencia: z.array(disciplineSchema),
  }),
  cargos: z.array(cargoSchema).min(1),
});

export type PresetDiscipline = z.infer<typeof disciplineSchema>;
export type PresetCargo = z.infer<typeof cargoSchema>;
export type PresetCatalog = z.infer<typeof presetCatalogSchema>;

export interface PresetCargoSummary {
  id: string;
  label: string;
  name: string;
  cargoCode: string;
  topicCount: number;
  disciplines: { name: string; topicCount: number }[];
}

export interface PresetCatalogSummary {
  id: string;
  title: string;
  organization: string;
  description: string;
  groups: { name: string; cargos: PresetCargoSummary[] }[];
}

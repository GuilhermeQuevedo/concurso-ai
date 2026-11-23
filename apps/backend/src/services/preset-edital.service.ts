import { PRESET_CATALOGS } from '../data/editais-prontos/index.js';
import { prisma } from '../database/prisma.js';
import type { PresetCatalog, PresetCatalogSummary } from '../interfaces/preset-edital.interfaces.js';
import { AppError } from '../middlewares/error-handler.js';
import { summarizeCatalog, syllabusRowsOf } from '../utils/preset-edital.js';

// Editais cujo conteúdo programático já está pronto: o aluno só escolhe o cargo, sem leitura pela IA.
export class PresetEditalService {
  constructor(private readonly catalogs: readonly PresetCatalog[] = PRESET_CATALOGS) {}

  list(): PresetCatalogSummary[] {
    return this.catalogs.map(summarizeCatalog);
  }

  async createContest(userId: string, catalogId: string, cargoId: string) {
    const catalog = this.catalogs.find((item) => item.id === catalogId);
    const cargo = catalog?.cargos.find((item) => item.id === cargoId);
    if (!catalog || !cargo) {
      throw new AppError(404, 'PRESET_NOT_FOUND', 'Edital pronto não encontrado');
    }

    return prisma.contest.create({
      data: {
        userId,
        name: `${catalog.shortName} – ${cargo.label}`,
        organization: catalog.organization,
        role: `${cargo.label}${cargo.cargoCode ? ` (${cargo.cargoCode})` : ''}`,
        syllabus: { create: syllabusRowsOf(catalog, cargo) },
      },
      include: { syllabus: { orderBy: { order: 'asc' } } },
    });
  }
}

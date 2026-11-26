import { presetCatalogSchema, type PresetCatalog } from '../../interfaces/preset-edital.interfaces.js';

import seedf2022 from './seedf-2022.json' with { type: 'json' };

// Cada edital pronto é um JSON conferido contra o PDF oficial; novos editais entram só aqui.
export const PRESET_CATALOGS: readonly PresetCatalog[] = [presetCatalogSchema.parse(seedf2022)];

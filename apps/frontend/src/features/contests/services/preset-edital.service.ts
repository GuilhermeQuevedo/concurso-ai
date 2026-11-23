import type { ApiResponse } from '@concurso-ai/types';

import { api, unwrapData } from '@/services/api';

import type { ContestDetail } from './contest.service';

export interface PresetCargo {
  id: string;
  label: string;
  name: string;
  cargoCode: string;
  topicCount: number;
  disciplines: { name: string; topicCount: number }[];
}

export interface PresetCatalog {
  id: string;
  title: string;
  organization: string;
  description: string;
  groups: { name: string; cargos: PresetCargo[] }[];
}

export const presetEditalService = {
  async list(): Promise<PresetCatalog[]> {
    const response = await api.get<ApiResponse<PresetCatalog[]>>('/preset-editais');
    return unwrapData(response);
  },

  async create(catalogId: string, cargoId: string): Promise<ContestDetail> {
    const response = await api.post<ApiResponse<ContestDetail>>('/preset-editais', { catalogId, cargoId });
    return unwrapData(response);
  },
};

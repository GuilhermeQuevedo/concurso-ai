import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

import type { Difficulty } from './question-set.service';

export interface BankFilters {
  examBoardId?: string;
  subjectId?: string;
  examYear?: number;
  organ?: string;
  area?: string;
  position?: string;
  difficulty?: Difficulty;
}

export interface FacetCount<T> {
  value: T;
  count: number;
}

export interface BankFacets {
  total: number;
  boards: Array<FacetCount<{ id: string; name: string }>>;
  subjects: Array<FacetCount<{ id: string; name: string }>>;
  years: Array<FacetCount<number>>;
  organs: Array<FacetCount<string>>;
  areas: Array<FacetCount<string>>;
  positions: Array<FacetCount<string>>;
}

export interface BuildBankSetParams extends BankFilters {
  name?: string;
  quantity: number;
  onlyUnanswered?: boolean;
}

export const questionBankService = {
  async facets(): Promise<BankFacets> {
    return unwrapData(await api.get<ApiResponse<BankFacets>>('/question-bank/facets'));
  },

  async count(filters: BankFilters): Promise<number> {
    const response = await api.get<ApiResponse<{ total: number }>>('/question-bank/count', { params: filters });
    return unwrapData(response).total;
  },

  async buildSet(params: BuildBankSetParams): Promise<{ id: string; name: string }> {
    return unwrapData(await api.post<ApiResponse<{ id: string; name: string }>>('/question-bank/set', params));
  },
};

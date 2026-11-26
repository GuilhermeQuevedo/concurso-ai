import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';
import type { GraphData, OverlayData, TopicFocusData } from '../types/map.types';

export interface MapGraphParams {
  rootTopicId?: string;
  depth?: number;
  disciplineId?: string;
  examBoardId?: string;
}

export const mapService = {
  async getGraph(params: MapGraphParams = {}): Promise<GraphData> {
    const response = await api.get<ApiResponse<GraphData>>('/map/graph', {
      params,
    });
    return unwrapData(response);
  },

  async getOverlay(disciplineId?: string): Promise<OverlayData> {
    const response = await api.get<ApiResponse<OverlayData>>('/map/overlay', {
      params: disciplineId ? { disciplineId } : {},
    });
    return unwrapData(response);
  },

  async getFocus(
    topicId: string,
    params: { cardsLimit?: number; errorsLimit?: number; relationsLimit?: number } = {},
  ): Promise<TopicFocusData> {
    const response = await api.get<ApiResponse<TopicFocusData>>(`/map/topics/${topicId}/focus`, {
      params,
    });
    return unwrapData(response);
  },
};

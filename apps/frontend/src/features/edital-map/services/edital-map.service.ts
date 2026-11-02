import { api, unwrapData } from '@/services/api';
import type { EditalMap, EditalTree } from '../types';

export const editalMapService = {
  async mapEdital(
    file: File,
    editalName: string,
    saveToDb = false,
  ): Promise<EditalMap> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('editalName', editalName);
    formData.append('saveToDb', String(saveToDb));

    const res = await api.post('/edital-maps/map', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return unwrapData(res);
  },

  async analyzeProbabilities(
    editalMapId: string,
    topicsTree: EditalTree,
    banca: string,
  ): Promise<EditalMap> {
    const res = await api.post('/edital-maps/analyze-probabilities', {
      editalMapId,
      topicsTree,
      banca,
    });
    return unwrapData(res);
  },

  async listEditais(): Promise<EditalMap[]> {
    const res = await api.get('/edital-maps');
    return unwrapData(res);
  },

  async getEdital(id: string): Promise<EditalMap> {
    const res = await api.get(`/edital-maps/${id}`);
    return unwrapData(res);
  },

  async saveEdital(editalMap: Partial<EditalMap>): Promise<EditalMap> {
    const res = await api.post('/edital-maps', {
      editalName: editalMap.editalName || editalMap.edital_name,
      banca: editalMap.banca || editalMap.topicsTree?.banca || editalMap.topics_tree?.banca,
      cargo: editalMap.cargo || editalMap.topicsTree?.cargo || editalMap.topics_tree?.cargo,
      topicsTree: editalMap.topicsTree || editalMap.topics_tree,
      coverageStatus: editalMap.coverageStatus || editalMap.coverage_status,
      probabilityAnalysis: editalMap.probabilityAnalysis || editalMap.probability_analysis,
    });
    return unwrapData(res);
  },

  async updateName(id: string, editalName: string): Promise<EditalMap> {
    const res = await api.patch(`/edital-maps/${id}/name`, { editalName });
    return unwrapData(res);
  },

  async deleteEdital(id: string): Promise<void> {
    await api.delete(`/edital-maps/${id}`);
  },
};

import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type EssayType = 'DISSERTATIVA' | 'ESTUDO_CASO';
export type EssayStatus = 'PENDING' | 'GRADING' | 'GRADED' | 'ERROR';

export interface EssayCriterion {
  score: number;
  maxScore: number;
  comments: string;
}

export interface EssayCriteria {
  cac: EssayCriterion;
  ot: EssayCriterion;
  dlp: EssayCriterion;
}

export interface CaseStudyAspect {
  aspect: string;
  situation: 'correto' | 'parcial' | 'incorreto' | 'ausente';
  points: number;
  maxPoints: number;
  justification: string;
}

export interface CaseStudyResult {
  score: number;
  maxScore: number;
  framing: string;
  aspects: CaseStudyAspect[];
  form: { strengths: string; issues: string; deduction: number };
  penalties: { reason: string; deduction: number }[];
  calculation: string;
  feedback: string[];
}

export interface EssaySummary {
  id: string;
  type: EssayType;
  title: string;
  theme: string;
  status: EssayStatus;
  score: number | null;
  maxScore: number | null;
  fileName: string | null;
  createdAt: string;
}

export interface EssayDetail extends EssaySummary {
  content: string;
  fileUrl: string | null;
  role: string | null;
  examBoard: string | null;
  caseStatement: string | null;
  answerKey: string | null;
  lineLimit: number | null;
  feedback: string | null;
  criteria: EssayCriteria | CaseStudyResult | null;
  competitionPoints?: number;
}

export interface SubmitEssayInput {
  type: EssayType;
  title: string;
  theme: string;
  content?: string;
  file?: File;
  role?: string;
  examBoard?: string;
  caseStatement?: string;
  answerKey?: string;
  lineLimit?: number;
}

export const essayService = {
  async submit(data: SubmitEssayInput): Promise<EssayDetail> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('theme', data.theme);
    if (data.content) formData.append('content', data.content);
    if (data.file) formData.append('file', data.file);
    if (data.role) formData.append('role', data.role);
    if (data.examBoard) formData.append('examBoard', data.examBoard);
    if (data.caseStatement) formData.append('caseStatement', data.caseStatement);
    if (data.answerKey) formData.append('answerKey', data.answerKey);
    if (data.lineLimit) formData.append('lineLimit', String(data.lineLimit));

    const response = await api.post<ApiResponse<EssayDetail>>('/essays', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
    });
    return unwrapData(response);
  },

  async list(): Promise<EssaySummary[]> {
    const response = await api.get<ApiResponse<EssaySummary[]>>('/essays');
    return unwrapData(response);
  },

  async getById(id: string): Promise<EssayDetail> {
    const response = await api.get<ApiResponse<EssayDetail>>(`/essays/${id}`);
    return unwrapData(response);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/essays/${id}`);
  },
};

export function isCaseStudyResult(c: EssayDetail['criteria']): c is CaseStudyResult {
  return !!c && 'aspects' in c;
}

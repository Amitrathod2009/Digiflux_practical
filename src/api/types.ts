import axios from 'axios';

export interface Coach {
  id: string;
  name: string;
  email: string;
  role: string;
  gymName: string;
  clientCount: number;
}

export type ClientGoal = 'fat_loss' | 'muscle_gain' | 'maintenance' | 'recomp';

export interface Client {
  id: string;
  name: string;
  goal: ClientGoal;
  startDateISO: string;
  heightCm: number;
  avatarColor: string;
}

export interface WeightEntry {
  id: string;
  clientId: string;
  dateISO: string;
  weightKg: number;
  note: string | null;
  source: string;
}

export type GirthSite = 'waist' | 'chest' | 'hip' | 'arm' | 'thigh';

export const GIRTH_SITES: GirthSite[] = ['waist', 'chest', 'hip', 'arm', 'thigh'];

export interface GirthEntry {
  id: string;
  clientId: string;
  dateISO: string;
  site: GirthSite;
  valueMm: number;
  source: string;
}

export interface LoginResponse {
  token: string;
  coach: Coach;
}

export interface ListResponse<T> {
  items: T[];
}

export interface ApiFailure {
  status: number | null;
  code: string;
  field?: string;
  message: string;
}

interface ApiErrorBody {
  error?: { code?: string; field?: string; message?: string };
}

export function toApiFailure(err: unknown): ApiFailure {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? null;
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) {
      return {
        status,
        code: body.error.code ?? 'UNKNOWN',
        field: body.error.field,
        message: body.error.message,
      };
    }
    if (status === null) {
      return {
        status: null,
        code: 'NETWORK',
        message: 'Cannot reach the server. Check your connection and try again.',
      };
    }
    return { status, code: 'HTTP_ERROR', message: `The server responded with ${status}.` };
  }
  return {
    status: null,
    code: 'UNKNOWN',
    message: 'Something went wrong. Please try again.',
  };
}

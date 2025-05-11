import axios from 'axios';

export interface WorkspaceResource {
  id: string;
  key: string;
  cpu: string;
  memory: string;
  label?: string;
  description?: string;
  namespace: string;
  ingressClass: string;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceData {
  cpu: string;
  memory: string;
  label?: string;
  description?: string;
  namespace: string;
  ingressClass: string;
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 추가
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'API 호출 중 오류가 발생했습니다.');
  }
);

export async function getResources(): Promise<WorkspaceResource[]> {
  try {
    const response = await api.get<WorkspaceResource[]>('/workspace-resources');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    throw error;
  }
}

export async function getResource(id: string): Promise<WorkspaceResource> {
  try {
    const response = await api.get<WorkspaceResource>(`/workspace-resources/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch resource ${id}:`, error);
    throw error;
  }
}

export async function createResource(data: CreateResourceData): Promise<WorkspaceResource> {
  try {
    const response = await api.post<WorkspaceResource>('/workspace-resources', data);
    return response.data;
  } catch (error) {
    console.error('Failed to create resource:', error);
    throw error;
  }
}

export async function updateResource(id: string, data: Partial<CreateResourceData>): Promise<WorkspaceResource> {
  try {
    const response = await api.patch<WorkspaceResource>(`/workspace-resources/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update resource ${id}:`, error);
    throw error;
  }
}

export async function deleteResource(id: string): Promise<void> {
  try {
    await api.delete(`/workspace-resources/${id}`);
  } catch (error) {
    console.error(`Failed to delete resource ${id}:`, error);
    throw error;
  }
} 
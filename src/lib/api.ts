import { ApiError, NetworkError, UnauthorizedError } from './errors';
import { useAuthStore } from '@/stores/auth';

// Backend API configuration
export const API_CONFIG = {
  BASE_URL: (import.meta.env.VITE_API_URL || 'https://rabhana.fly.dev').replace(/\/+$/, ''),
  API_PATH: '/api/v1',
  get FULL_URL() {
    return `${this.BASE_URL}${this.API_PATH}`;
  }
};

// Helper to construct full image URLs from backend paths
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  // If already an absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Prepend base URL to relative paths
  return `${API_CONFIG.BASE_URL}${imagePath}`;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_CONFIG.FULL_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        useAuthStore.getState().logout();
        throw new UnauthorizedError();
      }

      const errorData = await response.json().catch(() => ({ 
        message: 'An error occurred',
        code: 'UNKNOWN_ERROR'
      }));
      
      throw new ApiError(
        response.status,
        errorData.error || errorData.code || 'UNKNOWN_ERROR',
        errorData.message || 'An error occurred',
        errorData
      );
    }

    return response.json();
  } catch (error) {
    // Network errors (fetch throws on network failure)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError();
    }
    
    // Re-throw known errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Unknown errors
    throw new ApiError(500, 'UNKNOWN_ERROR', 'An unexpected error occurred');
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  upload: async <T>(path: string, file: File): Promise<T> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_CONFIG.FULL_URL}${path}`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new UnauthorizedError();
        }

        const errorData = await response.json().catch(() => ({ 
          message: 'Upload failed',
          code: 'UPLOAD_FAILED'
        }));
        
        throw new ApiError(
          response.status,
          errorData.error || errorData.code || 'UNKNOWN_ERROR',
          errorData.message || 'Upload failed',
          errorData
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError();
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'UPLOAD_FAILED', 'Upload failed');
    }
  },
};

export async function suspendUser(publicId: string, reason: string, durationHours?: number): Promise<void> {
  await api.post(`/admin/users/${publicId}/suspend`, { reason, ...(durationHours !== undefined && { duration_hours: durationHours }) });
}

export async function unsuspendUser(publicId: string): Promise<void> {
  await api.post(`/admin/users/${publicId}/unsuspend`, {});
}

export async function banUser(publicId: string, reason: string): Promise<void> {
  await api.post(`/admin/users/${publicId}/ban`, { reason });
}

export async function unbanUser(publicId: string): Promise<void> {
  await api.post(`/admin/users/${publicId}/unban`, {});
}

export { ApiError, NetworkError, UnauthorizedError } from './errors';

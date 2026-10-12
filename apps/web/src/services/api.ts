const BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId?: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('gymos_access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    try {
      const data = await res.json();
      return data;
    } catch {
      return {
        success: false,
        error: {
          code: res.status ? `HTTP_${res.status}` : 'PARSE_ERROR',
          message: res.statusText || 'Unable to parse server response.',
        },
      };
    }
  }

  async get<T = any>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Network connection error. Please verify the server is running.',
        },
      };
    }
  }

  async post<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Network connection error. Please verify the server is running.',
        },
      };
    }
  }

  async put<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Network connection error. Please verify the server is running.',
        },
      };
    }
  }

  async patch<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Network connection error. Please verify the server is running.',
        },
      };
    }
  }


  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Network connection error. Please verify the server is running.',
        },
      };
    }
  }
}

export const api = new ApiClient();

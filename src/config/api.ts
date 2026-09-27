const API_URL = (import.meta.env.VITE_API_URL || 'https://focusflow-api-snij.onrender.com').replace(/\/+$/, '');

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  fields?: Record<string, string>;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const token = localStorage.getItem('focusflow_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      if (res.status === 401 && !res.url.includes('/auth/login')) {
        localStorage.removeItem('focusflow_token');
        localStorage.removeItem('focusflow_user');
        window.dispatchEvent(new Event('focusflow_logout'));
      }

      let errorMsg = `Erro na requisição (${res.status})`;
      try {
        const errorJson: ApiErrorResponse = await res.json();
        if (errorJson.message) {
          errorMsg = errorJson.message;
        } else if (errorJson.fields) {
          errorMsg = Object.values(errorJson.fields).join(', ');
        }
      } catch {
        // Ignora caso corpo não seja JSON
      }

      throw new Error(errorMsg);
    }

    if (res.status === 204) {
      return null as unknown as T;
    }

    return res.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T = void>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res);
  }
}

export const api = new ApiClient();
export { API_URL };
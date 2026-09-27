import { api } from '../config/api';

export interface AuthResponse {
  token: string;
  idUsuario: string;
  nome: string;
  email: string;
}

export interface UserMe {
  idUsuario: string;
  nome: string;
  email: string;
  role: string;
}

export const authService = {
  async login(email: string, senha: string): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>('/auth/login', { email, senha });
    localStorage.setItem('focusflow_token', data.token);
    localStorage.setItem('focusflow_user', JSON.stringify({
      id: data.idUsuario,
      name: data.nome,
      email: data.email,
    }));
    return data;
  },

  async register(nome: string, email: string, senha: string): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>('/auth/register', { nome, email, senha });
    localStorage.setItem('focusflow_token', data.token);
    localStorage.setItem('focusflow_user', JSON.stringify({
      id: data.idUsuario,
      name: data.nome,
      email: data.email,
    }));
    return data;
  },

  async getMe(): Promise<UserMe> {
    return api.get<UserMe>('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('focusflow_token');
    localStorage.removeItem('focusflow_user');
  },
};
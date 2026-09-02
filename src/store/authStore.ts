import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthState, AuthActions } from './types';


// Aqui unificamos o State e as Actions
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // Estado Inicial
  user: null,
  token: null,
  isLoading: true, // Começa em true enquanto checamos se o usuário já tem login salvo

  // Ação de Login: Salva no SecureStore e atualiza o estado global
  signIn: async (user, token) => {
    await SecureStore.setItemAsync('token', token);
    set({ user, token, isLoading: false });
  },

  // Ação de Logout: Remove do SecureStore e limpa o estado
  signOut: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ user: null, token: null, isLoading: false });
  },

  // Busca o token salvo ao iniciar o app
  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      
      if (token) {
        // TODO: Num cenário real, você bate na API do backend (/me)
        // usando esse token para pegar os dados do 'user' renovados.
        // Simulando que validamos o token:
        set({ token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      // Se não conseguir acessar o SecureStore por algum motivo
      set({ isLoading: false });
    }
  },
}));

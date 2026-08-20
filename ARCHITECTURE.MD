# 📚 Manual de Arquitetura - Mapeamento de Acidentes

## Visão Geral

Este documento descreve a arquitetura do projeto de Mapeamento de Acidentes, construído com React Native + Expo Router. O objetivo é fornecer um guia completo para desenvolvedores que desejam contribuir com o projeto, explicando as decisões arquiteturais, padrões de organização e boas práticas adotadas.

---

## 🏗️ Princípios Arquiteturais

O projeto segue os seguintes princípios fundamentais:

1. **Separação de Responsabilidades (SoC)**: Cada módulo tem uma responsabilidade clara e bem definida
2. **Feature-First Architecture**: Organização por domínio de negócio, não por tipo técnico
3. **File-based Routing**: Rotas definidas pela estrutura de pastas (Expo Router)
4. **Type Safety**: TypeScript em todo o projeto para prevenção de erros
5. **Escalabilidade**: Estrutura preparada para crescimento sem refatoração significativa
6. **Testabilidade**: Componentes isolados e testáveis

---

## 📁 Estrutura de Diretórios

### Hierarquia Principal

```
accident-mapping-app/
├── app/                    # Rotas (Expo Router)
├── src/                    # Código fonte
│   ├── features/          # Features por domínio
│   ├── shared/            # Código compartilhado
│   ├── api/               # Configuração de API
│   ├── stores/            # Estado global
│   └── providers/         # Providers React
├── assets/                # Recursos estáticos
└── tests/                 # Testes
```

### Por que essa estrutura?

#### 1. Separação entre `app/` e `src/`

```
app/     → Responsável APENAS por roteamento
src/     → Toda a lógica de negócio e componentes
```

**Motivação**: O Expo Router usa convenção de file-based routing onde cada arquivo em `app/` vira uma rota. Manter as telas finas (thin screens) e a lógica em `src/` facilita:
- Testes unitários sem necessidade de mockar navegação
- Reutilização de componentes em diferentes rotas
- Migração futura de framework de navegação

---

## 🎯 Feature-Based Architecture

### Estrutura de uma Feature

```
src/features/
└── map/
    ├── components/      # Componentes React específicos
    ├── hooks/          # Hooks customizados
    ├── services/       # Chamadas de API
    ├── types/          # Tipos TypeScript
    └── index.ts        # Barrels exports
```

### Por que organizar por features?

**Problema com organização por tipo técnico:**
```
src/
├── components/
│   ├── MapView.tsx
│   ├── AccidentCard.tsx
│   └── LoginForm.tsx
├── services/
│   ├── mapService.ts
│   ├── accidentService.ts
│   └── authService.ts
└── types/
    ├── map.types.ts
    ├── accident.types.ts
    └── auth.types.ts
```

**Problemas desta abordagem:**
- Para adicionar uma feature, é preciso modificar 3+ diretórios
- Difícil identificar o escopo de cada feature
- Acoplamento entre features diferentes
- Complexidade para remover ou modificar features

**Vantagens da Feature-Based:**
- **Coesão**: Tudo relacionado a uma feature está junto
- **Encapsulamento**: Features podem evoluir independentemente
- **Descoberta**: Fácil encontrar código relacionado
- **Remoção**: Apagar uma feature é simples (remover a pasta)
- **Escala**: Novas features são adicionadas sem afetar as existentes

---

## 🗺️ Expo Router e File-Based Routing

### Como funciona

```
app/
├── _layout.tsx           → Layout raiz (Stack Navigator)
├── index.tsx             → Rota: /
├── (auth)/               → Grupo de rotas (não afeta URL)
│   ├── _layout.tsx       → Layout do grupo
│   ├── login.tsx         → Rota: /login
│   └── register.tsx      → Rota: /register
└── (main)/               → Grupo de rotas principais
    ├── _layout.tsx       → Tab Navigator
    ├── map/
    │   ├── index.tsx     → Rota: /map
    │   └── [id].tsx      → Rota: /map/:id (dinâmica)
    └── profile/
        └── index.tsx     → Rota: /profile
```

### Grupos de Rotas `(auth)` e `(main)`

**Por que usar grupos?**

1. **Autenticação condicional**: Rotas `(auth)` são acessíveis sem login, `(main)` requer autenticação
2. **Layouts diferentes**: Auth tem layout minimalista, main tem tabs
3. **Performance**: Code splitting automático por grupo
4. **Organização**: Separação visual clara no código

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const { user } = useAuth();
  
  return (
    <Stack>
      {!user ? (
        <Stack.Screen name="(auth)" />
      ) : (
        <Stack.Screen name="(main)" />
      )}
    </Stack>
  );
}
```

---

## 🔄 Fluxo de Dados

### Camadas da Aplicação

```
┌─────────────────────────────────────┐
│         Screens (app/)              │  ← Thin screens
├─────────────────────────────────────┤
│      Components (features/)         │  ← UI + lógica de apresentação
├─────────────────────────────────────┤
│         Hooks (features/)           │  ← Lógica de negócio
├─────────────────────────────────────┤
│    Services (features/)             │  ← Chamadas de API
├─────────────────────────────────────┤
│      API Client (src/api/)          │  ← Axios configurado
└─────────────────────────────────────┘
```

### Exemplo de Fluxo

```typescript
// 1. Screen (app/(main)/map/index.tsx)
export default function MapScreen() {
  const { accidents, loading } = useAccidents();
  return <AccidentMap accidents={accidents} loading={loading} />;
}

// 2. Hook (src/features/map/hooks/useAccidents.ts)
export const useAccidents = () => {
  return useQuery({
    queryKey: ['accidents'],
    queryFn: () => accidentService.getAccidents(),
  });
};

// 3. Service (src/features/map/services/accidentService.ts)
export const accidentService = {
  async getAccidents() {
    const response = await api.get('/accidents');
    return response.data;
  },
};
```

### Por que essa separação?

1. **Screens finas**: Fáceis de entender e manter
2. **Lógica em hooks**: Testável e reutilizável
3. **Services isolados**: Trocar API não afeta UI
4. **Único ponto de API**: Interceptors e headers centralizados

---

## 🎣 Hooks Customizados

### Tipos de Hooks

1. **Hooks de Feature**: Lógica específica de domínio
   ```typescript
   // src/features/map/hooks/useAccidents.ts
   export const useAccidents = (filters?: MapFilters) => {
     // Lógica específica de acidentes
   };
   ```

2. **Hooks Compartilhados**: Reutilizáveis entre features
   ```typescript
   // src/shared/hooks/useLocation.ts
   export const useLocation = () => {
     // Lógica genérica de localização
   };
   ```

### Padrões de Nomenclatura

- `use` + Substantivo: `useAuth`, `useMap`
- `use` + Verbo + Substantivo: `useGetAccidents`, `useUpdateProfile`
- Hooks de formulário: `useLoginForm`, `useAccidentForm`

---

## 🗄️ Gerenciamento de Estado

### Estratégia em Camadas

1. **Estado Local**: `useState` para UI state
2. **Estado de Servidor**: React Query para dados da API
3. **Estado Global**: Zustand para estado compartilhado
4. **Estado de UI**: Context API para temas/preferências

### Por que React Query?

```typescript
// Sem React Query
const [accidents, setAccidents] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  loadAccidents();
}, []);

// Com React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['accidents'],
  queryFn: getAccidents,
});
```

**Vantagens:**
- Cache automático
- Retry e refetch automáticos
- Deduplicação de requisições
- Loading e error states prontos
- Invalidação de cache
- Paginação e infinite scroll

### Por que Zustand?

```typescript
// Zustand Store
const useMapStore = create((set) => ({
  selectedAccident: null,
  setSelectedAccident: (accident) => set({ selectedAccident: accident }),
}));

// Uso em qualquer componente
const selectedAccident = useMapStore((state) => state.selectedAccident);
```

**Vantagens sobre Redux:**
- API mais simples
- Menos boilerplate
- Sem providers necessários
- Performance otimizada
- Curva de aprendizado menor

---

## 🔌 API Client

### Estrutura

```typescript
// src/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Interceptors
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Por que centralizar?

1. **Headers consistentes**: Token adicionado automaticamente
2. **Error handling**: Tratamento global de erros
3. **Base URL**: Único lugar para mudar ambiente (dev/prod)
4. **Logging**: Debug centralizado
5. **Retry logic**: Política de retry uniforme

---

## 📝 TypeScript e Tipagem

### Hierarquia de Tipos

```typescript
// Tipos por feature
// src/features/map/types/map.types.ts
export interface Accident {
  id: string;
  latitude: number;
  longitude: number;
  type: AccidentType;
  severity: Severity;
  date: Date;
  description: string;
  userId: string;
  images?: string[];
}

export type AccidentType = 
  | 'colisao'
  | 'atropelamento'
  | 'queda'
  | 'incendio'
  | 'outro';

export type Severity = 'baixa' | 'media' | 'alta';
```

### Por que tipos por feature?

1. **Encapsulamento**: Tipos evoluem com a feature
2. **Descoberta**: Tipos próximos ao código que os usa
3. **Import limpo**: Sem imports circulares
4. **Refatoração segura**: Mudanças localizadas

### Tipos Compartilhados

```typescript
// src/shared/types/global.types.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## 🧪 Testabilidade

### Estrutura de Testes

```
tests/
├── unit/
│   ├── features/
│   │   ├── map/
│   │   │   ├── hooks/
│   │   │   │   └── useAccidents.test.ts
│   │   │   └── components/
│   │   │       └── AccidentMarker.test.tsx
│   │   └── shared/
│   │       └── utils/
│   │           └── formatters.test.ts
└── integration/
    └── flows/
        └── accidentCreation.test.tsx
```

### Por que essa arquitetura facilita testes?

1. **Hooks isolados**: Testáveis sem UI
2. **Services mockáveis**: Fáceis de mockar
3. **Componentes puros**: Props claras e previsíveis
4. **Lógica separada**: Business logic sem dependência de UI

---

## 🎨 Componentes Compartilhados

### Estrutura

```
src/shared/components/
└── Button/
    ├── Button.tsx
    ├── Button.styles.ts
    ├── Button.test.tsx
    └── index.ts
```

### Por que essa estrutura?

Cada componente compartilhado tem:
1. **Implementação**: Componente React
2. **Estilos**: Styles separados (StyleSheet)
3. **Testes**: Testes do componente
4. **Barrel export**: Facilita import

```typescript
// Import simplificado
import { Button } from '@shared/components/Button';
```

---

## 🚀 Boas Práticas

### 1. Screens Finas

```typescript
// ✅ CORRETO - Screen fina
export default function MapScreen() {
  const { accidents } = useAccidents();
  const { filters } = useMapFilters();
  
  return <AccidentMap accidents={accidents} filters={filters} />;
}

// ❌ ERRADO - Screen com lógica
export default function MapScreen() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  
  useEffect(() => {
    // 50 linhas de lógica
  }, []);
  
  // 100 linhas de lógica de filtro
  
  return <MapView>{/* Complexidade */}</MapView>;
}
```

### 2. Barrels Exports

```typescript
// src/features/map/index.ts
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';
```

**Vantagens:**
- Imports mais limpos
- API pública da feature
- Encapsulamento interno

### 3. Nomenclatura Consistente

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `AccidentMap` |
| Hooks | camelCase com use | `useAccidents` |
| Services | camelCase com Service | `accidentService` |
| Types | PascalCase | `Accident` |
| Constantes | UPPER_SNAKE_CASE | `API_URL` |
| Funções | camelCase | `getAccidents` |

### 4. Import Order

```typescript
// 1. Imports externos
import React from 'react';
import { View } from 'react-native';

// 2. Imports de features
import { AccidentMap } from '../../features/map';

// 3. Imports compartilhados
import { Button } from '../../shared/components';

// 4. Tipos
import type { Accident } from '../../features/map/types';
```

---

## 🔒 Segurança

### Autenticação

```typescript
// src/features/auth/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (credentials: Credentials) => {
    const { token, user } = await authService.login(credentials);
    await SecureStore.setItemAsync('token', token);
    setUser(user);
  };
  
  return { user, login };
};
```

### Boas Práticas

1. **Tokens seguros**: Usar `expo-secure-store`
2. **Validação**: Zod para schemas
3. **Sanitização**: Dados do usuário
4. **HTTPS**: API em produção

---

## 📊 Performance

### Otimizações Implementadas

1. **React Query Cache**
   ```typescript
   staleTime: 5 * 60 * 1000  // 5 minutos
   ```

2. **Memoização**
   ```typescript
   const MemoizedMarker = React.memo(AccidentMarker);
   ```

3. **Lazy Loading**
   ```typescript
   const AccidentDetail = React.lazy(() => import('./AccidentDetail'));
   ```

4. **Image Optimization**
   ```typescript
   <Image 
     source={{ uri: accident.image }}
     resizeMode="cover"
     cachePolicy="memory-disk"
   />
   ```

---

## 🐛 Debug e Monitoramento

### Logging

```typescript
// src/shared/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (__DEV__) console.log(message, data);
  },
  error: (message: string, error?: any) => {
    if (__DEV__) console.error(message, error);
    // Enviar para serviço de monitoramento
  },
};
```

### Error Boundaries

```typescript
// src/shared/components/ErrorBoundary
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error Boundary', { error, errorInfo });
  }
  
  render() {
    return this.props.children;
  }
}
```

---

## 📦 Deploy e Ambientes

### Variáveis de Ambiente

```bash
# .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_MAPS_API_KEY=dev_key

# .env.production
EXPO_PUBLIC_API_URL=https://api.accidentmap.com
EXPO_PUBLIC_MAPS_API_KEY=prod_key
```

### Configuração por Ambiente

```typescript
// src/shared/constants/config.ts
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  mapsApiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY,
  environment: process.env.NODE_ENV,
};
```

---

## 🤝 Guia de Contribuição

### Antes de Contribuir

1. **Leia este manual** completamente
2. **Entenda a feature** que vai modificar
3. **Verifique issues** existentes
4. **Discuta mudanças** grandes antes de implementar

### Fluxo de Trabalho

1. **Crie uma branch**
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. **Siga os padrões** de código
3. **Escreva testes**
4. **Atualize documentação**
5. **Abra um PR** com descrição clara

### Checklist de PR

- [ ] Código segue os padrões do projeto
- [ ] Testes escritos e passando
- [ ] Sem erros de TypeScript
- [ ] Documentação atualizada
- [ ] Performance verificada
- [ ] Acessibilidade considerada
- [ ] Responsividade testada

---

## 📚 Referências

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript](https://www.typescriptlang.org/)
- [React Native](https://reactnative.dev/)

---

## 🎯 Conclusão

Esta arquitetura foi projetada para:

1. **Facilitar manutenção** através de organização clara
2. **Permitir escalabilidade** sem refatoração
3. **Garantir qualidade** com TypeScript e testes
4. **Acelerar desenvolvimento** com padrões consistentes
5. **Melhorar colaboração** com documentação clara

Siga os padrões descritos neste manual para manter a consistência e qualidade do projeto. Quando em dúvida, priorize clareza e simplicidade sobre otimização prematura.

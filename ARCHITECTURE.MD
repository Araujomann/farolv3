# 📚 Manual de Arquitetura - Farol (app)

## Visão Geral

Este documento descreve a arquitetura do aplicativo Farol, cliente mobile da CrashMap API para registro e consulta de acidentes de trânsito. O app é construído com React Native + Expo (SDK 54) e Expo Router.

### Stack

| Área | Tecnologia |
|------|------------|
| Base | React Native 0.81, React 19, TypeScript (`strict`) |
| Navegação | Expo Router 6 (file-based routing) |
| Estado global | Zustand |
| Requisições | Axios (instância única em `src/api/client.ts`) |
| Formulários | React Hook Form + Zod (`@hookform/resolvers`) |
| Mapa e geocodificação | `@rnmapbox/maps` + APIs HTTP do Mapbox |
| UI e estilos | Gluestack UI + NativeWind (Tailwind) e `StyleSheet` |
| Ícones | `lucide-react-native` |
| Animações | `react-native-reanimated` |
| Armazenamento seguro | `expo-secure-store` |
| Notificações push | `expo-notifications` |
| Localização | `expo-location` |
| Idiomas | i18n próprio (pt-BR, en, es) |

---

## 🏗️ Princípios Arquiteturais

1. **Feature-First**: o código de cada domínio (mapa, relato, perfil…) fica junto em `src/features/`
2. **File-based Routing**: as rotas são definidas pela estrutura de `app/` (Expo Router)
3. **Ponto único de API**: toda chamada à CrashMap API passa pela instância Axios de `src/api/client.ts`
4. **Type Safety**: TypeScript em modo estrito em todo o projeto

---

## 📁 Estrutura de Diretórios

```
farolv3/
├── app/                    # Rotas (Expo Router)
├── components/             # Componentes de UI (Gluestack) e SearchBar
├── src/
│   ├── api/               # Cliente Axios e chamadas à API
│   ├── features/          # Código por domínio
│   ├── shared/            # Hooks compartilhados
│   ├── store/             # Store de autenticação (Zustand)
│   ├── theme/             # Cores, preferência de tema e hook useAppTheme
│   └── i18n/              # Traduções e store de idioma
├── assets/                # Imagens e fontes
├── global.css             # Entrada do Tailwind/NativeWind
└── tailwind.config.js
```

As pastas `hooks/` e `constants/theme.ts` da raiz e `scripts/reset-project.js` vieram do template do Expo e não são usadas pelo app; o tema real fica em `src/theme/`.

### Separação entre `app/` e `src/`

```
app/     → Rotas, layouts e composição das telas
src/     → Componentes, hooks, serviços, estado e tipos
```

As telas em `app/` montam a interface a partir dos componentes e hooks das features. Algumas telas ainda concentram lógica própria (por exemplo, os formulários de autenticação e de relato, que declaram ali o schema Zod e o `useForm`). Telas simples apenas reexportam um componente da feature:

```typescript
// app/(tabs)/profile/settings.tsx
export { default } from "@/src/features/settings/components/SettingsScreen";
```

---

## 🗺️ Rotas (Expo Router)

```
app/
├── _layout.tsx                 → Layout raiz (Stack), providers e guarda de autenticação
├── index.tsx                   → Redireciona para /(auth)/login
├── (auth)/                     → Telas sem login
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── verify-email.tsx
│   ├── forgot-password.tsx
│   └── reset-password.tsx
└── (tabs)/                     → Área logada (abas customizadas com expo-router/ui)
    ├── _layout.tsx
    ├── home/index.tsx          → Painel da comunidade e contribuição pessoal
    ├── map/
    │   ├── index.tsx           → Mapa de acidentes
    │   └── [accidentId].tsx    → Detalhe do acidente (rota dinâmica)
    ├── report/
    │   ├── index.tsx           → Escolha da localização
    │   ├── form.tsx            → Formulário do relato
    │   └── success.tsx
    └── profile/
        ├── index.tsx
        ├── reports.tsx         → Meus relatos
        ├── settings.tsx
        └── delete-account.tsx
```

### Guarda de autenticação

O `app/_layout.tsx` declara as três telas da Stack (`index`, `(auth)` e `(tabs)`) e decide o redirecionamento num `useEffect`, depois que `restoreSession()` termina:

- sem token → `/(auth)/login`;
- com token fora de `(tabs)` → `/(auth)/verify-email` se o e-mail ainda não foi verificado logo após cadastro/login, senão `/(tabs)/home`;
- recuperação de senha e verificação de e-mail ficam liberadas durante o fluxo.

O layout raiz também configura o token do Mapbox, carrega as fontes, hidrata tema e idioma, registra as notificações push, mantém a splash até tudo estar pronto e envolve o app em `GluestackUIProvider` e `ThemeProvider` (React Navigation).

---

## 🎯 Features

```
src/features/
├── auth/            # Componentes das telas de login/cadastro e useAuthorization
├── home/            # Painel inicial: cards, useHomeDashboard, validação dos dados
├── map/             # Mapa, marcadores, filtros, detalhe, comentários, confiança, serviços
├── notifications/   # Push (registro/remoção do token) e avisos administrativos
├── profile/         # Perfil, gamificação, meus relatos, cor do título
├── report/          # Componentes e hooks do fluxo de relato
└── settings/        # Telas de configurações e exclusão de conta
```

Estrutura típica (nem toda feature tem todas as pastas):

```
src/features/map/
├── components/      # Componentes específicos (inclui details/)
├── constants/
├── hooks/           # useAccidents, useAccidentDetails, useAccidentAddress
├── services/        # accidentService, placeSearch, reverseGeocode
├── types/
├── utils/
└── index.ts         # Exporta parte da API pública da feature
```

Só `auth` e `map` têm `index.ts`. Em `auth/`, os arquivos `LoginForm.tsx`, `RegisterForm.tsx`, `useAuth.ts`, `useLoginForm.ts`, `authService.ts` e `auth.types.ts` existem, mas estão vazios: a lógica de autenticação está nas telas de `app/(auth)/`, em `src/api/auth.ts` e em `src/store/authStore.ts`.

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────┐
│         Screens (app/)              │  ← Composição e, em alguns casos, formulários
├─────────────────────────────────────┤
│   Components (src/features/)        │  ← UI da feature
├─────────────────────────────────────┤
│      Hooks (src/features/)          │  ← Estado de tela, carregamento, cache
├─────────────────────────────────────┤
│ Services (features/*/services ou    │  ← Funções que chamam a API
│          src/api/*.ts)              │
├─────────────────────────────────────┤
│      API Client (src/api/client.ts) │  ← Axios configurado
└─────────────────────────────────────┘
```

As funções de chamada à API ficam em dois lugares:

- `src/features/map/services/accidentService.ts`: acidentes do mapa, detalhe, criação de relato, comentários, imagens e votos de confiança;
- `src/api/*.ts`: `auth`, `accidents` (estatísticas da home), `profile`, `reports` (meus relatos) e `notifications`.

### Exemplo de fluxo

```typescript
// 1. Screen (app/(tabs)/map/index.tsx) usa o hook da feature
const { accidents, isLoading, error, filters, applyFilters, retry } = useAccidents();

// 2. Hook (src/features/map/hooks/useAccidents.ts)
//    useState/useEffect + cache em memória no nível do módulo,
//    revalidado pela versão dos dados no servidor
const data = await getAccidentsForMap(filters);

// 3. Service (src/features/map/services/accidentService.ts)
const response = await api.get("/accidents/map", { params });
```

---

## 🗄️ Gerenciamento de Estado

1. **Estado local**: `useState`/`useRef` nos hooks e telas
2. **Dados do servidor**: carregados pelos hooks das features com `useState`/`useEffect` (ou `useFocusEffect`), com cache em memória quando necessário (ex.: `useAccidents`)
3. **Estado global**: stores Zustand

| Store | Onde | Conteúdo |
|-------|------|----------|
| `useAuthStore` | `src/store/authStore.ts` | usuário, token, carregamento da sessão, `signIn`/`signOut`/`restoreSession` |
| `useThemeStore` | `src/theme/themeStore.ts` | preferência de tema (system/light/dark), persistida |
| `useLanguageStore` | `src/i18n/index.ts` | preferência de idioma, persistida |
| `useServerStatusStore` | `src/api/serverStatus.ts` | requisições lentas (API acordando) |
| `useProfileTitleColorStore` | `src/features/profile/titleColorStore.ts` | animação da cor do título do perfil |

As preferências e os tokens são persistidos com `expo-secure-store`.

---

## 🔌 API Client

`src/api/client.ts` cria a instância única do Axios:

- `baseURL` em `EXPO_PUBLIC_API_URL` e timeout de 70 s (`API_TIMEOUT_MS`), para tolerar a API acordando da hibernação;
- interceptor de requisição lê o access token do SecureStore e envia `Authorization: Bearer …`;
- interceptor de resposta: em `401`, renova o par de tokens em `/auth/refresh` (com fila para evitar refresh simultâneos) e refaz a requisição; se a renovação falhar, apaga os tokens;
- `beginRequestTracking`/`endRequestTracking` alimentam `useServerStatusStore`, e `ServerWakingNotice` avisa o usuário quando a API demora a responder.

---

## 🔒 Autenticação e Autorização

- Tokens (`token` e `refresh_token`) ficam no `expo-secure-store`, gravados por `useAuthStore.signIn`.
- `restoreSession()` restaura a sessão na abertura do app consultando a API.
- `signOut()` remove o token de push do dispositivo na API e apaga os tokens locais.
- Formulários validados com Zod + React Hook Form.
- Papéis: `src/store/authorization.ts` (`hasRole`, `isModerator`) e o hook `useAuthorization` (`src/features/auth`). A autorização efetiva é feita pela API.

---

## 🔔 Notificações

- `usePushNotifications` (chamado no layout raiz) registra o token Expo Push do dispositivo na API quando há sessão.
- `pushNotifications.ts` trata o registro, a remoção do token e a notificação de relato aprovado (`ACCIDENT_APPROVED`).
- `AdministrativeNoticesPanel` exibe os avisos à comunidade publicados pelo painel administrativo.

---

## 🗺️ Mapa e Geolocalização

- `@rnmapbox/maps` renderiza o mapa; o token vem de `EXPO_PUBLIC_MAPBOX_TOKEN`.
- `placeSearch.ts` usa a Search Box API do Mapbox para a busca de lugares.
- `reverseGeocode.ts` usa a Geocoding API do Mapbox para obter o endereço de uma coordenada.
- `expo-location` obtém a posição do usuário no fluxo de relato.

---

## 🌐 Internacionalização

`src/i18n/` tem dicionários em `locales/` (`pt-BR`, `en`, `es`), o store de idioma (preferência `system` ou um idioma fixo, com fallback para pt-BR) e o hook `useTranslation`. Fora de componentes usa-se a função `tr`.

---

## 🎨 UI e Tema

- `components/ui/` contém os componentes do Gluestack UI adicionados ao projeto (`box`, `button`, `input`, `text`, `vstack`, `tabs`, provider) e utilitários de animação de cor.
- Estilos com NativeWind (`className`) e, em alguns componentes, `StyleSheet`.
- `src/theme/` define as cores claras e escuras (`colors.ts`), a preferência do usuário (`themeStore.ts`) e o hook `useAppTheme`, usado pelas telas e pelo tema do React Navigation.

---

## 📝 TypeScript e Tipagem

- Tipos por feature em `src/features/*/types/` (ex.: `accident.types.ts`).
- Tipos das respostas declarados junto das funções de `src/api/*.ts`.
- Tipos do usuário e da store de autenticação em `src/store/types.ts`.
- Alias `@/*` aponta para a raiz do projeto (`tsconfig.json`).

---

## 📦 Variáveis de Ambiente

```bash
EXPO_PUBLIC_API_URL=      # URL da CrashMap API
EXPO_PUBLIC_MAPBOX_TOKEN= # token público do Mapbox (obrigatório: o app não inicia sem ele)
```

---

## 🧪 Qualidade

O projeto não tem testes automatizados. A verificação disponível é o lint (`npm run lint`, via `expo lint`) e a checagem de tipos do TypeScript.

---

## 📚 Referências

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [rnmapbox](https://rnmapbox.github.io/)
- [Gluestack UI](https://gluestack.io/)
- [NativeWind](https://www.nativewind.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Native](https://reactnative.dev/)

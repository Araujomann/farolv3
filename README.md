# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## API de autenticação e relatos

Configure `EXPO_PUBLIC_API_URL` no `.env` com a URL base da `crashmap-api`, por
exemplo `http://<host-da-api>:3333`. O aplicativo usa essa API diretamente para
login, renovação de sessão e envio de relatos; essa URL não deve apontar para o
painel web Farol Admin. Em um dispositivo físico, use um endereço da máquina
acessível pela rede local, não `localhost`.

Os relatos enviados pelo aplicativo ficam pendentes de moderação e só aparecem
no mapa público depois de aprovados no painel. O painel usa sua própria variável
de servidor, `CRASHMAP_API_URL`, também apontada para a CrashMap API. Reinicie o
Expo após alterar a URL.

## Push notifications (Android and iOS)

The app registers an Expo push token after sign-in when notification permission is granted. Set `EXPO_PUBLIC_EAS_PROJECT_ID` to the app's real EAS project ID (or link the app to EAS so the ID is included in the build), and configure Android FCM v1 and iOS APNs credentials in EAS. Test push notifications on physical devices using a development or production build; Android remote push is not supported in Expo Go, and simulators do not receive pushes.

When the API approves a report, the push includes an `ACCIDENT_APPROVED` event and the report ID. If the map is open, it listens for that event and refreshes its pins without reloading the screen or moving the camera. If the profile is open, it refreshes the user's approved-report count and gamification progress. Both screens also fetch current data when opened or revisited, in case a push is delayed or not delivered.

The Crash Map API database must have its Prisma migrations applied, including `20261109211500_add_push_tokens`, for push-token registration and approval events to work. From `crashmap-api`, apply existing migrations with `pnpm exec prisma migrate deploy`.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

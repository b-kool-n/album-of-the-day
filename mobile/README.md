# Album of the Day: iPhone and Android app

Built with Expo (SDK 58). It uses the same Supabase database as the website, so accounts, scores, comments and suggestions are shared. Admin stays on the website.

The app talks to Supabase directly. It calls the website for three things only, under `/api/app/*`:

- looking an album up on Spotify when someone suggests one
- deleting an account
- sending a test notification

The morning job on the website (`/api/cron/daily`) sends the daily notification to phones through Expo, and to browsers as before.

## Settings

`.env` holds three public values: the Supabase address, the Supabase publishable key and the website address. None of them are secret.

## Try it on your phone today (no build needed)

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer, in this folder: `npm install`, then `npx expo start`.
3. Scan the QR code with the iPhone camera (or from inside Expo Go on Android).

Everything works in Expo Go except notifications. Those need a proper build (below).

## First-time setup for builds (once)

1. `npx eas-cli@latest login` with your Expo account.
2. `npx eas-cli@latest init`. This links the folder to an Expo project and adds its ID to `app.json`.

## TestFlight (iPhone testers)

1. `npx eas-cli@latest build --platform ios --profile production`
   - Sign in with your Apple ID when asked, and let EAS create the certificates.
   - Say **yes** when it offers to set up push notifications.
2. `npx eas-cli@latest submit --platform ios --latest` uploads the build to App Store Connect.
3. In App Store Connect → TestFlight, add testers. Internal testers (people on your App Store Connect team) can install straight away. External testers need a quick beta review the first time.

## Google Play (Android testers)

1. Create the app in Google Play Console. The package name is `com.benkoolen.albumoftheday`.
2. Notifications on Android need Firebase. Create a Firebase project, add an Android app with the same package name, then upload its service account key to Expo (`npx eas-cli@latest credentials`, Android, FCM V1).
3. `npx eas-cli@latest build --platform android --profile production`, then `npx eas-cli@latest submit --platform android --latest`, or upload the `.aab` file by hand.
4. Use **Closed testing**. Twelve or more testers for 14 days in a row is needed before you can go public.

## Checks

- `npm run typecheck`
- `npm run lint`

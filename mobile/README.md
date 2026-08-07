# Bassir All-in-One — Mobile App (iOS & Android)

React Native app (Expo) for the Bassir All-in-One portal. It talks to the same
portal server as the web app, so systems, analytics and business data stay in
sync everywhere.

**Tabs:** Systems (tap to open a system and sign in there) · Business (users +
KPIs pulled from inside each system) · Analytics (opens per day / per system) ·
Manage (add, edit, delete systems) · Settings (portal server address).

On first launch the app asks for the **portal server address** — the URL of the
running `server.js` from this repository, as reachable *from the phone* (e.g.
`https://portal.yourcompany.com`, or `http://192.168.1.10:3000` on an office
network). "Test & save" verifies the connection. The app stores no passwords;
sign-in happens on each Bassir system itself.

## Run it in development

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the [Expo Go](https://expo.dev/go) app (Android) or the
camera (iOS). `npx expo start --web` also runs a browser preview.

The JS for both platforms is verified to bundle:
`npx expo export --platform ios --platform android`.

## Build & deploy to the stores

The project uses Expo, so store builds are done with
[EAS Build](https://docs.expo.dev/build/setup/) — no Mac needed for iOS:

```bash
npm install -g eas-cli
eas login                 # free Expo account
cd mobile
eas build:configure       # one-time: creates eas.json, sets projectId in app.json
eas build --platform android   # produces an .aab for Google Play (or --profile preview for an installable .apk)
eas build --platform ios       # produces an .ipa for the App Store (needs an Apple Developer account)
eas submit                     # optional: upload to the stores from the CLI
```

For internal distribution without stores: `eas build --platform android
--profile preview` gives an `.apk` you can install directly on company phones,
and iOS ad-hoc builds work via `eas device:create` + a preview build.

## Configuration notes

- **App identity** is set in `app.json`: name, `com.bassir.allinone` bundle
  ID / package, icon and splash (in `assets/`, generated — replace with real
  brand art anytime).
- **Plain-HTTP portals:** `app.json` currently allows cleartext HTTP
  (`usesCleartextTraffic`, `NSAllowsArbitraryLoads`) so the app works with a
  portal on a plain `http://` LAN address. If the portal is served over HTTPS,
  remove both for stricter store review posture.
- The portal server must be running and reachable from the phones (same
  network or exposed via HTTPS). CORS is already open on the portal's `/api`.
- No custom native code — the app is pure JS on Expo SDK 53, so Expo Go and
  EAS builds both work without extra native setup.

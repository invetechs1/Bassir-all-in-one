Viewed server.js:1-28
Viewed README.md:29-63

Coming from a Flutter background, you will find Expo's deployment process surprisingly easy! 

In Flutter, you usually run `flutter build ipa`, open Xcode to archive, manage Provisioning Profiles, and upload via Xcode or Transporter. 

In Expo, **EAS (Expo Application Services)** builds the app in the cloud and automatically handles Apple Certificates, Provisioning Profiles, and App Store Connect uploads for you.

---

### 📋 Prerequisites
Before you start, make sure you have:
1. An active **Apple Developer Account** ($99/year).
2. A free **Expo Account** (Create one at [expo.dev](https://expo.dev) if you don't have one).

---

### 🚀 Step-by-Step Deployment Guide

#### **Step 1: Install EAS CLI and Log In**
Open your terminal and run:

```bash
npm install -g eas-cli
eas login
```
*(Log in with your Expo credentials).*

---

#### **Step 2: Configure EAS in the Project (One-Time Setup)**
Navigate into the `mobile` folder and initialize EAS configuration:

```bash
cd mobile
eas build:configure
```
- Select **All** or **iOS** when prompted.
- This creates an `eas.json` configuration file in your `mobile/` directory (similar to `pubspec.yaml` build configs in Flutter).

---

#### **Step 3: Check Your Bundle Identifier**
Open [`mobile/app.json`](file:///Users/mentorsol/Documents/GitHub/Bassir-all-in-one/mobile/app.json) and verify your iOS bundle identifier:

```json
"ios": {
  "bundleIdentifier": "com.bassir.allinone",
  "supportsTablet": true
}
```
*(Ensure `com.bassir.allinone` is unique to your company or change it to match your desired Apple App ID).*

---

#### **Step 4: Build the iOS App (`.ipa`)**
Run the EAS cloud build command:

```bash
eas build --platform ios
```

**What happens during this step:**
1. EAS CLI will prompt you to log into your **Apple Developer Account**.
2. **Automatic Credentials:** EAS will ask: *"Do you want Expo to handle your credentials?"* Select **`Yes`**. Expo will automatically generate your Apple Distribution Certificate, Provisioning Profile, and App ID!
3. EAS will queue and compile the iOS `.ipa` binary on Expo's cloud build servers.

---

#### **Step 5: Submit to App Store Connect / TestFlight**
Once the build completes, you can upload it directly to App Store Connect right from the terminal:

```bash
eas submit --platform ios
```

- EAS will ask for an **App Store Connect App Specific Password** (you can create one at [appleid.apple.com](https://appleid.apple.com)).
- Once uploaded, your build will appear in **TestFlight** within ~10–15 minutes!

---

💡 **Pro-Tip: Build + Auto Submit in One Step**
```bash
eas build --platform ios --auto-submit
```

---

### 📱 Step 6: Finalize in App Store Connect
1. Log into [App Store Connect](https://appstoreconnect.apple.com).
2. Under **My Apps**, create a new app using your Bundle ID (`com.bassir.allinone`).
3. Go to the **TestFlight** tab to test internal/external builds.
4. Under **App Store**, select your uploaded build, add screenshots & description, and submit for Apple Review!
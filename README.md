# DR Star Mobile

Expo app for customer accounts. It uses the same Express API as the web app for authentication, events, wishlists, profiles, orders, ticket QR codes, and Midtrans checkout.

## Run locally

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the backend URL ending in `/api`.
   - Android emulator: `http://10.0.2.2:5000/api`
   - iOS simulator: `http://localhost:5000/api`
   - Physical device: use the computer's LAN IP, or an HTTPS backend URL.
2. Start the backend from `../be` and make sure it is reachable from the device.
3. Run `npm install`, then `npx expo start` from this directory.

The app is for `pelanggan` accounts only. On first launch it shows the branded welcome and sign-in/sign-up flow. A successful sign-in is stored in the device secure store; the next launch keeps the branded splash and opens the home screen. Sign-out clears that saved session.

The startup screen has an animated in-app splash, so it remains visible in Expo Go while the saved session is checked. The matching native splash image is copied from `../fe/public/logobaru.png`; changes to native splash branding require rebuilding the development or release app.

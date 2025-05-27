# MedVault: Modern Medical Management Platform

MedVault is a full-stack medical management platform built with Next.js, Firebase, and Python. It provides modules for RxAI (AI-powered medication suggestions), PharmaNet, Inventory, Shipments, Patient History, and more. The platform supports real-time data, secure authentication, and integration with simulated sensor/GPS data.

Frontend: https://medvault-frontend-596655096468.us-central1.run.app

Backend: https://medvault-backend-596655096468.us-central1.run.app
---

## Features
- **User & Clinic Management:** Secure authentication, custom claims, and role-based access.
- **RxAI:** AI-powered medication suggestions using Google Gemini and Gamma models.
- **PharmaNet:** Drug lookup, verification, and clinical trial summaries.
- **Inventory & Shipments:** Track medicines, shipments, and cold chain with live sensor/GPS data.
- **Patient History:** Store and retrieve patient records and consultation history.
- **Settings:** Centralized user and clinic settings (theme, language, modules, profile, sync, etc.).
- **Offline Support:** AsyncStorage for settings and data caching.
- **Python Backend:** Simulates sensor and GPS data for integration with inventory and shipments.

---

## Requirements
- **Node.js** (v18+ recommended)
- **Python 3.7+** (for sensor backend)
- **Firebase Project** (Firestore, Auth, Storage enabled)
- **Google Gemini API Key** (for RxAI)
- **.env.local** file (see below)

---

## Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd MedVault-main 2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory with the following:
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-adminsdk-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
GOOGLE_AI_API_KEY=your-gemini-api-key
```
> **Note:** For multiline private keys, use `\n` for newlines or wrap in double quotes.

### 4. Firebase Configuration
- Set up your Firebase project with Firestore, Auth, and Storage.
- Update `src/firebase.ts` and `src/lib/firebase.ts` with your config if needed.
- Deploy Firestore security rules:
  ```bash
  firebase deploy --only firestore:rules
  ```

### 5. Run the Next.js App
```bash
npm run dev
```
App will be available at `http://localhost:3000`.

### 6. Run the Python Sensor Backend
```bash
cd src/backend
pip install flask
python sensor_data_service.py
```
Sensor API will be available at `http://localhost:5001`.

---

## Project Structure

```
MedVault-main 2/
├── src/
│   ├── app/           # Next.js app directory
│   │   ├── (app)/     # Main app modules (rxai, pharmanet, inventory, history, etc.)
│   │   ├── api/       # Next.js API routes (auth, rxai, pharmanet, etc.)
│   │   └── ...
│   ├── components/    # UI and feature components
│   │   └── settings/  # Settings page components
│   ├── lib/           # Shared libraries (firebase, utils, etc.)
│   ├── providers/     # Context providers (AuthProvider, ThemeProvider, etc.)
│   ├── types/         # TypeScript types
│   └── backend/       # Python backend for sensor data
├── firestore.rules    # Firestore security rules
├── .env.local         # Environment variables (not committed)
├── README.md          # This file
└── ...
```

---

## Key Modules & Integration

### RxAI (AI Medication Suggestions)
- Uses Google Gemini and Gamma models for suggestions.
- Integrates with Firestore for history and patient records.
- Requires valid `GOOGLE_AI_API_KEY` in `.env.local`.

### Inventory & Shipments
- Fetches live sensor and GPS data from the Python backend:
  - `/api/inventory/sensors` for temperature, humidity, pressure
  - `/api/shipments/gps` for GPS and temperature
- Sensor backend must be running for real-time data.

### Settings
- Centralized page for user and clinic settings (theme, language, modules, profile, sync, etc.).
- Settings are stored in Firestore and AsyncStorage for offline support.

### Authentication & Security
- Uses Firebase Auth with custom claims for clinic access.
- Firestore security rules enforce access based on `clinicId` claim.
- After signup or claim changes, users must sign out and sign in again to refresh their session.

---

## Firestore Security Rules
See `firestore.rules` for details. Example:
```js
match /clinics/{clinicId} {
  allow read, write: if request.auth != null && request.auth.token.clinicId == clinicId;
  match /{subCol}/{docId} {
    allow read, write: if request.auth != null && request.auth.token.clinicId == clinicId;
  }
}
```

---

## Sensor Data Service (Python Backend)
See [`src/backend/README.md`](src/backend/README.md) for full details.

---

## Troubleshooting
- **Permission errors:** Ensure custom claims are set and session is refreshed.
- **.env issues:** Double-check all required variables and formatting.
- **Sensor data not available:** Make sure the Python backend is running.
- **Module not loading:** Check module toggles in settings and user permissions.

---

## License
MIT

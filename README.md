<div align="center">

# 🏥 MedVault

### Multi-Tenant Clinical AI Platform Bridging Healthcare Systems

**AI-powered clinical decision support, IoT cold-chain visibility, and offline-first architecture for modern medical practice.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_App-2EA44F?style=for-the-badge&logo=google-cloud&logoColor=white)](https://medvault-596655096468.us-central1.run.app/)
[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[**Live Demo**](https://medvault-596655096468.us-central1.run.app/) · [**Architecture**](#-architecture) · [**Features**](#-key-features) · [**Tech Stack**](#-tech-stack)

</div>

-----

## 📌 The Problem

Healthcare in emerging markets faces three persistent challenges that compound each other:

1. **Clinicians make critical decisions without decision-support tools.** In time-pressured environments, doctors rely on memory and reference books while AI-powered triage and prescription review tools remain inaccessible to most clinics.
1. **Pharmaceutical supply chains break silently.** Temperature-sensitive medications spoil in transit due to broken cold chains, and clinics have no visibility until patients receive ineffective drugs.
1. **Patient records are fragmented across systems.** A patient who visits a clinic in Hyderabad and later seeks care in Sydney effectively starts from zero — wasting time, money, and clinical context.

**MedVault** is a unified platform addressing all three: AI clinical decision support, real-time cold-chain monitoring, and a multi-tenant patient record system designed for cross-border healthcare interoperability.

## 🎯 Impact & SDG Alignment

MedVault directly contributes to multiple United Nations Sustainable Development Goals:

- **SDG 3 — Good Health and Well-Being:** Improves clinical decision quality and reduces medication errors through AI-assisted prescription review
- **SDG 9 — Industry, Innovation, and Infrastructure:** Brings modern healthcare infrastructure to clinics that can’t afford enterprise EHR systems
- **SDG 10 — Reduced Inequalities:** Designed for offline-first operation in low-connectivity environments, ensuring rural clinics get the same tools as urban hospitals

-----

## 🌟 Key Features

### 🤖 RxAI — AI-Powered Clinical Decision Support

Multimodal medication suggestion engine powered by Google Gemini. Doctors upload patient symptoms and relevant images (rashes, X-rays, prescription photos) and receive structured clinical suggestions with reasoning, drug interactions, and alternatives.

> **⚠️ Safety by design:** RxAI is explicitly built as a *clinical decision-support tool* — every suggestion requires physician review and approval before action. The system surfaces uncertainty, flags high-risk recommendations, and logs all interactions for audit.

### 💊 PharmaNet — Drug Intelligence Hub

Real-time drug lookup, verification against authoritative databases, and clinical trial summaries. Integrates with public pharmaceutical APIs for cross-referencing and generic alternatives.

### 📦 Inventory & Cold-Chain Monitoring

Live IoT sensor integration tracks temperature, humidity, and pressure across pharmacy storage and shipments. GPS tracking ensures cold-chain integrity from manufacturer to patient. When temperatures breach safe thresholds, alerts fire immediately.

### 📋 Patient History & Records

Multi-tenant patient record system with consultation history, diagnostic notes, and prescription tracking. Designed for cross-clinic interoperability so patients don’t lose their medical context when they change providers.

### 🔐 Multi-Tenant Architecture

Each clinic operates in an isolated tenant with role-based access control. Built on Firebase custom claims and Firestore security rules, ensuring no cross-clinic data leakage even at the database level.

### 📴 Offline-First Design

Critical workflows (patient lookup, prescription review, history) work without internet using IndexedDB persistence. Changes sync automatically when connectivity returns — essential for rural clinic deployment.

-----

## 🏗 Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│   Next.js 15     │◄───────►│  Firebase Auth   │         │  Google Gemini   │
│   (App Router)   │         │  + Custom Claims │         │  (Multimodal)    │
│                  │         │                  │         │                  │
└────────┬─────────┘         └──────────────────┘         └────────▲─────────┘
         │                                                          │
         │                                                          │
         ▼                                                          │
┌──────────────────┐         ┌──────────────────┐                  │
│                  │         │                  │                  │
│   API Routes     │────────►│   Firestore      │                  │
│   (Next.js)      │         │  (Multi-tenant)  │                  │
│                  │         │                  │                  │
└────────┬─────────┘         └──────────────────┘                  │
         │                                                          │
         ├──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │
│  Python Backend  │────────►│  IoT Sensors     │
│  (Flask)         │         │  + GPS Tracking  │
│                  │         │  (Simulated)     │
└──────────────────┘         └──────────────────┘
                                                  
              [ IndexedDB Cache ◄──── Offline Sync ]
```

> *Architecture diagram coming soon — see `/docs/architecture.png` for high-resolution version.*

-----

## 🛠 Tech Stack

**Frontend**

- Next.js 15 (App Router) with TypeScript
- React Server Components
- Tailwind CSS + shadcn/ui
- IndexedDB for offline persistence

**Backend**

- Next.js API Routes for primary backend
- Firebase Authentication with custom claims for multi-tenancy
- Cloud Firestore with row-level security rules
- Firebase Storage for medical document uploads
- Python (Flask) microservice for IoT sensor data simulation

**AI / ML**

- Google Gemini Pro Vision for multimodal clinical analysis
- Structured prompt engineering with safety guardrails
- Audit logging for all AI-generated suggestions

**Infrastructure**

- Google Cloud Run for serverless deployment
- Firebase Hosting for static assets
- Environment-based configuration management

-----

## 📸 Screenshots

> *Screenshots coming soon — see `/docs/screenshots/` for the latest UI.*

|Module                        |Preview       |
|------------------------------|--------------|
|RxAI Clinical Decision Support|`[screenshot]`|
|Inventory Cold-Chain Dashboard|`[screenshot]`|
|Patient History Module        |`[screenshot]`|
|Multi-Clinic Management       |`[screenshot]`|

-----

## 🔒 Security Architecture

Healthcare data demands serious security. MedVault implements defense-in-depth:

- **Authentication:** Firebase Auth with email verification and session-based tokens
- **Authorization:** Custom claims encode `clinicId`, enforced server-side on every API call
- **Database security:** Firestore rules enforce row-level access — users can only read/write data tagged with their `clinicId`
- **Session management:** Server-side session cookie verification on every protected route
- **AI safety:** RxAI outputs are logged, flagged for high-risk recommendations, and never auto-applied
- **Secrets management:** All API keys and credentials managed via environment variables, never committed
- **Transport security:** HTTPS enforced via Cloud Run, all Firebase connections encrypted

```javascript
// Example Firestore security rule
match /clinics/{clinicId} {
  allow read, write: if request.auth != null 
    && request.auth.token.clinicId == clinicId;
  match /{subCol}/{docId} {
    allow read, write: if request.auth != null 
      && request.auth.token.clinicId == clinicId;
  }
}
```

-----

## 💡 Key Technical Decisions

**Why Firebase over a custom backend?** Firebase provides authentication, real-time database, storage, and serverless functions out of the box. For a multi-tenant healthcare platform where security rules matter more than custom backend logic, Firebase’s row-level security model is ideal. Custom claims gave me clean multi-tenancy without managing my own JWT infrastructure.

**Why Gemini over GPT-4 or Claude?** Gemini’s multimodal capabilities (text + image in a single call) are critical for medical use cases where clinicians need to upload visual context like rashes, X-rays, or prescription photographs. Gemini also integrates naturally with the rest of the Google Cloud stack.

**Why offline-first with IndexedDB?** Rural and emerging-market clinics frequently operate with intermittent connectivity. A platform that breaks during network outages is unusable in the environments that need it most. IndexedDB caching ensures critical workflows continue even when offline, with automatic sync on reconnection.

**Why separate Python backend for sensors?** IoT sensor data simulation and processing has different scaling characteristics than the main app. Separating it into a Flask microservice allows independent deployment, easier integration with real hardware later, and a clear separation of concerns.

-----

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.7+
- Firebase project with Firestore, Auth, and Storage enabled
- Google Gemini API key

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/RishiKanajam/MedVault.git
cd MedVault
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create `.env.local` in the root directory:

```env
# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-adminsdk-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id

# Google AI
GOOGLE_AI_API_KEY=your-gemini-api-key
```

> **Note:** For multiline private keys, use `\n` for newlines or wrap in double quotes.

**4. Deploy Firestore security rules**

```bash
firebase deploy --only firestore: rules
```

**5. Run the Next.js app**

```bash
npm run dev
```

App available at `http://localhost:9002`

**6. Run the Python sensor backend** (in a separate terminal)

```bash
cd src/backend
pip install flask
python sensor_data_service.py
```

Sensor API available at `http://localhost:5001`

-----

## 📁 Project Structure

```
MedVault/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (app)/             # Authenticated app modules
│   │   │   ├── rxai/          # AI clinical decision support
│   │   │   ├── pharmanet/     # Drug intelligence
│   │   │   ├── inventory/     # Cold-chain inventory
│   │   │   ├── shipments/     # Shipment tracking
│   │   │   └── history/       # Patient records
│   │   └── api/               # Server-side API routes
│   ├── components/            # UI and feature components
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── settings/          # Settings module
│   ├── lib/                   # Shared libraries
│   │   ├── firebase.ts        # Firebase client config
│   │   └── utils.ts           # Utility functions
│   ├── providers/             # React context providers
│   ├── types/                 # TypeScript definitions
│   └── backend/               # Python sensor microservice
├── firestore.rules            # Database security rules
├── .env.local                 # Environment variables (gitignored)
└── README.md
```

-----

## 🧠 What I Learned Building This

This project pushed me on several fronts simultaneously:

- **Multi-tenant security design:** Implementing row-level security via Firebase custom claims taught me how to think about authorization at the database layer rather than relying purely on application logic.
- **Multimodal AI integration:** Working with Gemini for combined text + image analysis required careful prompt engineering and structured output parsing to make AI suggestions actually useful in a clinical context.
- **Healthcare AI ethics:** Building AI features for medical use forced me to think hard about safety guardrails, audit logging, and the difference between *decision support* and *decision making*.
- **Offline-first architecture:** Designing for unreliable connectivity is fundamentally different from designing for the cloud — every state change has to be reconciliable, every user action has to work without a server.
- **Cross-stack debugging:** Operating across Next.js, Firebase, Python, and IoT simulation layers means problems can hide anywhere. This sharpened my systems-thinking and debugging discipline.

-----

## 🛣 Roadmap

- [ ] Real IoT hardware integration (replace simulated sensors)
- [ ] FHIR-compliant data model for healthcare interoperability
- [ ] Mobile app (React Native) for field clinicians
- [ ] Federated learning for privacy-preserving model improvement
- [ ] Integration with India’s ABDM (Ayushman Bharat Digital Mission) for ABHA ID support
- [ ] TGA (Australia) and CDSCO (India) regulatory compliance documentation
- [ ] End-to-end encryption for patient records
- [ ] Comprehensive test suite (Jest + Playwright)

-----

## 🤝 Contributing

This is currently a solo project, but I welcome feedback, bug reports, and feature suggestions. Open an issue or reach out directly.

-----

## 📫 Contact

**Rishi Kanajam**  
Master of IT (Data Analytics & Management), University of Sydney  
Building at the intersection of AI, healthcare, and security

[LinkedIn](https://linkedin.com/in/rishikanajam) · [GitHub](https://github.com/RishiKanajam) · [Portfolio](#)

-----

## 📄 License

MIT License — see <LICENSE> for details.

-----

**Built with care for clinicians, patients, and the healthcare workers bridging worlds.**

⭐ If you find this project useful or interesting, please consider starring it.

</div>

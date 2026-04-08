import '@testing-library/jest-dom'

// Mock Firebase
jest.mock('@/firebase', () => {
  const mockDb = {};
  return {
    auth: null,
    db: mockDb,
    storage: null,
    analytics: null,
    isClient: false,
  };
})

const firestoreModuleMock = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
};

jest.mock('firebase/firestore', () => firestoreModuleMock);

// Expose mock for tests that need to adjust implementations
globalThis.__FIRESTORE_MOCK__ = firestoreModuleMock;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('lucide-react', () => {
  const React = require('react')
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        const Icon = (props) => React.createElement('svg', { 'data-icon': String(prop), ...props })
        return Icon
      },
    }
  )
})

// Mock environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket'
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id'
process.env.GOOGLE_AI_API_KEY = 'test-ai-key'

// Mock fetch
global.fetch = jest.fn()

// Mock crypto for tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256)),
  },
})

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
})

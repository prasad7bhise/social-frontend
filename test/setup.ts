import "@testing-library/jest-dom/vitest";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  getSession: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  signOut: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));
vi.mock("next/headers");
vi.mock("jose");

const { createSession, getSession } = await import("@/lib/auth");

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

const mockCookies = vi.mocked(cookies);
const mockSignJWT = vi.mocked(SignJWT);
const mockJwtVerify = vi.mocked(jwtVerify);

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore as any);
  
  const mockJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  };
  
  mockSignJWT.mockReturnValue(mockJWTInstance as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("createSession creates JWT with correct payload", async () => {
  const userId = "user123";
  const email = "test@example.com";
  
  await createSession(userId, email);
  
  expect(mockSignJWT).toHaveBeenCalledWith({
    userId,
    email,
    expiresAt: expect.any(Date),
  });
});

test("createSession sets JWT expiration to 7 days", async () => {
  const userId = "user123";
  const email = "test@example.com";
  
  const mockJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  };
  
  mockSignJWT.mockReturnValue(mockJWTInstance as any);
  
  await createSession(userId, email);
  
  expect(mockJWTInstance.setExpirationTime).toHaveBeenCalledWith("7d");
});

test("createSession sets correct JWT headers", async () => {
  const userId = "user123";
  const email = "test@example.com";
  
  const mockJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  };
  
  mockSignJWT.mockReturnValue(mockJWTInstance as any);
  
  await createSession(userId, email);
  
  expect(mockJWTInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockJWTInstance.setIssuedAt).toHaveBeenCalled();
});

test("createSession sets cookie with correct name and token", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";
  
  const mockJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue(mockToken),
  };
  
  mockSignJWT.mockReturnValue(mockJWTInstance as any);
  
  await createSession(userId, email);
  
  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    })
  );
});

test("createSession sets secure cookie in production", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  
  const userId = "user123";
  const email = "test@example.com";
  
  await createSession(userId, email);
  
  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      secure: true,
    })
  );
  
  process.env.NODE_ENV = originalEnv;
});

test("createSession sets non-secure cookie in development", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  
  const userId = "user123";
  const email = "test@example.com";
  
  await createSession(userId, email);
  
  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      secure: false,
    })
  );
  
  process.env.NODE_ENV = originalEnv;
});

test("createSession sets cookie expiration 7 days from now", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const beforeCall = Date.now();
  
  await createSession(userId, email);
  
  const afterCall = Date.now();
  const setCall = mockCookieStore.set.mock.calls[0];
  const cookieOptions = setCall[2];
  const expiresAt = cookieOptions.expires;
  
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const expectedMin = beforeCall + sevenDaysInMs;
  const expectedMax = afterCall + sevenDaysInMs;
  
  expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
  expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
});

test("createSession includes correct session payload", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const beforeCall = Date.now();
  
  await createSession(userId, email);
  
  const afterCall = Date.now();
  const jwtCall = mockSignJWT.mock.calls[0];
  const payload = jwtCall[0];
  
  expect(payload.userId).toBe(userId);
  expect(payload.email).toBe(email);
  expect(payload.expiresAt).toBeInstanceOf(Date);
  
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const expectedMin = beforeCall + sevenDaysInMs;
  const expectedMax = afterCall + sevenDaysInMs;
  
  expect(payload.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
  expect(payload.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
});

test("createSession handles JWT signing errors", async () => {
  const userId = "user123";
  const email = "test@example.com";
  
  const mockJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockRejectedValue(new Error("JWT signing failed")),
  };
  
  mockSignJWT.mockReturnValue(mockJWTInstance as any);
  
  await expect(createSession(userId, email)).rejects.toThrow("JWT signing failed");
  expect(mockCookieStore.set).not.toHaveBeenCalled();
});

test("createSession handles cookie setting errors", async () => {
  const userId = "user123";
  const email = "test@example.com";
  
  mockCookieStore.set.mockImplementation(() => {
    throw new Error("Cookie setting failed");
  });
  
  await expect(createSession(userId, email)).rejects.toThrow("Cookie setting failed");
});

test("createSession works with different user data", async () => {
  const testCases = [
    { userId: "abc123", email: "user@test.com" },
    { userId: "xyz789", email: "admin@company.org" },
    { userId: "1", email: "a@b.co" },
  ];
  
  for (const { userId, email } of testCases) {
    vi.clearAllMocks();
    
    await createSession(userId, email);
    
    expect(mockSignJWT).toHaveBeenCalledWith({
      userId,
      email,
      expiresAt: expect.any(Date),
    });
    
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.any(Object)
    );
  }
});

// getSession tests
test("getSession returns session payload when valid token exists", async () => {
  const mockPayload = {
    userId: "user123",
    email: "test@example.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  mockCookieStore.get.mockReturnValue({ value: "valid-jwt-token" });
  mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);

  const result = await getSession();

  expect(result).toEqual(mockPayload);
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(mockJwtVerify).toHaveBeenCalledWith("valid-jwt-token", expect.any(Object));
});

test("getSession returns null when no token cookie exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(mockJwtVerify).not.toHaveBeenCalled();
});

test("getSession returns null when cookie has no value", async () => {
  mockCookieStore.get.mockReturnValue({});

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockJwtVerify).not.toHaveBeenCalled();  
});

test("getSession returns null when JWT verification fails", async () => {
  mockCookieStore.get.mockReturnValue({ value: "invalid-jwt-token" });
  mockJwtVerify.mockRejectedValue(new Error("JWT verification failed"));

  const result = await getSession();

  expect(result).toBeNull();
  expect(mockJwtVerify).toHaveBeenCalledWith("invalid-jwt-token", expect.any(Object));
});

test("getSession returns null when JWT is expired", async () => {
  mockCookieStore.get.mockReturnValue({ value: "expired-jwt-token" });
  mockJwtVerify.mockRejectedValue(new Error("Token expired"));

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns null when JWT signature is invalid", async () => {
  mockCookieStore.get.mockReturnValue({ value: "tampered-jwt-token" });
  mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession handles malformed JWT tokens", async () => {
  mockCookieStore.get.mockReturnValue({ value: "not.a.jwt" });
  mockJwtVerify.mockRejectedValue(new Error("Malformed JWT"));

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns correct payload structure", async () => {
  const mockPayload = {
    userId: "test-user-id",
    email: "user@example.com",
    expiresAt: new Date("2024-12-31T23:59:59Z"),
    iat: 1234567890,
    exp: 1234567890,
  };

  mockCookieStore.get.mockReturnValue({ value: "valid-token" });
  mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);

  const result = await getSession();

  expect(result).toEqual(mockPayload);
  expect(result).toHaveProperty("userId", "test-user-id");
  expect(result).toHaveProperty("email", "user@example.com");
  expect(result).toHaveProperty("expiresAt", new Date("2024-12-31T23:59:59Z"));
});

test("getSession works with different valid payloads", async () => {
  const testCases = [
    {
      userId: "admin123",
      email: "admin@company.com",
      expiresAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      userId: "guest456",
      email: "guest@site.org",
      expiresAt: new Date("2024-06-15T12:30:45Z"),
    },
  ];

  for (const mockPayload of testCases) {
    vi.clearAllMocks();
    
    mockCookieStore.get.mockReturnValue({ value: "valid-token" });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);

    const result = await getSession();

    expect(result).toEqual(mockPayload);
    expect(result?.userId).toBe(mockPayload.userId);
    expect(result?.email).toBe(mockPayload.email);
    expect(result?.expiresAt).toEqual(mockPayload.expiresAt);
  }
});

test("getSession handles cookies throwing errors", async () => {
  mockCookieStore.get.mockImplementation(() => {
    throw new Error("Cookie access failed");
  });

  await expect(getSession()).rejects.toThrow("Cookie access failed");
});
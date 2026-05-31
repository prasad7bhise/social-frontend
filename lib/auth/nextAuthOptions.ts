import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";

const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER!;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID!;

async function refreshAccessToken(token: any) {
  try {
    const url = `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      idToken: refreshed.id_token ?? token.idToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: "",
      issuer: KEYCLOAK_ISSUER,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "hidden" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const url = `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
        const params = new URLSearchParams({
          client_id: KEYCLOAK_CLIENT_ID,
          grant_type: "password",
          username: credentials.username,
          password: credentials.password,
          scope: "openid email profile",
        });

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });

        const tokens = await response.json();
        if (!response.ok) return null;

        const userInfoUrl = `${KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`;
        const userInfoRes = await fetch(userInfoUrl, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        return {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name ?? userInfo.preferred_username,
          image: null,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          idToken: tokens.id_token,
          expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
          rememberMe: credentials.remember === "true",
        } as any;
      },
    }),
  ],
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days (overridden per-user below)
    updateAge: 60,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token ?? (user as any)?.accessToken;
        token.refreshToken = account.refresh_token ?? (user as any)?.refreshToken;
        token.idToken = account.id_token ?? (user as any)?.idToken;
        token.expiresAt = account.expires_at ?? (user as any)?.expiresAt;
        return token;
      }

      if (user) {
        // Credentials provider sign-in
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.idToken = (user as any).idToken;
        token.expiresAt = (user as any).expiresAt;
        token.rememberMe = (user as any).rememberMe;
      }

      // Return previous token if still valid
      if (token.expiresAt && Date.now() / 1000 < (token.expiresAt as number)) {
        return token;
      }

      // Token expired — refresh it
      const refreshed = await refreshAccessToken(token);
      return refreshed;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      (session as any).error = token.error;
      (session as any).rememberMe = token.rememberMe;
      (session as any).keycloakId = token.sub;
      return session;
    },
  },
};

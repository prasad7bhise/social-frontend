import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      // Public client in Keycloak, no secret needed
      clientSecret: "",
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Persist Keycloak access token on the JWT
        // account type is provider-specific; cast to access raw field
        //storing idToken for logout implementation
        token.accessToken = (account as any).access_token;
        token.idToken = (account as any).id_token; 

      }
      return token;
    },
    async session({ session, token }) {
      // Expose accessToken on the session object for client usage
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      return session;
    },
  },
};


/**
 * Legacy local auth helpers.
 *
 * This file previously contained email/password based signup and login
 * functions that talked directly to the backend. Authentication has now
 * been migrated to NextAuth + Keycloak, so these helpers are intentionally
 * left empty to avoid accidental usage.
 *
 * If you later need custom backend calls related to Keycloak-authenticated
 * users, you can add new helpers here that rely on session.accessToken.
 */

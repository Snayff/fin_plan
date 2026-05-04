/**
 * Decode the `exp` claim from a JWT access token.
 *
 * SECURITY: This is a UX hint only — used to schedule a proactive refresh
 * before the server-issued token expires. The backend always re-verifies the
 * signature and `exp`. NEVER use the decoded value for authorisation decisions.
 */
export function decodeAccessTokenExpMs(token: string): number | null {
  if (!token) return null;

  const segments = token.split(".");
  if (segments.length !== 3) return null;

  const payload = segments[1];
  if (!payload) return null;

  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json = atob(padded + padding);
    const decoded: unknown = JSON.parse(json);

    if (typeof decoded !== "object" || decoded === null) return null;
    const exp = (decoded as { exp?: unknown }).exp;
    if (typeof exp !== "number" || !Number.isFinite(exp)) return null;

    return exp * 1000;
  } catch {
    return null;
  }
}

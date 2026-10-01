import { SignJWT, jwtVerify } from 'jose';
import { fail } from './errors';
function key() {
  const secret = process.env.PREFERENCE_SIGNING_SECRET;
  if (!secret || secret.length < 32)
    fail(503, 'PREFERENCE_KEY_UNAVAILABLE', 'Preference service is not configured.');
  return new TextEncoder().encode(secret);
}
export function signPreferenceClaims(
  data: Record<string, unknown>,
  audience: string,
  expires: string,
) {
  return new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('lettercape-preferences')
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key());
}
export async function verifyPreferenceClaims(token: string, audience: string) {
  const signingKey = key();
  try {
    return (
      await jwtVerify(token, signingKey, {
        algorithms: ['HS256'],
        issuer: 'lettercape-preferences',
        audience,
      })
    ).payload;
  } catch {
    fail(404, 'PREFERENCE_LINK_INVALID', 'This preference link is invalid or expired.');
  }
}

import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is not set')
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

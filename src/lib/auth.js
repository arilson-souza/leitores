import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'chave_super_secreta_paroquia_dev'
);

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createToken(user) {
  return new SignJWT({ 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    name: user.name 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}

export async function setSession(token) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  // If we are in production but running via HTTP (e.g. local network),
  // secure: true will cause browser to reject cookie.
  // Use a fallback or env variable to control it if needed.
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24h
  });
}

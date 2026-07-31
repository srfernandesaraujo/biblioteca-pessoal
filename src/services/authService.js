import { jwtDecode } from 'jwt-decode';
import { db } from '../db/database';

const CURRENT_USER_KEY = 'biblioteca_current_user_session';

/**
 * Gets the current logged in user from localStorage.
 * @returns {object|null}
 */
export function getCurrentUser() {
  const session = localStorage.getItem(CURRENT_USER_KEY);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
}

/**
 * Processes a REAL Google ID Token (JWT) returned by Google Accounts Sign-In SDK.
 * @param {string} idToken - Cryptographically signed JWT token from Google
 * @returns {Promise<object>}
 */
export async function processRealGoogleToken(idToken) {
  try {
    const decoded = jwtDecode(idToken);
    const email = decoded.email?.toLowerCase().trim();
    const name = decoded.name || decoded.given_name || email.split('@')[0];
    const picture = decoded.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

    if (!email) {
      throw new Error('E-mail não encontrado no token do Google.');
    }

    const isAdminEmail = email === 'srfernandesaraujo@gmail.com';
    let user = await db.users.where({ email }).first();

    if (!user) {
      const newUser = {
        email,
        name,
        photoURL: picture,
        role: isAdminEmail ? 'admin' : 'user',
        status: isAdminEmail ? 'approved' : 'pending',
        createdAt: new Date().toISOString()
      };
      const id = await db.users.add(newUser);
      user = { ...newUser, id };
    } else {
      // Update photo/name from real Google account
      const updates = { photoURL: picture, name };
      if (isAdminEmail) {
        updates.role = 'admin';
        updates.status = 'approved';
      }
      await db.users.update(user.id, updates);
      user = { ...user, ...updates };
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  } catch (err) {
    console.error('Erro ao processar login do Google:', err);
    throw err;
  }
}

/**
 * Fallback / Direct Login handler for development/testing.
 */
export async function loginWithGoogleMock(email, name, photoURL) {
  const userEmail = email.toLowerCase().trim();
  const isAdminEmail = userEmail === 'srfernandesaraujo@gmail.com';

  let user = await db.users.where({ email: userEmail }).first();

  if (!user) {
    const newUser = {
      email: userEmail,
      name: name || userEmail.split('@')[0],
      photoURL: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`,
      role: isAdminEmail ? 'admin' : 'user',
      status: isAdminEmail ? 'approved' : 'pending',
      createdAt: new Date().toISOString()
    };
    const id = await db.users.add(newUser);
    user = { ...newUser, id };
  } else if (isAdminEmail && user.status !== 'approved') {
    await db.users.update(user.id, { status: 'approved', role: 'admin' });
    user.status = 'approved';
    user.role = 'admin';
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

/**
 * Logs out current user session.
 */
export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Refreshes user status from Dexie IndexedDB.
 */
export async function refreshCurrentUserStatus(userId) {
  if (!userId) return null;
  const user = await db.users.get(userId);
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  return user;
}

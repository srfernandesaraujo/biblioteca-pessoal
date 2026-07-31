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
 * Simulates or handles Google OAuth Login.
 * Automatically approves srfernandesaraujo@gmail.com as Admin.
 * New users are assigned status: 'pending'.
 */
export async function loginWithGoogle(email, name, photoURL) {
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
    // Ensure Super Admin is always approved
    await db.users.update(user.id, { status: 'approved', role: 'admin' });
    user.status = 'approved';
    user.role = 'admin';
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

/**
 * Logs out the current user session.
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

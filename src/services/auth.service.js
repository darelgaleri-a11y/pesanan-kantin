import {
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";

import { auth } from "../firebase.js";

/**
 * Tunggu status Firebase Auth, lalu buat sesi anonim bila belum ada.
 * Sesi anonim memenuhi Firestore Rules request.auth != null tanpa
 * menampilkan halaman login atau menu akun kepada pengguna.
 */
export async function ensureAnonymousSession() {
  const currentUser = await waitForAuthReady();
  if (currentUser) return currentUser;

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function waitForAuthReady() {
  return new Promise((resolve, reject) => {
    let unsubscribe = null;
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (unsubscribe) unsubscribe();
          resolve(user);
        },
        (error) => {
          if (unsubscribe) unsubscribe();
          reject(error);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

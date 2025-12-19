'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  UserCredential,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Links email/password credentials to the currently signed-in anonymous user.
 * This should be the preferred method for "signing up" when an anonymous user exists.
 */
async function linkEmailCredentialsToCurrentUser(
  authInstance: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  const currentUser = authInstance.currentUser;
  if (!currentUser) {
    throw new Error('No user is currently signed in to link credentials.');
  }

  const credential = EmailAuthProvider.credential(email, password);

  // CRITICAL: Return the promise from linkWithCredential.
  return linkWithCredential(currentUser, credential);
}

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth) {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/**
 * Initiates email/password sign-up.
 * If an anonymous user is currently signed in, it links the new credentials to that user.
 * Otherwise, it creates a new user.
 */
export async function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  // If a user is already signed in (likely anonymous), link the new credentials.
  if (authInstance.currentUser && authInstance.currentUser.isAnonymous) {
    return linkEmailCredentialsToCurrentUser(authInstance, email, password);
  } else {
    // Otherwise, create a new user account.
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      email,
      password
    );
    return userCredential;
  }
}

/** Initiate email/password sign-in. Returns a promise for handling success/error. */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

export function initiateEmailSignOut(authInstance: Auth): Promise<void> {
  return signOut(authInstance);
}

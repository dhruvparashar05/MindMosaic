"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./firebase";

// signup
export const signup = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

// login
export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

// logout
export const logout = () => signOut(auth);

// auth listener
export const listenToAuth = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);

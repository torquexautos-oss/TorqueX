/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

// Define superusers (emails that get full moderation access)
export const SUPER_USERS = [
    'saketjndl2005@gmail.com',
    'sodiumcya098@gmail.com',
    'pranavahuja2304@gmail.com',
    'pranavmontero@gmail.com'
];

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isSuperUser, setIsSuperUser] = useState(false);
    const [loading, setLoading] = useState(true);

    // Global Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    /**
     * Create or update the user's document in Firestore.
     * - On first signup/login: creates a full document with createdAt timestamp.
     * - On subsequent logins: refreshes only lastSeen, displayName, photoURL.
     * Non-critical: if Firestore rules block it, we warn quietly & continue.
     */
    const upsertUserDoc = async (firebaseUser, isNewUser = false) => {
        if (!firebaseUser?.uid) return;
        try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const isSuperAdmin = SUPER_USERS.includes((firebaseUser.email || '').toLowerCase());

            if (isNewUser) {
                await setDoc(userDocRef, {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || 'Anonymous',
                    photoURL: firebaseUser.photoURL || null,
                    role: isSuperAdmin ? 'superadmin' : 'user',
                    commentCount: 0,
                    createdAt: serverTimestamp(),
                    lastSeen: serverTimestamp(),
                });
            } else {
                // Merge-update to avoid wiping existing fields
                await setDoc(userDocRef, {
                    displayName: firebaseUser.displayName || 'Anonymous',
                    photoURL: firebaseUser.photoURL || null,
                    lastSeen: serverTimestamp(),
                }, { merge: true });
            }
        } catch (err) {
            console.warn('[Firestore] Could not upsert user doc:', err.code || err.message);
        }
    };

    async function signup(email, password, displayName) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Apply displayName to the Auth profile first so upsertUserDoc picks it up
        await updateProfile(userCredential.user, { displayName });
        await upsertUserDoc({ ...userCredential.user, displayName }, true);
        return userCredential;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Check if this is the first time this Google account has ever signed in
        const userDocRef = doc(db, 'users', result.user.uid);
        const snap = await getDoc(userDocRef);
        await upsertUserDoc(result.user, !snap.exists());

        return result;
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                setIsSuperUser(SUPER_USERS.includes((user.email || '').toLowerCase()));
                // Refresh lastSeen on every page load / tab focus (non-blocking)
                upsertUserDoc(user, false);
            } else {
                setIsSuperUser(false);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        isSuperUser,
        login,
        loginWithGoogle,
        signup,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

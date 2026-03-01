import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

    async function signup(email, password, displayName) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with display name
        await updateProfile(userCredential.user, { displayName });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: email,
            displayName: displayName,
            createdAt: new Date().toISOString(),
            role: SUPER_USERS.includes(email.toLowerCase()) ? 'superadmin' : 'user'
        });

        return userCredential;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithRedirect(auth, provider);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                setIsSuperUser(SUPER_USERS.includes(user.email.toLowerCase()));

                // Handle Firestore user document creation after redirect
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (!userDocSnap.exists()) {
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        createdAt: new Date().toISOString(),
                        role: SUPER_USERS.includes(user.email.toLowerCase()) ? 'superadmin' : 'user'
                    });
                }
            } else {
                setIsSuperUser(false);
            }
            setLoading(false);
        });

        // Check for redirect result on mount
        getRedirectResult(auth).catch(err => console.error("Redirect error:", err));

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
        closeAuthModal
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

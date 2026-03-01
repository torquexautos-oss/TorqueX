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
        const result = await signInWithPopup(auth, provider);

        // Ensure user document exists in Firestore on first login
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                createdAt: new Date().toISOString(),
                role: SUPER_USERS.includes(result.user.email.toLowerCase()) ? 'superadmin' : 'user'
            });
        }

        return result;
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                setIsSuperUser(SUPER_USERS.includes(user.email.toLowerCase()));
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
        closeAuthModal
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

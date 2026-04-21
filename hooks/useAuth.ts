import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { onAuthStateChange, fetchUserProfile, checkUserNeedsPasswordChange, isPermissionError, logoutUser } from '../services/firebaseService';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChange(async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                setCheckingProfile(true);
                try {
                    const profile = await fetchUserProfile(currentUser.uid);
                    setUserProfile(profile);
                    const needsChange = await checkUserNeedsPasswordChange(currentUser.uid);
                    setMustChangePassword(needsChange);
                } catch (err) {
                    if (isPermissionError(err)) setPermissionDenied(true);
                } finally {
                    setCheckingProfile(false);
                }
            } else {
                setUserProfile(null);
                setMustChangePassword(false);
                setPermissionDenied(false);
            }

            setAuthLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout failed", error);
        }
    }, []);

    const isAdmin = userProfile?.role === 'Admin';

    const canModifyProject = useCallback((projectNo: string) => {
        if (isAdmin) return true;
        return userProfile?.assignedProjects?.includes(projectNo);
    }, [isAdmin, userProfile]);

    return {
        user,
        userProfile,
        authLoading,
        mustChangePassword,
        checkingProfile,
        permissionDenied,
        setMustChangePassword,
        setPermissionDenied,
        setUserProfile, // Exposing this so we can quickly update assignedProjects on create
        handleLogout,
        isAdmin,
        canModifyProject
    };
}

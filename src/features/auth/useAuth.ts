/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { UserProfile } from '../../types/index';
import { formatPhone, getMockEmail } from '../../utils/index';
import {
  auth, db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  serverTimestamp,
  FirebaseUser
} from '../../api/apiClient';

import { isAdminPhone } from '../../constants/admin';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
        
        try {
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
          } else {
            const formattedPhone = firebaseUser.sdt || firebaseUser.id || '';
            const newProfile = {
              uid: firebaseUser.uid || firebaseUser.id,
              sdt: formattedPhone,
              displayName: firebaseUser.displayName || 'Người dùng mới',
              email: firebaseUser.email || undefined,
              role: isAdminPhone(formattedPhone) ? 'admin' : 'user',
              status: 'active',
              createdAt: serverTimestamp(),
            };
            await setDoc(profileRef, newProfile, { merge: true });
            setProfile(newProfile as UserProfile);
          }
          if (profileSnap.exists()) {
            const firestoreProfile = profileSnap.data() as UserProfile;
            if (firestoreProfile.displayName && firebaseUser.displayName !== firestoreProfile.displayName) {
              const updatedMockUser = { ...firebaseUser, displayName: firestoreProfile.displayName };
              localStorage.setItem('auth_user', JSON.stringify(updatedMockUser));
            }
          }
        } catch (profileError) {
          console.warn('[useAuth] Profile fetch error, using fallback:', profileError);
          // User không tồn tại trong DB - xóa auth data cũ
          localStorage.removeItem('auth_user');
          localStorage.removeItem('aerorefund-auth-token');
          const formattedPhone = firebaseUser.sdt || firebaseUser.id || '';
          const fallbackProfile = {
            uid: firebaseUser.uid || firebaseUser.id,
            sdt: formattedPhone,
            displayName: firebaseUser.displayName || 'Người dùng',
            email: firebaseUser.email || undefined,
            role: isAdminPhone(formattedPhone) ? 'admin' : 'user',
            status: 'active',
          };
          setProfile(fallbackProfile as UserProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (phone: string, pass: string) => {
    setLoginError(null);
    setIsLoading(true);

    if (!phone.trim()) {
      setLoginError('Vui lòng nhập số điện thoại.');
      setIsLoading(false);
      return;
    }

    if (!pass) {
      setLoginError('Vui lòng nhập mật khẩu.');
      setIsLoading(false);
      return;
    }

    const isEmailInput = phone.includes('@');
    const loginIdentifier = isEmailInput ? phone.trim() : (getMockEmail ? getMockEmail(formatPhone(phone)) : phone.trim());

    try {
      const result = await signInWithEmailAndPassword(auth, loginIdentifier, pass) as any;

      if (!result) {
        throw new Error('Không nhận được phản hồi từ máy chủ.');
      }
      if (!result.user) {
        console.error('[useAuth] Login response missing user:', result);
        throw new Error('Không nhận được thông tin người dùng. Vui lòng thử đăng nhập lại.');
      }

      const profileRef = doc(db, 'users', result.user.uid);
      let finalDisplayName = result.user.displayName;
      
      try {
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const pf = profileSnap.data();
          if (pf.displayName) {
            finalDisplayName = pf.displayName;
            const updatedMockUser = { ...result.user, displayName: finalDisplayName };
            localStorage.setItem('auth_user', JSON.stringify(updatedMockUser));
          }
        }
      } catch (profileError) {
        console.warn('[useAuth] Profile fetch after login error, using fallback:', profileError);
      }

      setUser({ ...result.user, displayName: finalDisplayName });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('401') || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setLoginError('Mật khẩu không chính xác hoặc tài khoản không tồn tại.');
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
      } else {
        setLoginError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (displayName: string, email: string, phone: string, pass: string, confirmPass: string) => {
    setLoginError(null);
    setIsLoading(true);

    if (!displayName.trim()) {
      setLoginError('Vui lòng nhập họ và tên.');
      setIsLoading(false);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setLoginError('Vui lòng nhập email hợp lệ.');
      setIsLoading(false);
      return;
    }

    if (!phone.trim()) {
      setLoginError('Vui lòng nhập số điện thoại.');
      setIsLoading(false);
      return;
    }

    if (!pass || pass.length < 6) {
      setLoginError('Mật khẩu phải có ít nhất 6 ký tự.');
      setIsLoading(false);
      return;
    }

    if (pass !== confirmPass) {
      setLoginError('Mật khẩu xác nhận không khớp.');
      setIsLoading(false);
      return;
    }

    const formattedPhone = formatPhone(phone);

    try {
      const result = await createUserWithEmailAndPassword(auth, formattedPhone, pass, displayName.trim(), email.trim()) as any;
      if (!result?.user) throw new Error('Registration failed');

      // Backend đã tạo user đầy đủ trong PostgreSQL (displayName, email, role)
      // Không cần gọi thêm PATCH /users hoặc ghi Firestore

      setLoginSuccess('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      setTimeout(() => setLoginSuccess(null), 5000);
      return true; // Success
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.code === 'auth/email-already-in-use' || error.message?.includes('409')) {
        setLoginError('Số điện thoại hoặc Email này đã được đăng ký.');
      } else {
        setLoginError(error.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => firebaseSignOut(auth);

  return {
    user,
    profile,
    loading,
    isLoading,
    loginError,
    loginSuccess,
    login,
    register,
    logout,
    setLoginError,
    setLoginSuccess
  };
};

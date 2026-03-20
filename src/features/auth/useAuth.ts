/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  auth, db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  doc, getDoc, setDoc,
  serverTimestamp,
  FirebaseUser
} from '../../mockFirebase';
import { UserProfile } from '../../types';
import { formatPhone, getMockEmail } from '../../utils';

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
        
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          // Fallback if profile doesn't exist yet
          const formattedPhone = firebaseUser.phoneNumber || firebaseUser.email?.split('_')[1]?.split('@')[0] || '';
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            sdt: formattedPhone,
            displayName: firebaseUser.displayName || 'Người dùng mới',
            email: firebaseUser.email || undefined,
            role: ['0999999999', '0383165313', '0968686868'].some(p => firebaseUser.email?.includes(p)) ? 'admin' : 'user',
            status: 'active',
            createdAt: serverTimestamp(),
          };
          await setDoc(profileRef, newProfile, { merge: true });
          setProfile(newProfile);
        }
        // Cập nhật mockUser localStorage với displayName từ Firestore profile
        if (profileSnap.exists()) {
          const firestoreProfile = profileSnap.data() as UserProfile;
          if (firestoreProfile.displayName && firebaseUser.displayName !== firestoreProfile.displayName) {
            const updatedMockUser = { ...firebaseUser, displayName: firestoreProfile.displayName };
            localStorage.setItem('mockUser', JSON.stringify(updatedMockUser));
          }
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
    const loginIdentifier = isEmailInput ? phone.trim() : getMockEmail(formatPhone(phone));

    try {
      const result = await signInWithEmailAndPassword(auth, loginIdentifier, pass);

      // Lấy profile từ Firestore ngay lập tức để đồng bộ displayName
      const profileRef = doc(db, 'users', result.user.uid);
      const profileSnap = await getDoc(profileRef);
      let finalDisplayName = result.user.displayName;
      if (profileSnap.exists()) {
        const pf = profileSnap.data();
        if (pf.displayName) {
          finalDisplayName = pf.displayName;
          // Đồng bộ ngược vào mockUser để onAuthStateChanged đọc đúng
          const updatedMockUser = { ...result.user, displayName: finalDisplayName };
          localStorage.setItem('mockUser', JSON.stringify(updatedMockUser));
        }
      }

      setUser({ ...result.user, displayName: finalDisplayName });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setLoginError('Mật khẩu không chính xác hoặc tài khoản không tồn tại.');
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
      } else {
        setLoginError('Đăng nhập thất bại. Vui lòng thử lại sau.');
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
    const isAdmin = ['0999999999', '0383165313', '0968686868'].includes(formattedPhone);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(userCredential.user, { displayName: displayName.trim() });

      const profileRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(profileRef, {
        uid: userCredential.user.uid,
        sdt: formattedPhone,
        displayName: displayName.trim(),
        email: email.trim(),
        role: isAdmin ? 'admin' : 'user',
        status: 'active',
        createdAt: serverTimestamp(),
      });

      setLoginSuccess('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      setTimeout(() => setLoginSuccess(null), 5000);
      return true; // Success
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setLoginError('Số điện thoại này đã được đăng ký.');
      } else {
        setLoginError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => signOut(auth);

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

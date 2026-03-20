/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';

interface RegisterFormProps {
  onRegister: (displayName: string, email: string, phoneNumber: string, pass: string, confirmPass: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, isLoading, error, onSwitchToLogin }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const AUTO_GENERATED_NAME_PATTERNS = [
    /^(user|test|admin|fake|temp|dummy|phone_?\d+)/i,
    /^\d{6,}$/,
    /^[\W_]+$/,
  ];

  const validateDisplayName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const words = trimmed.split(/\s+/);
    if (words.length < 2) {
      return 'Vui lòng nhập đầy đủ Họ và Tên (ít nhất 2 từ).';
    }
    if (trimmed.length < 4) {
      return 'Họ và tên quá ngắn. Vui lòng nhập đầy đủ họ tên.';
    }
    for (const pattern of AUTO_GENERATED_NAME_PATTERNS) {
      if (pattern.test(trimmed)) {
        return 'Họ và tên không hợp lệ. Vui lòng nhập tên thật của bạn.';
      }
    }
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayName(val);
    setNameError(validateDisplayName(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateDisplayName(displayName);
    if (validationError) {
      setNameError(validationError);
      return;
    }
    onRegister(displayName.trim(), email, phoneNumber, password, confirmPassword);
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 text-[13px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-sm">
          <AlertTriangle size={16} className="shrink-0 text-red-500" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[13px] font-bold text-gray-700 uppercase">Họ và tên <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            className={`w-full h-[36px] px-3 text-[14px] text-black border rounded-sm bg-white font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-shadow ${nameError ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
            placeholder="VD: Nguyễn Văn A"
            value={displayName}
            onChange={handleNameChange}
          />
          {nameError && (
            <p className="text-[11px] text-red-500 font-semibold mt-0.5">{nameError}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-bold text-gray-700 uppercase">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            required
            className="w-full h-[36px] px-3 text-[14px] text-black border border-gray-300 rounded-sm bg-white font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-shadow"
            placeholder="VD: example@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[13px] font-bold text-gray-700 uppercase">Số điện thoại <span className="text-red-500">*</span></label>
          <input
            type="tel"
            required
            className="w-full h-[36px] px-3 text-[14px] text-black border border-gray-300 rounded-sm bg-white font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-shadow"
            placeholder="SĐT liên hệ"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
          />
        </div>
        
        <div className="space-y-1 relative">
          <label className="text-[13px] font-bold text-gray-700 uppercase">Mật khẩu <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              className="w-full h-[36px] px-3 pr-10 text-[14px] text-black border border-gray-300 rounded-sm bg-white font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-shadow"
              placeholder="Nhập ít nhất 6 ký tự"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 bottom-0 w-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-sm transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div className="space-y-1 relative">
          <label className="text-[13px] font-bold text-gray-700 uppercase">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={6}
              className="w-full h-[36px] px-3 pr-10 text-[14px] text-black border border-gray-300 rounded-sm bg-white font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-shadow"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-0 top-0 bottom-0 w-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-sm transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            type="submit" 
            className="w-full h-[40px] bg-gradient-to-b from-[#FF8800] to-[#E55A00] hover:from-[#FFAA00] hover:to-[#FF6600] text-white font-black text-[15px] rounded flex items-center justify-center gap-2 border border-[#C24D00] shadow-md uppercase tracking-wide cursor-pointer transition-colors active:scale-[0.98]" 
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> VUI LÒNG ĐỢI...</> : 'ĐĂNG KÝ TÀI KHOẢN'}
          </button>
        </div>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-200 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[13px] font-bold text-blue-600 hover:text-orange-500 underline transition-colors cursor-pointer"
        >
          « Đã có tài khoản? Quay về Đăng nhập
        </button>
      </div>
    </div>
  );
};

// Removed default export

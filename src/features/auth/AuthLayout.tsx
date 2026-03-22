/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Plane } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="bg-white min-h-[100dvh] font-sans text-gray-800 antialiased flex flex-col">
      
      {/* Top Header */}
      <div className="w-full max-w-[1200px] mx-auto px-4 py-3 flex justify-between items-center bg-white shadow-sm relative z-10">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-black text-amber-500 italic tracking-tighter shadow-sm flex flex-col leading-none">
            <span className="text-blue-900 text-base md:text-xl font-bold not-italic mb-1">TRUNG TÂM HỖ TRỢ</span>
            <span className="text-sm md:text-base">HÀNG KHÔNG VIỆT NAM</span>
          </h1>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="w-full bg-[#113C85] shadow-md border-b-2 border-orange-500">
        <div className="w-full max-w-[1200px] mx-auto flex items-center">
          <button className="h-[42px] px-3 md:px-4 flex items-center justify-center bg-gradient-to-b from-blue-300 to-[#113C85] border-r border-[#1a4a9c]" onClick={() => window.location.reload()}>
            <Home size={20} className="text-white" />
          </button>
          <nav className="flex-1 flex text-xs md:text-[13px] font-bold text-white uppercase overflow-hidden tracking-tight leading-none">
            <a href="#" onClick={e => {e.preventDefault(); window.location.reload();}} className="h-[42px] px-2 md:px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]">Trang chủ</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-2 md:px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default hidden sm:flex">Vé nội địa</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-2 md:px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default hidden md:flex">Vé quốc tế</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-2 md:px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Hoàn Tiền Vé</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-2 md:px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default hidden sm:flex">Tin khuyến mại</a>
          </nav>
        </div>
      </div>

      {/* Main Content Form Area */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto py-8 px-4 flex justify-center items-center pt-16 relative">
        <div className="w-full max-w-md">
          <div className="rounded-lg overflow-hidden bg-[#0A58A3] shadow-xl border border-[#06427D]">
            <div className="bg-[#0A58A3] py-3 px-6 flex items-center justify-center gap-2 border-b-2 border-[#FF8800]">
               <h2 className="text-white font-bold text-lg uppercase tracking-wider font-sans m-0 text-center leading-tight">
                 {title}
               </h2>
            </div>
            <div className="p-6 bg-white">
              <p className="text-xs text-orange-600 font-bold mb-5 pb-3 border-b border-gray-200 text-center uppercase tracking-wide">
                {subtitle}
              </p>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-[#113C85] border-t-4 border-[#FFAA00] py-5 mt-auto relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/airline-bg.png')] bg-cover bg-center mix-blend-overlay opacity-10"></div>
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
          {/* Footer Grid */}
          <div className="flex flex-col md:flex-row justify-between gap-5 md:gap-8 pb-5 border-b border-[#2151A1]/60">
            <div className="text-white text-xs md:text-[12px] space-y-1.5 md:space-y-2">
              <h4 className="text-[#FF8800] font-black text-xs md:text-[13px] uppercase mb-2 md:mb-3 flex items-center gap-1.5"><Plane size={12} className="rotate-45" /> BẠN CÒN THẮC MẮC</h4>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Liên hệ</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Hướng dẫn thanh toán</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Hướng dẫn đặt vé</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Câu hỏi thường gặp</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Chăm sóc khách hàng</p>
            </div>
            <div className="text-white text-xs md:text-[12px] space-y-1.5 md:space-y-2">
              <h4 className="text-[#FF8800] font-black text-xs md:text-[13px] uppercase mb-2 md:mb-3 flex items-center gap-1.5"><Plane size={12} className="rotate-45" /> VỀ CHÚNG TÔI</h4>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Giới thiệu</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Các đơn vị hợp tác</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Điều khoản sử dụng</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Chính sách bảo mật</p>
            </div>
          </div>
          <div className="text-right text-[9px] md:text-[10px] text-blue-200 mt-3 md:mt-4 leading-relaxed max-w-xs md:max-w-sm ml-auto opacity-70">
            TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM<br/>
            Số ĐKKD 01xxxxxxx - Mã số thuế: 0105xxxxxx<br/>
            © 2026 TRUNG TÂM HỖ TRỢ HÀNG KHÔNG VIỆT NAM. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

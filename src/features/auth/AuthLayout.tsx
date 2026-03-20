/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhoneCall, Home, Plane } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="bg-white min-h-[100dvh] font-sans text-gray-800 antialiased flex flex-col">
      
      {/* Top Header exactly matching AbayHomePage */}
      <div className="w-full max-w-[1020px] mx-auto px-4 py-3 flex justify-between items-center bg-white shadow-sm relative z-10">
        <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.reload()}>
          <h1 className="text-4xl font-black text-amber-500 italic tracking-tighter shadow-sm flex items-end">
            <span className="text-blue-900 text-5xl">V</span>É MÁY BAY 365<span className="text-sm font-bold text-gray-600 no-italic ml-1 mb-1">.vn</span>
          </h1>
          <p className="text-xs text-orange-600 font-bold ml-1 mt-1 uppercase">Vé máy bay giá rẻ Phục vụ 24/7</p>
        </div>
        
        <div className="flex items-center gap-2 text-right">
          <PhoneCall size={40} className="text-orange-500" strokeWidth={1.5} />
          <div>
            <div className="text-sm text-gray-600">Tổng đài hỗ trợ: <span className="text-xl font-bold text-orange-500 tracking-tight">1900 6091</span></div>
            <div className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 mt-0.5 rounded italic">Giờ làm việc: 0h - 24h (không nghỉ)</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="w-full bg-[#113C85] shadow-md border-b-2 border-orange-500">
        <div className="w-full max-w-[1020px] mx-auto flex items-center">
          <button className="h-[42px] px-4 flex items-center justify-center bg-gradient-to-b from-blue-300 to-[#113C85] border-r border-[#1a4a9c]" onClick={() => window.location.reload()}>
            <Home size={22} className="text-white" />
          </button>
          <nav className="flex-1 flex text-[13px] font-bold text-white uppercase overflow-hidden tracking-tight leading-none">
            <a href="#" onClick={e => {e.preventDefault(); window.location.reload();}} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c]">Trang chủ</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Vé nội địa</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Vé quốc tế</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Vé theo hãng</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Tin khuyến mại</a>
          </nav>
        </div>
      </div>

      {/* Main Content Form Area */}
      <div className="flex-1 w-full max-w-[1020px] mx-auto py-10 px-4 flex justify-center items-start pt-16 relative">
        <div className="w-full max-w-[380px]">
          <div className="rounded-t-md overflow-hidden bg-[#0A58A3] shadow-lg border border-[#06427D]">
            <div className="bg-[#06427D] py-2.5 px-4 flex items-center justify-center gap-2 border-b border-[#0A73D1]">
               <h2 className="text-white font-bold text-[18px] uppercase tracking-wide font-sans m-0 text-center leading-snug">
                 {title}
               </h2>
            </div>
            <div className="p-5 bg-white">
              <p className="text-[12px] text-gray-500 mb-5 pb-3 border-b border-gray-100 font-semibold text-center italic">
                {subtitle}
              </p>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-[#113C85] border-t-4 border-[#FFAA00] py-8 mt-auto">
        <div className="w-full max-w-[1020px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-[#2151A1]/60">
            <div className="text-white text-[12px] space-y-2">
              <h4 className="text-[#FF8800] font-black text-[13px] uppercase mb-3 flex items-center gap-1.5"><Plane size={14} className="rotate-45" /> BẠN CÒN THẮC MẮC</h4>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Liên hệ</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Hướng dẫn thanh toán</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Hướng dẫn đặt vé</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Câu hỏi thường gặp</p>
            </div>
            <div className="text-white text-[12px] space-y-2">
              <h4 className="text-[#FF8800] font-black text-[13px] uppercase mb-3 flex items-center gap-1.5"><Plane size={14} className="rotate-45" /> VỀ CHÚNG TÔI</h4>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Giới thiệu</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Các đơn vị hợp tác</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Điều khoản sử dụng</p>
              <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80"><span className="w-1 h-1 rounded-full bg-white opacity-50" />Chính sách bảo mật</p>
            </div>
            <div className="flex flex-col md:items-end gap-3">
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-[#3b5998] rounded-sm text-white font-black text-base flex items-center justify-center cursor-default shadow">f</div>
                <div className="w-7 h-7 bg-[#00aced] rounded-sm text-white font-black text-base flex items-center justify-center cursor-default shadow">t</div>
              </div>
              <div className="bg-white rounded p-1 shadow-xl">
                <div className="w-[140px] h-12 flex items-center justify-center gap-1.5 px-2">
                  <div className="w-8 h-8 rounded-full border-[3px] border-blue-600 flex items-center justify-center">
                    <div className="text-blue-600 font-black text-xl leading-none -mt-0.5">✓</div>
                  </div>
                  <div className="text-left font-black leading-tight tracking-tight">
                    <div className="text-[10px] text-blue-900 leading-none">ĐÃ THÔNG BÁO</div>
                    <div className="text-[9px] text-blue-600 leading-none">BỘ CÔNG THƯƠNG</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6 text-white text-[11px] leading-relaxed opacity-90">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-[80px] h-[56px] bg-white rounded overflow-hidden flex-shrink-0 border-2 border-white shadow-lg flex items-center justify-center">
                {/* Vietnam Airlines logo representation */}
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A58A3]">
                  <svg viewBox="0 0 80 56" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <rect width="80" height="56" fill="#0A58A3"/>
                    <text x="40" y="20" textAnchor="middle" fill="#FFD700" fontSize="10" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.5">VIETNAM</text>
                    <text x="40" y="33" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">AIRLINES</text>
                    <polygon points="40,38 35,45 45,45" fill="#FFD700"/>
                    <line x1="20" y1="48" x2="60" y2="48" stroke="#FFD700" strokeWidth="1.5"/>
                  </svg>
                </div>
              </div>
              <div>
                <div className="font-bold text-[12px] mb-1 tracking-wide uppercase">VÉ MÁY BAY TẠI TP HỒ CHÍ MINH</div>
                <div>Lầu 2, Tòa nhà hành chính, Quận 1, Tp. HCM</div>
                <div>Tel: (+028) 1900 6091</div>
              </div>
            </div>
            <div className="flex items-start gap-3 flex-1">
              <div className="w-[80px] h-[56px] bg-white rounded overflow-hidden flex-shrink-0 border-2 border-white shadow-lg flex items-center justify-center">
                {/* Vietnam Airlines logo representation */}
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A58A3]">
                  <svg viewBox="0 0 80 56" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <rect width="80" height="56" fill="#0A58A3"/>
                    <text x="40" y="20" textAnchor="middle" fill="#FFD700" fontSize="10" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.5">VIETNAM</text>
                    <text x="40" y="33" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">AIRLINES</text>
                    <polygon points="40,38 35,45 45,45" fill="#FFD700"/>
                    <line x1="20" y1="48" x2="60" y2="48" stroke="#FFD700" strokeWidth="1.5"/>
                  </svg>
                </div>
              </div>
              <div>
                <div className="font-bold text-[12px] mb-1 tracking-wide uppercase">VÉ MÁY BAY TẠI HÀ NỘI</div>
                <div>Tầng 5, Trung tâm điều hành, Quận Đống Đa, Hà Nội</div>
                <div>Tel: (+024) 1900 6091</div>
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-blue-200 mt-6 leading-relaxed opacity-70">
            Công ty TNHH vé máy bay trực tuyến 365 - Số ĐKKD 01xxxxxxx<br/>
            © 2026 Copyright. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

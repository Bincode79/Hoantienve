import React from 'react';
import { PhoneCall, Mail, Clock, Plane, ShieldCheck, HelpCircle } from 'lucide-react';

interface AppFooterProps {
  config: {
    supportPhone?: string;
    supportEmail?: string;
    workingHours?: string;
    copyright?: string;
  };
}

export const AppFooter: React.FC<AppFooterProps> = ({ config }) => {
  return (
    <footer className="w-full bg-[#113C85] border-t-4 border-[#FFAA00] py-8 mt-10 relative z-10 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
      
      <div className="w-full max-w-[1020px] mx-auto px-4 md:px-0 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          
          {/* Brand Info */}
          <div className="col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <Plane className="text-[#FFAA00] rotate-45" size={24} strokeWidth={2.5} />
              <h1 className="text-2xl font-bold tracking-tight flex items-baseline leading-none text-white">
                <span>365</span>
                <span className="text-[#FFAA00] text-lg ml-0.5">.vn</span>
              </h1>
            </div>
            <p className="text-xs text-blue-200 leading-relaxed max-w-xs">
              Hệ thống quản lý đại lý & hoàn vé máy bay tự động
            </p>
          </div>

          {/* Contact Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Liên hệ hỗ trợ</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-blue-200">
                <PhoneCall size={14} className="text-[#FFAA00]" />
                <span className="font-semibold text-white">Tổng đài: {config?.supportPhone || '1900 6091'}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                 <Mail size={14} className="text-[#FFAA00]" />
                 <span>{config?.supportEmail || 'hotro@aerorefund.com'}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                 <Clock size={14} className="text-[#FFAA00]" />
                 <span>Giờ làm việc: {config?.workingHours || '0h - 24h'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Chính sách</h4>
            <ul className="space-y-2 text-xs text-blue-200">
              {['Điều khoản sử dụng', 'Chính sách bảo mật', 'Quy trình hoàn vé', 'Hướng dẫn sử dụng'].map(item => (
                <li key={item} className="hover:text-white transition-colors cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-[#FFAA00] uppercase tracking-wider">Dịch vụ</h4>
            <ul className="space-y-2 text-xs text-blue-200">
              {['Vé máy bay nội địa', 'Vé máy bay quốc tế', 'Hoàn vé tự động', 'Hỗ trợ đại lý'].map(item => (
                <li key={item} className="hover:text-white transition-colors cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-700/30 pt-3 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[10px] text-blue-300">
            © 2026 365.vn - Hệ thống hoàn vé máy bay. Mọi hành vi sao chép khi chưa được cho phép đều bị nghiêm cấm.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-blue-300 hover:text-white cursor-pointer transition-colors">Facebook</span>
            <span className="text-[10px] text-blue-300 hover:text-white cursor-pointer transition-colors">Zalo</span>
            <span className="text-[10px] text-blue-300 hover:text-white cursor-pointer transition-colors">YouTube</span>
          </div>
        </div>
      </div>
    </footer>
  );
};


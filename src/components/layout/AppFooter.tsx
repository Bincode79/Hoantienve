import React from 'react';
import { PhoneCall, Mail, Clock } from 'lucide-react';

interface AppFooterProps {
  config: {
    supportPhone: string;
    supportEmail: string;
    workingHours: string;
    copyright: string;
  };
}

export const AppFooter: React.FC<AppFooterProps> = ({ config }) => {
  return (
    <div className="w-full bg-[#113C85] border-t-4 border-[#FFAA00] py-8 mt-10 relative z-10 overflow-hidden">
      {/* Wave decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FFAA00] to-transparent"></div>
      </div>

      <div className="w-full max-w-[1020px] mx-auto px-4 md:px-0 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          {/* Brand */}
          <div>
            <div className="flex items-end gap-1.5 mb-2">
              <span className="text-2xl font-black text-amber-400 italic tracking-tighter">365</span>
              <span className="text-sm font-bold text-blue-300 no-italic mb-0.5">.vn</span>
            </div>
            <p className="text-[11px] text-blue-200 leading-relaxed">
              Hệ thống quản lý đại lý<br/>
              & hoàn vé máy bay tự động
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2">Liên hệ hỗ trợ</h4>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[11px] text-blue-200">
                <PhoneCall size={12} className="text-amber-400 shrink-0" />
                <span>Tổng đài: <span className="text-white font-bold">{config?.supportPhone || '1900 6091'}</span></span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-blue-200">
                <Mail size={12} className="text-amber-400 shrink-0" />
                <span>{config?.supportEmail || 'hotro@hoanvemaybay.com'}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-blue-200">
                <Clock size={12} className="text-amber-400 shrink-0" />
                <span>Giờ làm việc: {config?.workingHours || '0h - 24h'}</span>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2">Chính sách</h4>
            <div className="flex flex-col gap-1">
              {['Điều khoản sử dụng', 'Chính sách bảo mật', 'Quy trình hoàn vé', 'Phí dịch vụ'].map(item => (
                <div key={item} className="text-[11px] text-blue-200 cursor-pointer hover:text-amber-400 transition-colors">
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-blue-700 pt-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-[10px] text-blue-300 text-center md:text-left leading-relaxed">
              {config?.copyright || '© 2026 hoanvemaybay.com — Hệ thống quản lý đại lý & hoàn vé tự động.'}<br/>
              <span className="text-blue-400">Mọi hành vi sao chép, phát hành nội dung mà không có sự đồng ý đều bị nghiêm cấm.</span>
            </div>
            <div className="flex items-center gap-3">
              {['Facebook', 'Zalo', 'YouTube'].map(social => (
                <div key={social} className="text-[10px] text-blue-300 bg-blue-800/50 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-700 hover:text-amber-400 transition-colors">
                  {social}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

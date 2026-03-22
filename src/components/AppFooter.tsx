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
    <footer className="w-full bg-slate-900 pt-16 pb-8 text-slate-400 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
      
      <div className="container-premium relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-primary-500 p-2 rounded-xl shadow-lg shadow-primary-500/20 group-hover:rotate-12 transition-transform duration-500">
                <Plane className="text-white rotate-45" size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-display font-extrabold tracking-tight flex items-baseline leading-none text-white">
                <span>365</span>
                <span className="text-slate-500 text-lg ml-0.5">.vn</span>
              </h1>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Hệ thống cung cấp giải pháp quản lý đại lý & xử lý hoàn vé máy bay chuyên nghiệp hàng đầu tại Việt Nam.
            </p>
            <div className="flex gap-4">
              {['FB', 'ZL', 'YT'].map(social => (
                <div key={social} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white hover:bg-primary-500 hover:border-primary-500 transition-all cursor-pointer">
                  {social}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Links */}
          <div className="md:col-span-4 space-y-6">
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-widest">Hỗ trợ khách hàng</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                  <PhoneCall size={18} />
                </div>
                <div>
                   <span className="text-[10px] uppercase font-bold tracking-widest block text-slate-500 mb-0.5">Tổng đài 24/7</span>
                   <span className="text-white font-display font-bold text-lg">{config?.supportPhone || '1900 6091'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm hover:text-white transition-colors cursor-pointer group">
                 <Mail size={16} className="text-slate-600 group-hover:text-primary-400" />
                 <span>{config?.supportEmail || 'hotro@bay365.vn'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                 <Clock size={16} className="text-slate-600" />
                 <span>Giờ làm việc: {config?.workingHours || '07:00 - 22:00'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-widest">Dịch vụ</h4>
            <ul className="space-y-3 text-sm">
              {['Vé nội địa', 'Vé quốc tế', 'Hoàn vé tự động', 'Hỗ trợ đại lý'].map(item => (
                <li key={item} className="hover:text-primary-400 transition-colors cursor-pointer flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-widest">Pháp lý</h4>
            <ul className="space-y-3 text-sm">
              {['Điều khoản', 'Bảo mật', 'Quy trình xử lý', 'Liên hệ'].map(item => (
                <li key={item} className="hover:text-primary-400 transition-colors cursor-pointer flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-medium">
            {config?.copyright || '© 2026 VIETNAM AEROLINE SUPPORT CENTER. All Rights Reserved.'}
          </p>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
               <ShieldCheck size={14} className="text-emerald-500" />
               Hệ thống đã mã hóa
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
               <HelpCircle size={14} className="text-primary-500" />
               Trung tâm hỗ trợ
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


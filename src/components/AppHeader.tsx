import React from 'react';
import { PhoneCall, Plane } from 'lucide-react';

interface AppHeaderProps {
  isAdmin: boolean;
  config: {
    supportPhone?: string;
    workingHours?: string;
  };
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isAdmin, config }) => {
  return (
    <header className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="container-premium py-2.5 sm:py-4 flex flex-row justify-between items-center">
        {/* Logo Section */}
        <div className="flex flex-col items-start group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-2">
            <div className="bg-primary-500 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-primary-500/20">
              <Plane className="text-white rotate-45" size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold tracking-tight flex items-baseline">
              <span className="text-primary-600">365</span>
              <span className="text-slate-400 text-base sm:text-lg ml-0.5">.vn</span>
            </h1>
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-primary-500 font-bold tracking-widest mt-0.5 uppercase opacity-80">
            HỆ THỐNG {isAdmin ? 'QUẢN TRỊ' : 'ĐẠI LÝ'} HÀNG KHÔNG
          </p>
        </div>
        
        {/* Support Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hỗ trợ 24/7</span>
            <span className="text-primary-600 font-display font-bold text-lg leading-none">
              {config.supportPhone || '1900 6091'}
            </span>
          </div>
          {/* On mobile, show phone number inline */}
          <a href={`tel:${config.supportPhone || '19006091'}`} className="sm:hidden flex items-center gap-1.5 text-primary-600 font-bold text-sm">
            <PhoneCall size={16} strokeWidth={2} />
            <span className="text-xs font-bold">{config.supportPhone || '1900 6091'}</span>
          </a>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary-50 items-center justify-center text-primary-600 shadow-sm border border-primary-100 transition-all hover:bg-primary-500 hover:text-white hover:scale-110 cursor-pointer">
             <PhoneCall size={20} strokeWidth={2} />
          </div>
        </div>
      </div>
    </header>
  );
};


import React from 'react';
import { PhoneCall } from 'lucide-react';

interface AppHeaderProps {
  isAdmin: boolean;
  config: {
    supportPhone: string;
    workingHours: string;
  };
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isAdmin, config }) => {
  return (
    <div className="container-safe py-3 flex flex-col sm:flex-row justify-between items-center bg-transparent relative z-10 gap-3 md:gap-0">
      <div className="flex flex-col items-center sm:items-start">
        <h1 className="text-3xl md:text-4xl font-black text-amber-500 italic tracking-tighter shadow-sm flex items-end">
          <span className="text-blue-900 text-4xl md:text-5xl">365</span><span className="text-sm font-bold text-gray-600 no-italic ml-1 mb-1">.vn</span>
        </h1>
        <p className="text-[10px] md:text-xs text-orange-600 font-bold sm:ml-1 mt-1 uppercase">
          HỆ THỐNG {isAdmin ? 'QUẢN TRỊ' : 'ĐẠI LÝ'} VÉ MÁY BAY
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-center sm:text-right">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-blue-100 flex items-center justify-center text-blue-800 shrink-0">
           <PhoneCall size={18} className="md:w-6 md:h-6" strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center sm:items-end">
          <div className="text-[12px] md:text-sm text-gray-600 font-bold flex flex-wrap justify-center sm:justify-end gap-1 items-center">
            <span>Tổng đài hỗ trợ:</span>
            <span className="text-lg md:text-xl font-black text-red-600 tracking-tight">
              {config?.supportPhone || '1900 6091'}
            </span>
          </div>
          <div className="text-[9px] md:text-[10px] text-gray-500 font-semibold bg-gray-200/50 px-2 py-0.5 mt-0.5 rounded italic">
            Giờ làm việc: {config?.workingHours || '0h - 24h'}
          </div>
        </div>
      </div>
    </div>
  );
};

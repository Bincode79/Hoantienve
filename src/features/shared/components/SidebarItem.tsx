import React from 'react';
import { cn } from '../../../utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  badge?: number;
}

export const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, badge }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group overflow-hidden relative border-l-4",
        active
          ? "bg-[#0A2A5E] text-amber-400 border-amber-500 shadow-inner font-black"
          : "text-blue-100 hover:bg-[#0d2e66] hover:text-white border-transparent"
      )}
    >
      <div className={cn(
        "transition-transform duration-300",
        active ? "scale-110" : "group-hover:scale-110"
      )}>
        <Icon size={20} />
      </div>
      
      {!collapsed && (
        <span className={cn(
          "font-bold text-sm tracking-tight whitespace-nowrap transition-all duration-300",
          active ? "opacity-100" : "opacity-80 group-hover:opacity-100"
        )}>
          {label}
        </span>
      )}

      {badge !== undefined && badge > 0 && (
        <div className={cn(
          "ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
          active ? "bg-amber-500 text-white" : "bg-white/20 text-white"
        )}>
          {badge}
        </div>
      )}
    </button>
  );
};

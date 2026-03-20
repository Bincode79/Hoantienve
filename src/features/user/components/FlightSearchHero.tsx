/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlaneTakeoff, PlaneLanding, Calendar, Users, ArrowRightLeft, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export const FlightSearchHero: React.FC = () => {
  const [tripType, setTripType] = useState<'round' | 'oneway'>('round');
  const [departure, setDeparture] = useState('Hồ Chí Minh (SGN)');
  const [destination, setDestination] = useState('Hà Nội (HAN)');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const handleSwap = () => {
    const temp = departure;
    setDeparture(destination);
    setDestination(temp);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-primary-900/10">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-[url('/airline-bg.png')] bg-cover bg-center"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/70 via-primary-900/40 to-primary-950/90"></div>

      <div className="relative z-10 p-6 md:p-8 lg:p-10 flex flex-col items-center justify-center min-h-[400px]">
        
        {/* Headline */}
        <div className="text-center mb-8 space-y-3">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight"
          >
            Tìm chuyến bay hoàn hảo
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-primary-100 font-medium md:text-lg"
          >
            Đặt vé máy bay giá rẻ, dễ dàng và nhanh chóng cùng hệ thống 365
          </motion.p>
        </div>

        {/* Search Box - Abay style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-5xl"
        >
          <Card className="p-2 md:p-4 bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
            
            {/* Trip Type Tabs */}
            <div className="flex items-center gap-6 mb-4 px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="tripType" 
                  checked={tripType === 'round'}
                  onChange={() => setTripType('round')}
                  className="w-4 h-4 text-accent-500 bg-gray-100 border-gray-300 focus:ring-accent-500 cursor-pointer" 
                />
                <span className={`text-sm font-bold transition-colors ${tripType === 'round' ? 'text-primary-900' : 'text-gray-500 group-hover:text-primary-700'}`}>
                  Khứ hồi
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="tripType" 
                  checked={tripType === 'oneway'}
                  onChange={() => setTripType('oneway')}
                  className="w-4 h-4 text-accent-500 bg-gray-100 border-gray-300 focus:ring-accent-500 cursor-pointer" 
                />
                <span className={`text-sm font-bold transition-colors ${tripType === 'oneway' ? 'text-primary-900' : 'text-gray-500 group-hover:text-primary-700'}`}>
                  Một chiều
                </span>
              </label>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3">
              
              {/* Location Input Group */}
              <div className="md:col-span-5 relative flex flex-col md:flex-row gap-2 md:gap-0">
                
                {/* Departure */}
                <div className="relative flex-1 group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors z-10">
                    <PlaneTakeoff size={20} />
                  </div>
                  <div className="absolute top-1.5 left-10 text-[10px] font-bold text-gray-500 uppercase z-10">Điểm đi</div>
                  <input
                    type="text"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="w-full h-16 pl-10 pt-5 pr-10 bg-gray-50 border border-gray-200 md:rounded-l-xl rounded-xl md:rounded-r-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-primary-950"
                  />
                </div>

                {/* Swap Button */}
                <button 
                  onClick={handleSwap}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-primary-600 hover:text-accent-500 hover:scale-110 transition-all rotate-90 md:rotate-0"
                >
                  <ArrowRightLeft size={16} />
                </button>

                {/* Destination */}
                <div className="relative flex-1 group mt-2 md:mt-0">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors z-10">
                    <PlaneLanding size={20} />
                  </div>
                  <div className="absolute top-1.5 left-10 text-[10px] font-bold text-gray-500 uppercase z-10">Điểm đến</div>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-16 pl-10 pt-5 pr-4 bg-gray-50 border border-gray-200 md:border-l-0 rounded-xl md:rounded-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-primary-950"
                  />
                </div>
              </div>

              {/* Date Inputs */}
              <div className="md:col-span-3 flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors z-10">
                    <Calendar size={18} />
                  </div>
                  <div className="absolute top-1.5 left-9 text-[10px] font-bold text-gray-500 uppercase z-10">Ngày đi</div>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    className="w-full h-16 pl-9 pt-5 pr-2 bg-gray-50 border border-gray-200 rounded-xl md:border-l-0 md:rounded-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-primary-950 text-sm"
                  />
                </div>
                {tripType === 'round' && (
                  <div className="relative flex-1 group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors z-10">
                      <Calendar size={18} />
                    </div>
                    <div className="absolute top-1.5 left-9 text-[10px] font-bold text-gray-500 uppercase z-10">Ngày về</div>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full h-16 pl-9 pt-5 pr-2 bg-gray-50 border border-gray-200 rounded-xl md:border-l-0 md:rounded-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-primary-950 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Passengers */}
              <div className="md:col-span-2 relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors z-10">
                  <Users size={18} />
                </div>
                <div className="absolute top-1.5 left-9 text-[10px] font-bold text-gray-500 uppercase z-10">Hành khách</div>
                <div className="w-full h-16 pl-9 pt-5 pr-3 bg-gray-50 border border-gray-200 rounded-xl md:border-l-0 md:rounded-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold text-primary-950 flex items-center cursor-pointer">
                  <span className="truncate">1 Người lớn</span>
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2">
                <Button 
                  className="w-full h-16 md:rounded-l-none md:rounded-r-xl rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-black text-base shadow-lg shadow-orange-500/30 border-0 flex items-center justify-center gap-2 transition-all hover:shadow-orange-500/50"
                  onClick={() => alert("Tính năng tìm chuyến bay đang được phát triển!")}
                >
                  <Search size={20} strokeWidth={3} />
                  <span>TÌM VÉ</span>
                </Button>
              </div>

            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

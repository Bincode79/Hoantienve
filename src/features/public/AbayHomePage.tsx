import React, { useState, useEffect } from 'react';
import { Plane, Clock, PhoneCall, RefreshCcw, LogIn, MonitorSmartphone, Calendar, Users, Home, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AbayHomePageProps {
  onLoginClick: () => void;
}

export const AbayHomePage: React.FC<AbayHomePageProps> = ({ onLoginClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white min-h-[100dvh] font-sans text-gray-800 antialiased selection:bg-orange-200">
      
      {/* Top Header */}
      <div className="w-full max-w-[1020px] mx-auto px-4 py-3 flex justify-between items-center bg-white shadow-sm relative z-10">
        <div className="flex flex-col">
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
          <button className="h-[42px] px-4 flex items-center justify-center bg-gradient-to-b from-blue-300 to-[#113C85] border-r border-[#1a4a9c]">
            <Home size={22} className="text-white" />
          </button>
          <nav className="flex-1 flex text-[13px] font-bold text-white uppercase overflow-hidden tracking-tight leading-none">
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Trang chủ</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Vé nội địa</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Vé quốc tế</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Vé theo hãng</a>
            <a href="#" onClick={e => e.preventDefault()} className="h-[42px] px-4 flex items-center hover:bg-[#0d2e66] transition-colors border-r border-[#1a4a9c] cursor-default">Tin khuyến mại</a>
            <button
               onClick={onLoginClick}
               className="h-[42px] px-5 flex items-center hover:bg-[#0d2e66] transition-colors border-x border-[#1a4a9c] ml-auto text-amber-300 group hover:text-amber-200 cursor-pointer"
            >
              <LogIn size={15} className="mr-1.5 group-hover:scale-110 transition-transform" /> ĐĂNG NHẬP HỆ THỐNG
            </button>
          </nav>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="w-full max-w-[1020px] mx-auto py-4 text-center border-b border-gray-100 flex items-center justify-center gap-3">
        <Clock size={28} className="text-gray-600 outline-dotted outline-2 outline-offset-4 outline-orange-400 rounded-full" />
        <div className="text-left">
          <div className="text-red-500 font-bold text-[15px]">
            Bây giờ là {format(currentTime, 'HH:mm')}, nhân viên 365 sẵn sàng phục vụ quý khách
          </div>
          <div className="text-gray-600 text-[13px] mt-0.5">
            Quý khách cần đặt vé máy bay hoặc tư vấn hoàn tiền, vui lòng gọi tổng đài <span className="font-bold text-red-500">1900 6091</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[900px] mx-auto mt-4 flex flex-col md:flex-row gap-5 px-4 md:px-0">
        
        {/* Left Column: Search Box */}
        <div className="w-full md:w-[420px] flex flex-col gap-4">
          <div className="rounded-t-md overflow-hidden bg-[#0A58A3] shadow-lg border border-[#06427D]">
            <div className="bg-[#06427D] py-2.5 px-4 flex items-center gap-2 border-b border-[#0A73D1]">
              <Plane className="text-white fill-white transform rotate-45" size={20} />
              <h2 className="text-white font-bold text-[15px] uppercase font-sans tracking-wide">VÉ MÁY BAY GIÁ RẺ</h2>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              {/* Trip Type */}
              <div className="flex items-center gap-6 text-white text-[13px] font-bold mb-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="abayTrip" defaultChecked className="w-4 h-4 text-orange-500 bg-white" /> Khứ hồi
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="abayTrip" className="w-4 h-4 text-orange-500 bg-white" /> Một chiều
                </label>
              </div>

              {/* Locations */}
              <div className="flex items-end gap-1 relative">
                <div className="flex-1">
                  <label className="text-white text-[12px] block mb-1 font-semibold">Điểm đi</label>
                  <div className="relative">
                    <input type="text" defaultValue="Tp Hồ Chí Minh" className="w-full h-8 px-2 text-[14px] text-black border border-gray-300 rounded-sm bg-white font-bold" />
                    <Plane size={14} className="absolute right-2 top-2 text-gray-400 rotate-45" />
                  </div>
                </div>
                
                <button className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm mb-0">
                  <RefreshCcw size={14} className="text-gray-600" />
                </button>
                
                <div className="flex-1">
                  <label className="text-white text-[12px] block mb-1 font-semibold relative text-right">Điểm đến <Plane size={14} className="inline absolute left-0 bottom-0 rotate-135 text-white opacity-50" /></label>
                  <div className="relative">
                    <input type="text" defaultValue="Hà Nội" className="w-full h-8 px-2 text-[14px] text-black border border-gray-300 rounded-sm bg-white font-bold" />
                    <MapPin size={14} className="absolute right-2 top-2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-white text-[12px] block mb-1 font-semibold">Ngày đi</label>
                  <div className="relative">
                    <input type="text" defaultValue={format(new Date(), 'dd/MM/yyyy')} className="w-full h-8 px-2 pr-8 text-[13px] text-black border border-gray-300 rounded-sm bg-white font-semibold" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-[#f5f5f5] border-l border-gray-300 flex items-center justify-center pointer-events-none">
                      <Calendar size={14} className="text-blue-700" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-white text-[12px] block mb-1 font-semibold text-right">Ngày về</label>
                  <div className="relative">
                    <input type="text" placeholder="dd/mm/yyyy" className="w-full h-8 px-2 pr-8 text-[13px] text-black border border-gray-300 rounded-sm bg-white font-semibold" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-[#f5f5f5] border-l border-gray-300 flex items-center justify-center pointer-events-none">
                      <Calendar size={14} className="text-blue-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div className="flex gap-2 mt-1">
                <div className="flex-1 flex items-center justify-between bg-transparent">
                  <label className="text-white text-[12px] font-semibold w-16">Người lớn</label>
                  <select className="w-14 h-7 text-[12px] font-bold border border-gray-300 rounded-sm">
                    <option>1</option><option>2</option><option>3</option>
                  </select>
                  <span className="text-[10px] text-white brightness-75 ml-1 leading-tight flex-1">(từ 12 tuổi)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center justify-between bg-transparent">
                  <label className="text-white text-[12px] font-semibold w-16">Trẻ em</label>
                  <select className="w-14 h-7 text-[12px] font-bold border border-gray-300 rounded-sm">
                    <option>0</option><option>1</option><option>2</option>
                  </select>
                  <span className="text-[10px] text-white brightness-75 ml-1 leading-tight flex-1">(2 - 12 tuổi)</span>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 flex items-center justify-between bg-transparent">
                  <label className="text-white text-[12px] font-semibold w-16">Em bé</label>
                  <select className="w-14 h-7 text-[12px] font-bold border border-gray-300 rounded-sm">
                    <option>0</option><option>1</option>
                  </select>
                  <span className="text-[10px] text-white brightness-75 ml-1 leading-tight flex-1">(dưới 2 t.)</span>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-center justify-between mt-1">
                <a href="#" onClick={e=>e.preventDefault()} className="hidden text-[11px] text-white underline hover:text-orange-300 bg-red-600 px-2 py-0.5 rounded cursor-default">Xem video</a>
                <button type="button" onClick={e=>e.preventDefault()} className="flex-1 h-11 bg-gradient-to-b from-[#FF8800] to-[#E55A00] hover:from-[#FFAA00] hover:to-[#FF6600] text-white font-black text-[15px] rounded flex items-center justify-center gap-2 border border-[#C24D00] shadow-md uppercase tracking-wide cursor-pointer transition-colors w-full active:scale-[0.98]">
                  <Search size={18} strokeWidth={3} className="pt-0.5" />
                  <span>Tìm chuyến bay</span>
                </button>
              </div>
            </div>
          </div>
          
          <img src="/airline-bg.png" alt="Ads" className="w-full h-auto mt-2 cursor-pointer shadow-sm border border-gray-200" onClick={onLoginClick}/>
        </div>

        {/* Right Column: Banners & Promos */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Main Huge Banner */}
          <div className="w-full h-[220px] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-md relative overflow-hidden shadow-md flex items-center p-6 border border-blue-200">
            <div className="absolute inset-0 bg-[url('/airline-bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col gap-2 w-1/2">
              <h3 className="text-white md:text-[28px] text-2xl font-black italic tracking-tight drop-shadow-md leading-[1.1]">TÌM VÉ MÁY BAY<br/>RẺ NHẤT MỖI NGÀY</h3>
              <p className="text-yellow-200 font-bold text-[13px] drop-shadow border-t border-white/20 pt-2 mt-1">Đặt vé máy bay rẻ, uy tín với sự hỗ trợ chuyên nghiệp nhất.</p>
              <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-black text-[13px] uppercase tracking-wider px-6 py-2.5 rounded-full w-max shadow-xl shadow-orange-500/30 mt-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-orange-400" onClick={onLoginClick}>Quản lý hoàn vé <Plane size={15} className="mb-0.5" strokeWidth={2.5} /></button>
            </div>
            <div className="absolute right-4 bottom-0 w-[45%] h-[110%] bg-contain bg-no-repeat bg-bottom z-10">
               {/* Phone mockup */}
               <div className="w-full h-full relative">
                 <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-48 h-[280px] bg-white rounded-3xl border-4 border-gray-800 shadow-2xl flex flex-col overflow-hidden rotate-[-10deg]">
                    <div className="w-full h-10 bg-blue-600 flex items-center justify-center text-white text-xs font-bold">App Đặt Vé</div>
                    <div className="flex-1 bg-gray-50 p-2 text-center text-[10px] space-y-2">
                       <div className="w-full p-2 bg-white rounded shadow-sm text-left"><span className="font-bold">SGN ✈ HAN</span><br/><span className="text-orange-500 font-bold">790,000 đ</span></div>
                       <div className="w-full p-2 bg-white rounded shadow-sm text-left"><span className="font-bold">HAN ✈ DAD</span><br/><span className="text-orange-500 font-bold">390,000 đ</span></div>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Recent Flights Table */}
          <div className="mt-2 border-t border-gray-200 pt-3 flex-1">
            <h3 className="text-blue-900 font-bold text-[15px] uppercase mb-3 flex items-center gap-2">
              Vé máy bay giá rẻ khách đặt mới nhất
            </h3>
            <table className="w-full text-[13px] text-gray-700">
              <tbody>
                {[
                  { route: 'Hà Nội - Đà Nẵng', date: '04/05', price: '89,000', airline: 'Bamboo Airways', booked: '12 phút trước' },
                  { route: 'TP Hồ Chí Minh - Hà Nội', date: '21/04', price: '748,000', airline: 'Vietnam Airlines', booked: '5 phút trước' },
                  { route: 'Hà Nội - Nha Trang', date: '12/06', price: '190,000', airline: 'VietjetAir', booked: '24 phút trước' },
                  { route: 'Đà Nẵng - TP Hồ Chí Minh', date: '01/05', price: '379,000', airline: 'Vietravel Airlines', booked: '42 phút trước' },
                  { route: 'TP Hồ Chí Minh - Phú Quốc', date: '18/05', price: '99,000', airline: 'VietjetAir', booked: '1 giờ trước' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 flex items-center gap-2 py-2.5">
                    <td className="w-6 hidden sm:flex justify-center"><Plane size={14} className="text-gray-400 rotate-45" /></td>
                    <td className="w-[180px]">
                      <div className="font-bold text-black">{row.route}</div>
                      <div className="text-[11px] text-gray-500 italic">Khách đặt vé khởi hành {row.date}</div>
                    </td>
                    <td className="flex-1 text-right">
                      <span className="text-orange-600 font-bold text-[15px] tabular-nums">{row.price}&nbsp;<span className="text-[14px]">đ</span></span>
                      <a href="#" onClick={e=>e.preventDefault()} className="block text-[11px] text-blue-600 hover:text-blue-800 underline leading-tight cursor-default">Chi tiết</a>
                    </td>
                    <td className="w-[130px] flex gap-2 items-center justify-end pl-2">
                      <span className="text-[10px] text-gray-400 px-1 bg-gray-100 rounded">{row.airline}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-red-600 font-semibold mt-2 italic">* Giá cơ bản cho 1 người chưa bao gồm thuế phí</div>
          </div>

        </div>
      </div>
      
      {/* Testimonials & FAQs Section */}
      <div className="w-full max-w-[1020px] mx-auto mt-2 flex flex-col md:flex-row gap-5 px-4 md:px-0 mb-8 border-t border-gray-100 pt-6">
        {/* Testimonials */}
        <div className="flex-1 bg-[#FFF9E6] p-5 rounded-sm border border-[#F2E5B5] relative shadow-sm">
          <h3 className="text-[#0B3882] text-[18px] font-black tracking-tight mb-4">Khách hàng nói về chúng tôi</h3>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-2xl text-amber-500 bg-amber-100 mt-1 flex-shrink-0 shadow-sm border border-amber-200">"</div>
              <p className="text-[12px] text-gray-700 leading-relaxed italic border-b border-amber-200/50 pb-3">Mình đã đặt vé trên website này đi nước ngoài, rất hài lòng với cách làm việc của các bạn, chắc chắn mình sẽ sử dụng dịch vụ này vào các lần sau... <br/><span className="text-gray-400 mt-1 block font-semibold not-italic">- Phạm Thúy Quỳnh - 098581XXXX</span></p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-2xl text-amber-500 bg-amber-100 mt-1 flex-shrink-0 shadow-sm border border-amber-200">"</div>
              <p className="text-[12px] text-gray-700 leading-relaxed italic border-b border-amber-200/50 pb-3">Tôi thích trang web này cung cấp nhiều thông tin bổ ích trong việc lựa chọn chuyến bay giá tốt và thông báo vô cùng kịp thời... <br/><span className="text-gray-400 mt-1 block font-semibold not-italic">- Phạm Hoàng Anh - 093551XXXX</span></p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-2xl text-amber-500 bg-amber-100 mt-1 flex-shrink-0 shadow-sm border border-amber-200">"</div>
              <p className="text-[12px] text-gray-700 leading-relaxed italic border-b border-amber-200/50 pb-3">Đây là lần đầu tiên mình đặt vé máy bay trực tuyến. Đây là hình thức đặt vé thanh toán cực kì thuận tiện và nhanh chóng... <br/><span className="text-gray-400 mt-1 block font-semibold not-italic">- Phạm Văn Sắc - 097792XXXX</span></p>
            </div>
          </div>
          <div className="text-right mt-3">
             <button className="bg-orange-500 text-white font-bold text-[11px] px-3 py-1 rounded shadow-sm hover:bg-orange-600 outline-none cursor-default active:scale-95 transition-transform">Xem thêm</button>
          </div>
        </div>

        {/* FAQs */}
        <div className="flex-1 bg-white p-5 rounded-sm border border-gray-200 relative shadow-sm">
          <div className="absolute top-0 right-6 w-8 h-10 bg-red-600 before:content-[''] before:absolute before:bottom-[-24px] before:left-0 before:border-l-[16px] before:border-r-[16px] before:border-t-[24px] before:border-transparent before:border-t-red-600 after:content-['*'] after:absolute after:text-white after:font-black after:text-2xl after:top-1 after:left-1/2 after:-translate-x-1/2"></div>
          <h3 className="text-[#0B3882] text-[18px] font-black tracking-tight mb-4">Câu hỏi thường gặp</h3>
          <ul className="text-[12px] text-gray-700 space-y-2.5">
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Phụ nữ mang thai đi máy bay cần lưu ý những gì?</li>
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Khi đi máy bay tôi có được mang theo nước mắm không?</li>
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Đi máy bay cần mang theo những loại giấy tờ gì?</li>
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Làm thế nào để đổi ngày bay và giờ bay thì làm như thế nào?</li>
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Tại sao 365 là website bán vé máy bay rẻ nhất?</li>
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Em bé bao nhiêu tuổi thì được đi máy bay? Và cần giấy tờ gì?</li>
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Bị mất căn cước công dân (CCCD) thì check-in được không?</li>
            <li className="flex gap-2 hover:text-blue-600 cursor-default"><span className="text-gray-400 font-bold">»</span> Tôi cần có mặt ở sân bay bao lâu để làm thủ tục bay?</li>
          </ul>
          <div className="text-right mt-4">
             <a href="#" onClick={e=>e.preventDefault()} className="text-blue-600 text-[11px] font-bold italic hover:underline cursor-default">Xem chi tiết »</a>
          </div>
        </div>
      </div>

      {/* Dark Blue Wide Footer */}
      <div className="w-full bg-[#113C85] border-t-4 border-[#FFAA00] py-10 mt-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/airline-bg.png')] bg-cover bg-center mix-blend-overlay opacity-10"></div>
        <div className="w-full max-w-[1020px] mx-auto px-4 md:px-0 relative z-10">
          {/* Footer Grid */}
          <div className="flex flex-col md:flex-row justify-between mb-8 pb-8 border-b border-[#2151A1]/60">
            <div className="text-white text-[12px] space-y-2.5">
               <h4 className="text-[#FF8800] font-black text-[13px] uppercase mb-4 flex items-center gap-1.5 drop-shadow"><Plane size={14} className="rotate-45" /> BẠN CÒN THẮC MẮC</h4>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Liên hệ</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Hướng dẫn thanh toán</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Hướng dẫn đặt vé</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Câu hỏi thường gặp</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Chăm sóc khách hàng</p>
            </div>
            <div className="text-white text-[12px] space-y-2.5 mt-8 md:mt-0">
               <h4 className="text-[#FF8800] font-black text-[13px] uppercase mb-4 flex items-center gap-1.5 drop-shadow"><Plane size={14} className="rotate-45" /> VỀ CHÚNG TÔI</h4>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Giới thiệu</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Các đơn vị hợp tác</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Cấu trúc trang web</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Điều khoản sử dụng</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Chính sách bảo mật</p>
            </div>
            <div className="text-white text-[12px] space-y-2.5 mt-8 md:mt-0">
               <h4 className="text-[#FF8800] font-black text-[13px] uppercase mb-4 flex items-center gap-1.5 drop-shadow"><Plane size={14} className="rotate-45" /> QUẢN LÝ ĐẶT HÀNG</h4>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Xem đơn hàng</p>
               <p className="hover:text-amber-200 cursor-default flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><span className="w-1 h-1 rounded-full bg-white opacity-50"></span> Thanh toán trực tuyến</p>
            </div>
            <div className="flex flex-col items-end gap-3 mt-8 md:mt-0">
               <div className="flex gap-2">
                 <div className="w-7 h-7 bg-[#3b5998] rounded-sm text-white font-black text-lg flex items-center justify-center cursor-default shadow">f</div>
                 <div className="w-7 h-7 bg-[#00aced] rounded-sm text-white font-black text-lg flex items-center justify-center cursor-default shadow">t</div>
               </div>
               <div className="bg-white rounded p-1 mt-6 shadow-xl">
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
          
          {/* Address Block */}
          <div className="flex flex-col md:flex-row gap-8 text-white">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-[100px] h-[70px] bg-white rounded overflow-hidden flex-shrink-0 border-2 border-white shadow-lg flex items-center justify-center">
                <svg viewBox="0 0 100 70" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="70" fill="#0A58A3"/>
                  <text x="50" y="25" textAnchor="middle" fill="#FFD700" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.5">VIETNAM</text>
                  <text x="50" y="40" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">AIRLINES</text>
                  <polygon points="50,47 43,58 57,58" fill="#FFD700"/>
                  <line x1="20" y1="62" x2="80" y2="62" stroke="#FFD700" strokeWidth="2"/>
                </svg>
              </div>
              <div className="text-[11px] leading-relaxed opacity-90">
                <div className="font-bold text-[13px] mb-1.5 tracking-wide uppercase">VÉ MÁY BAY TẠI TP HỒ CHÍ MINH</div>
                <div>Lầu 2, Tòa nhà hành chính, Quận 1, Tp. Hồ Chí Minh</div>
                <div>Website: www.hoantienve.com - Email: contact@hoantienve.com</div>
                <div>Tel: (+028) 1900 6091 - Fax: (+028) 38 48 7160</div>
              </div>
            </div>
            <div className="flex items-start gap-4 flex-1 mt-6 md:mt-0">
              <div className="w-[100px] h-[70px] bg-white rounded overflow-hidden flex-shrink-0 border-2 border-white shadow-lg flex items-center justify-center">
                <svg viewBox="0 0 100 70" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="70" fill="#0A58A3"/>
                  <text x="50" y="25" textAnchor="middle" fill="#FFD700" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.5">VIETNAM</text>
                  <text x="50" y="40" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">AIRLINES</text>
                  <polygon points="50,47 43,58 57,58" fill="#FFD700"/>
                  <line x1="20" y1="62" x2="80" y2="62" stroke="#FFD700" strokeWidth="2"/>
                </svg>
              </div>
              <div className="text-[11px] leading-relaxed opacity-90">
                <div className="font-bold text-[13px] mb-1.5 tracking-wide uppercase">VÉ MÁY BAY TẠI HÀ NỘI</div>
                <div>Tầng 5, Trung tâm điều hành, Quận Đống Đa, Hà Nội</div>
                <div>Website: www.hoantienve.com - Email: contact@hoantienve.com</div>
                <div>Tel: (+024) 1900 6091 - Fax: (+024) 35 33 5403</div>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-right text-[10px] text-blue-200 mt-10 leading-relaxed max-w-sm ml-auto opacity-70">
            Công ty TNHH vé máy bay trực tuyến 365<br/>
            Số ĐKKD 01xxxxxxx - Mã số thuế: 0105xxxxxx<br/>
            © 2026 Copyright. All Rights Reserved.
          </div>
        </div>
      </div>
      
    </div>
  );
};

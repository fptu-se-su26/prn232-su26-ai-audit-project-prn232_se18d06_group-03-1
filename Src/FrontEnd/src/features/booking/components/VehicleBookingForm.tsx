import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  PenLine, 
  CreditCard,
  Settings,
  Info,
  Car
} from 'lucide-react';

export const VehicleBookingForm: React.FC = () => {
  const [insurance, setInsurance] = useState(false);
  const [extraHelmet, setExtraHelmet] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#e2dee4] to-[#c7cce4] p-6 sm:p-10 flex justify-center items-center font-sans text-slate-800">
      <div className="max-w-[1200px] w-full flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Vehicle Info */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4">
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 flex flex-col items-center h-full">
            <img 
              src="https://cdn.honda.com.vn/motorbikes/September2022/vK6wM3yM0k9tE1NItV9t.png" 
              alt="Honda SH 125i" 
              className="w-full h-auto object-contain mb-6 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
            
            <div className="bg-white rounded-2xl p-5 w-full mb-4 shadow-sm border border-white/60">
              <h3 className="text-[15px] font-semibold mb-4 text-slate-800">Specifications</h3>
              <div className="flex justify-between text-center px-1">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-slate-600">
                    <Settings className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[13px] text-slate-600 font-medium">125cc</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-slate-600">
                    <Car className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[13px] text-slate-600 font-medium">Automatic</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-slate-600">
                    <Info className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[13px] text-slate-600 font-medium leading-tight">Underseat<br/>Storage</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 w-full flex items-center gap-4 shadow-sm border border-white/60">
              <div className="w-12 h-12 rounded-xl bg-[#fef3d9] flex items-center justify-center text-[#d99c35] font-bold text-xl shrink-0 shadow-inner">
                €
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">price</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-800">173.145đ</span>
                  <span className="text-[13px] font-medium text-slate-500">/ ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Booking Form */}
        <div className="flex-1 flex flex-col gap-6 lg:pl-4">
          <div className="mb-2">
            <h1 className="text-[28px] font-semibold text-slate-800 mb-1 tracking-tight">Đặt xe</h1>
            <p className="text-[15px] text-slate-600">Điền thông tin để gửi yêu cầu thuê xe.</p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Time */}
            <div>
              <p className="text-[14px] font-semibold mb-2 text-slate-800">Thời gian thuê</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white rounded-2xl p-3.5 px-4 shadow-sm border border-white/50 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                  <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Nhận xe</label>
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="dd/mm/yyyy --:--" className="bg-transparent text-[14px] w-full outline-none text-slate-700 placeholder:text-slate-400" />
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-3.5 px-4 shadow-sm border border-white/50 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                  <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Trả xe</label>
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="dd/mm/yyyy --:--" className="bg-transparent text-[14px] w-full outline-none text-slate-700 placeholder:text-slate-400" />
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-[14px] font-semibold mb-2 text-slate-800 block">Địa chỉ nhận xe</label>
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-white/50 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="text" placeholder="Nhập địa chỉ" className="bg-transparent text-[14px] w-full outline-none text-slate-700 placeholder:text-slate-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[14px] font-semibold mb-2 text-slate-800 flex items-center gap-2">
                  Địa chỉ trả xe (tuỳ chọn) 
                  <span className="text-[11px] bg-[#fdf2d2] text-[#c99527] px-2 py-0.5 rounded-md font-medium">Tùy chọn</span>
                </label>
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-white/50 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="text" placeholder="Nhập địa chỉ trả xe" className="bg-transparent text-[14px] w-full outline-none text-slate-700 placeholder:text-slate-400" />
                </div>
              </div>
            </div>

            {/* Row 3: Promo & Note */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Left Side */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="text-[14px] font-semibold mb-2 text-slate-800 block">Mã giảm giá (tuỳ chọn)</label>
                  <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-white/50 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                    <input type="text" placeholder="Nhập mã" className="bg-transparent text-[14px] w-full outline-none text-slate-700 placeholder:text-slate-400" />
                  </div>
                </div>

                {/* Service Options */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-white/50">
                  <label className="text-[15px] font-semibold mb-4 text-slate-800 block">Tùy chọn dịch vụ</label>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[14px] text-slate-700 font-medium">Bảo hiểm</span>
                    <button 
                      onClick={() => setInsurance(!insurance)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${insurance ? 'bg-[#7a3767]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${insurance ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-slate-700 font-medium">Mũ bảo hiểm phụ</span>
                    <button 
                      onClick={() => setExtraHelmet(!extraHelmet)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${extraHelmet ? 'bg-[#7a3767]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${extraHelmet ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex-1 flex flex-col h-full">
                <label className="text-[14px] font-semibold mb-2 text-slate-800 block">Ghi chú (tuỳ chọn)</label>
                <div className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm border border-white/50 h-full min-h-[150px] focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                  <PenLine className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <textarea 
                    placeholder="Thêm ghi chú..."
                    className="bg-transparent text-[14px] w-full outline-none resize-none h-full text-slate-700 placeholder:text-slate-400" 
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cost Summary */}
        <div className="w-full lg:w-[280px] flex flex-col gap-4 lg:pt-16">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/60">
            <h3 className="font-bold text-[15px] mb-5 text-slate-800">Tóm tắt chi phí</h3>
            
            <div className="space-y-4 mb-6 border-b border-slate-100 pb-5">
              <div className="flex justify-between text-[14px]">
                <span className="text-slate-600 leading-snug">Xe Honda SH 125i<br/>(3 ngày)</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-slate-600">Phụ phí (nếu có)</span>
              </div>
            </div>

            <div className="flex justify-between items-center font-bold">
              <span className="text-[14px] text-slate-800">Tổng cộng</span>
              <span className="text-[#641d4c] text-[22px] font-bold">173.145đ</span>
            </div>
          </div>

          <button className="bg-[#6b215a] hover:bg-[#5a1b4b] active:scale-[0.98] text-white rounded-2xl py-4 px-4 flex items-center justify-center gap-3 w-full font-medium transition-all shadow-md group mt-2 lg:mt-auto">
            <span className="text-[15px]">Hoàn tất đặt xe và thanh toán</span>
            <CreditCard className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};

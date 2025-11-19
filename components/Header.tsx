import React, { useState, useEffect } from 'react';
import { Bell, User, Clock, Wallet } from 'lucide-react';
import { fetchDeepSeekBalance } from '../services/geminiService';

const Header: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    // Fetch balance on mount
    const loadBalance = async () => {
        const bal = await fetchDeepSeekBalance();
        setBalance(bal);
    };
    loadBalance();

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai'
    }).format(date);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm/50">
      {/* Left: Beijing Time */}
      <div className="flex items-center space-x-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
        <Clock className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium font-mono tracking-wide text-slate-700">
          北京时间 {formatTime(time)}
        </span>
      </div>
      
      {/* Right: Balance, Bell, User */}
      <div className="flex items-center space-x-5">
        
        {/* DeepSeek Balance */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-sm hover:bg-indigo-100 transition-colors cursor-help" title="API 余额状态">
            <Wallet className="w-4 h-4" />
            <span className="font-medium">DeepSeek 余额: 
                <span className={`font-mono font-bold ml-1 ${balance === null ? 'animate-pulse' : ''}`}>
                    {balance || '--'}
                </span>
            </span>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md shadow-blue-200 cursor-pointer hover:shadow-lg transition-shadow hover:scale-105 transform duration-200">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
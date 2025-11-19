
import React from 'react';
import { LayoutDashboard, Newspaper, TrendingUp, PieChart, Activity, BarChart2 } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  
  const navItems = [
    { id: ViewState.NEWS, label: '新闻情报收集', icon: Newspaper },
    { id: ViewState.MARKET, label: '市场行情分析', icon: LayoutDashboard },
    { id: ViewState.STOCK, label: '个股分析预测', icon: TrendingUp },
    { id: ViewState.PORTFOLIO, label: '持仓盈亏分析', icon: PieChart },
    { id: ViewState.SECTOR, label: '行业轮动预测', icon: Activity },
  ];

  const hasApiKey = !!process.env.API_KEY;

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col fixed left-0 top-0 z-10 shadow-xl text-white transition-all duration-300">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg">
          <BarChart2 className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">FinSight AI</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-3">
          
          {/* Model Status */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400 uppercase">AI 模型状态</p>
            <div className="flex items-center space-x-1.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${hasApiKey ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
              <span className={`text-xs font-medium ${hasApiKey ? 'text-blue-400' : 'text-amber-400'}`}>
                {hasApiKey ? '在线' : '本地演示'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
             {hasApiKey ? 'DeepSeek-V3 已连接' : '未检测到 API Key'}
          </p>

          {/* Docker Status (Simulated UI) */}
           <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400 uppercase">数据引擎</p>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-emerald-400 font-medium">Docker</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sidebar;
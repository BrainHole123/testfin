
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import MarketOverview from './components/MarketOverview';
import StockAnalyzer from './components/StockAnalyzer';
import PortfolioAnalysis from './components/PortfolioAnalysis';
import SectorRotation from './components/SectorRotation';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.NEWS);

  const renderContent = () => {
    switch (currentView) {
      case ViewState.NEWS:
        return <NewsFeed />;
      case ViewState.MARKET:
        return <MarketOverview />;
      case ViewState.STOCK:
        return <StockAnalyzer />;
      case ViewState.PORTFOLIO:
        return <PortfolioAnalysis />;
      case ViewState.SECTOR:
        return <SectorRotation />;
      default:
        return <NewsFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
           {/* Animated transition wrapper could go here */}
           {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
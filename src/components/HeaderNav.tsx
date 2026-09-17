import React from 'react';
import { NavigationTab, CryptoAsset } from '../types';
import { formatCurrency, formatPercentage } from '../utils/cryptoUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PlusCircle, 
  RefreshCw, 
  Layers, 
  BarChart3, 
  ArrowLeftRight, 
  Coins, 
  History, 
  Zap,
  ShieldCheck,
  Flame
} from 'lucide-react';

interface HeaderNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  cashBalance: number;
  totalPortfolioValue: number;
  dayGainDollar: number;
  dayGainPercent: number;
  assets: CryptoAsset[];
  onOpenDeposit: () => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onResetDemo: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onTabChange,
  cashBalance,
  totalPortfolioValue,
  dayGainDollar,
  dayGainPercent,
  assets,
  onOpenDeposit,
  isSimulating,
  onToggleSimulate,
  onResetDemo,
}) => {
  const topMovers = [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 6);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Live Ticker Tape */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-6 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider shrink-0">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-emerald-400' : 'bg-slate-500'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="text-[11px]">Live Market Feed</span>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          {topMovers.map((asset) => {
            const isPos = asset.change24h >= 0;
            return (
              <div key={asset.id} className="flex items-center gap-2 shrink-0 group cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-slate-200">{asset.symbol}</span>
                <span className="text-slate-300 font-mono">{formatCurrency(asset.price)}</span>
                <span className={`flex items-center text-[11px] font-medium ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {formatPercentage(asset.change24h)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="ml-auto shrink-0 flex items-center gap-3 pl-4 border-l border-slate-800">
          <button
            onClick={onToggleSimulate}
            title="Toggle live price oscillation engine"
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors ${
              isSimulating ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Zap className={`w-3 h-3 ${isSimulating ? 'text-emerald-400 fill-emerald-400' : ''}`} />
            <span>{isSimulating ? 'Live Ticker ON' : 'Ticker Paused'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                APEX<span className="text-indigo-400">CRYPTO</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Institutional Crypto Investment Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('markets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'markets'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Markets</span>
          </button>

          <button
            onClick={() => onTabChange('trade')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'trade'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Trade & Swap</span>
          </button>

          <button
            onClick={() => onTabChange('earn')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'earn'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Yield & Staking</span>
          </button>

          <button
            onClick={() => onTabChange('bundles')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'bundles'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Index Bundles</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>
        </nav>

        {/* Right Side: Portfolio Summary Pill + Deposit CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end pr-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Net Worth</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white font-mono">{formatCurrency(totalPortfolioValue)}</span>
              <span className={`text-[11px] font-semibold flex items-center ${dayGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dayGainPercent >= 0 ? '+' : ''}{dayGainPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Deposit Funds</span>
            </button>

            <button
              onClick={onResetDemo}
              title="Reset to default initial demo portfolio"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

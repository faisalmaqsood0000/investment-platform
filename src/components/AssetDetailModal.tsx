import React from 'react';
import { CryptoAsset } from '../types';
import { formatCurrency, formatCompactNumber, formatPercentage } from '../utils/cryptoUtils';
import { TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Zap, Coins, Globe, ExternalLink } from 'lucide-react';

interface AssetDetailModalProps {
  asset: CryptoAsset | null;
  onClose: () => void;
  onTradeAsset: (assetId: string) => void;
  onStakeAsset: (assetId: string) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onTradeAsset,
  onStakeAsset,
}) => {
  if (!asset) return null;

  const isPositive = asset.change24h >= 0;

  // Sparkline calculation
  const sparkMin = Math.min(...asset.sparkline);
  const sparkMax = Math.max(...asset.sparkline);
  const sparkRange = sparkMax - sparkMin || 1;
  const svgWidth = 400;
  const svgHeight = 120;

  const sparkPoints = asset.sparkline
    .map((val, idx) => {
      const x = (idx / (asset.sparkline.length - 1)) * svgWidth;
      const y = svgHeight - ((val - sparkMin) / sparkRange) * (svgHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base border ${asset.iconBg}`}>
              {asset.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">{asset.name}</h3>
                <span className="text-xs font-mono font-bold text-slate-400">({asset.symbol})</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                  {asset.category}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-white font-mono">{formatCurrency(asset.price)}</span>
                <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded text-xs ${
                  isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  {formatPercentage(asset.change24h)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* 7-Day Performance Chart */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">7-Day Technical Trend</span>
            <span className="font-mono text-[11px] text-slate-500">Low: {formatCurrency(sparkMin)} | High: {formatCurrency(sparkMax)}</span>
          </div>

          <div className="w-full h-28">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke={isPositive ? '#10B981' : '#F43F5E'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparkPoints}
              />
            </svg>
          </div>
        </div>

        {/* Key Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Market Cap</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatCompactNumber(asset.marketCap)}</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">24h Volume</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">{formatCompactNumber(asset.volume24h)}</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Circulating Supply</span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block">{asset.circulatingSupply}</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">24h Range</span>
            <span className="text-xs font-bold text-slate-200 font-mono mt-0.5 block">
              {formatCurrency(asset.low24h)} - {formatCurrency(asset.high24h)}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">All-Time High</span>
            <span className="text-xs font-bold text-slate-200 font-mono mt-0.5 block">{formatCurrency(asset.allTimeHigh)}</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Staking APY</span>
            <span className="text-xs font-bold text-purple-400 font-mono mt-0.5 block">
              {asset.stakingApy ? `${asset.stakingApy}% APY` : 'Not Available'}
            </span>
          </div>
        </div>

        {/* Project Description */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">About {asset.name}</h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            {asset.description}
          </p>
        </div>

        {/* Modal CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onTradeAsset(asset.id);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Trade {asset.symbol} Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {asset.stakingApy && (
            <button
              onClick={() => {
                onStakeAsset(asset.id);
                onClose();
              }}
              className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Stake ({asset.stakingApy}%)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

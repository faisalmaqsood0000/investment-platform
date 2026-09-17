import React, { useState, useMemo } from 'react';
import { CryptoAsset, PortfolioState, Timeframe, NavigationTab, UserHolding } from '../types';
import { formatCurrency, formatCryptoAmount, formatPercentage } from '../utils/cryptoUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  Sparkles, 
  DollarSign, 
  Percent, 
  ChevronRight, 
  PieChart,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  portfolio: PortfolioState;
  assets: CryptoAsset[];
  metrics: {
    cashBalance: number;
    holdingsValue: number;
    stakedValue: number;
    pendingRewardsUsd: number;
    totalValue: number;
    dayGainDollar: number;
    dayGainPercent: number;
    allTimeProfitDollar: number;
    allTimeProfitPercent: number;
  };
  onNavigate: (tab: NavigationTab) => void;
  onSelectAssetForTrade: (assetId: string, action?: 'buy' | 'sell') => void;
  onOpenDeposit: () => void;
  onOpenSend: (assetId?: string) => void;
  onOpenAssetDetail: (asset: CryptoAsset) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  portfolio,
  assets,
  metrics,
  onNavigate,
  onSelectAssetForTrade,
  onOpenDeposit,
  onOpenSend,
  onOpenAssetDetail,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const assetMap = useMemo(() => new Map<string, CryptoAsset>(assets.map((a) => [a.id, a])), [assets]);

  // Generate synthetic chart data based on current total value and timeframe
  const chartData = useMemo(() => {
    const pointsCount = timeframe === '1D' ? 24 : timeframe === '1W' ? 14 : timeframe === '1M' ? 30 : 36;
    const baseValue = metrics.totalValue;
    const variance = timeframe === '1D' ? 0.03 : timeframe === '1W' ? 0.08 : timeframe === '1M' ? 0.16 : 0.35;
    
    const points: { label: string; value: number }[] = [];
    const now = Date.now();
    const interval = timeframe === '1D' ? 3600000 : timeframe === '1W' ? 43200000 : 86400000;

    // Deterministic pseudo-random curve ending at current metrics.totalValue
    let runningVal = baseValue * (1 - (metrics.dayGainPercent / 100) * (timeframe === '1D' ? 1 : 2.5));
    
    for (let i = pointsCount - 1; i >= 0; i--) {
      const time = new Date(now - i * interval);
      const label = timeframe === '1D' 
        ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : time.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      if (i === 0) {
        points.push({ label: 'Now', value: baseValue });
      } else {
        const factor = 1 + (Math.sin(i * 1.3) * 0.03) + ((Math.random() - 0.5) * 0.015);
        const interpolated = runningVal * factor;
        points.push({ label, value: Math.max(1000, interpolated) });
        runningVal = runningVal * (1 + (baseValue - runningVal) / (pointsCount * 1.5));
      }
    }
    return points;
  }, [timeframe, metrics.totalValue, metrics.dayGainPercent]);

  // SVG dimensions for net worth chart
  const minVal = Math.min(...chartData.map((d) => d.value)) * 0.98;
  const maxVal = Math.max(...chartData.map((d) => d.value)) * 1.02;
  const range = maxVal - minVal || 1;
  const svgWidth = 800;
  const svgHeight = 240;

  const pointsString = chartData
    .map((d, idx) => {
      const x = (idx / (chartData.length - 1)) * svgWidth;
      const y = svgHeight - ((d.value - minVal) / range) * (svgHeight - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  const areaString = `${pointsString} ${svgWidth},${svgHeight} 0,${svgHeight}`;

  const currentDisplayValue = hoveredPointIndex !== null && chartData[hoveredPointIndex] 
    ? chartData[hoveredPointIndex].value 
    : metrics.totalValue;

  const currentDisplayLabel = hoveredPointIndex !== null && chartData[hoveredPointIndex]
    ? chartData[hoveredPointIndex].label
    : 'Current Portfolio Balance';

  // Calculate allocation breakdown
  const allocations = useMemo(() => {
    const list: { label: string; symbol: string; value: number; percent: number; color: string }[] = [];
    
    // Crypto holdings
    (Object.values(portfolio.holdings) as UserHolding[]).forEach((h) => {
      const asset = assetMap.get(h.assetId);
      if (asset && h.amount > 0) {
        const val = h.amount * asset.price;
        list.push({
          label: asset.name,
          symbol: asset.symbol,
          value: val,
          percent: metrics.totalValue > 0 ? (val / metrics.totalValue) * 100 : 0,
          color: asset.color,
        });
      }
    });

    // Staked
    if (metrics.stakedValue > 0) {
      list.push({
        label: 'Staked Positions',
        symbol: 'YIELD',
        value: metrics.stakedValue,
        percent: metrics.totalValue > 0 ? (metrics.stakedValue / metrics.totalValue) * 100 : 0,
        color: '#10B981',
      });
    }

    // Cash
    if (portfolio.cashBalance > 0) {
      list.push({
        label: 'USD Cash Reserve',
        symbol: 'USD',
        value: portfolio.cashBalance,
        percent: metrics.totalValue > 0 ? (portfolio.cashBalance / metrics.totalValue) * 100 : 0,
        color: '#64748B',
      });
    }

    return list.sort((a, b) => b.value - a.value);
  }, [portfolio, assetMap, metrics]);

  return (
    <div className="space-y-6">
      {/* Top Portfolio Hero Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>TOTAL PORTFOLIO VALUE</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mb-2">
            {formatCurrency(metrics.totalValue)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-semibold flex items-center px-2 py-0.5 rounded-md ${
              metrics.dayGainDollar >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              {metrics.dayGainDollar >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {metrics.dayGainDollar >= 0 ? '+' : ''}{formatCurrency(metrics.dayGainDollar)} ({formatPercentage(metrics.dayGainPercent)})
            </span>
            <span className="text-slate-400">24h P&L</span>
          </div>
        </div>

        {/* All-Time Profit / Loss Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>ALL-TIME RETURN</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight mb-2">
            +{formatCurrency(metrics.allTimeProfitDollar)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
              +{metrics.allTimeProfitPercent.toFixed(1)}% ROI
            </span>
            <span className="text-slate-400">Since inception</span>
          </div>
        </div>

        {/* Available Cash Reserve Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>AVAILABLE CASH BALANCE</span>
            <button 
              onClick={onOpenDeposit}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Deposit USD Cash"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mb-2">
            {formatCurrency(portfolio.cashBalance)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ready for instant buy</span>
            <button 
              onClick={onOpenDeposit}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
            >
              Deposit +
            </button>
          </div>
        </div>

        {/* Active Staked Yield Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>ACTIVE STAKED VAULTS</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mb-2">
            {formatCurrency(metrics.stakedValue)}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              +{formatCurrency(metrics.pendingRewardsUsd)} earned
            </span>
            <button 
              onClick={() => onNavigate('earn')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View Vaults →
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Portfolio Performance Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {currentDisplayLabel}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatCurrency(currentDisplayValue)}
            </div>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['1D', '1W', '1M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setHoveredPointIndex(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic SVG Area Chart */}
        <div 
          className="relative w-full h-[220px] sm:h-[260px] cursor-crosshair select-none"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1="0" y1={svgHeight * 0.50} x2={svgWidth} y2={svgHeight * 0.50} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />

            {/* Gradient Fill */}
            <polygon points={areaString} fill="url(#portfolioGradient)" />

            {/* Main Curve Line */}
            <polyline
              fill="none"
              stroke="#6366F1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />

            {/* Active Hover Point Circle */}
            {hoveredPointIndex !== null && (
              <>
                <line
                  x1={(hoveredPointIndex / (chartData.length - 1)) * svgWidth}
                  y1={0}
                  x2={(hoveredPointIndex / (chartData.length - 1)) * svgWidth}
                  y2={svgHeight}
                  stroke="#818CF8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={(hoveredPointIndex / (chartData.length - 1)) * svgWidth}
                  cy={svgHeight - ((chartData[hoveredPointIndex].value - minVal) / range) * (svgHeight - 30) - 15}
                  r="5"
                  fill="#818CF8"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>

          {/* Invisible Overlay for Mouse Coordinates Tracking */}
          <div className="absolute inset-0 flex">
            {chartData.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-full"
                onMouseEnter={() => setHoveredPointIndex(idx)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>{chartData[0]?.label}</span>
          <span>Performance Overview</span>
          <span>{chartData[chartData.length - 1]?.label}</span>
        </div>
      </div>

      {/* Asset Allocation Breakdown Multi-Color Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Portfolio Asset Allocation</h3>
          </div>
          <span className="text-xs text-slate-400">Diversification Index: <strong className="text-emerald-400">Optimal</strong></span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800 mb-4">
          {allocations.map((item) => (
            <div
              key={item.symbol}
              style={{ width: `${Math.max(item.percent, 2)}%`, backgroundColor: item.color }}
              className="h-full rounded-xs transition-all hover:opacity-80 cursor-pointer"
              title={`${item.label}: ${item.percent.toFixed(1)}% (${formatCurrency(item.value)})`}
            />
          ))}
        </div>

        {/* Allocation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {allocations.map((item) => (
            <div key={item.symbol} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-200">{item.symbol}</span>
                <span className="text-[11px] text-slate-400 ml-auto">{item.percent.toFixed(1)}%</span>
              </div>
              <div className="text-xs font-mono font-semibold text-slate-300">
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Crypto Holdings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Your Active Crypto Assets</h2>
            <p className="text-xs text-slate-400">Real-time valuation of your spot crypto holdings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('trade')}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Quick Buy / Sell</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Asset</th>
                <th className="py-3.5 px-4">Holdings</th>
                <th className="py-3.5 px-4">Market Price</th>
                <th className="py-3.5 px-4">24h Change</th>
                <th className="py-3.5 px-4">Avg Buy Price</th>
                <th className="py-3.5 px-4">Unrealized P&L</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {(Object.values(portfolio.holdings) as UserHolding[]).filter((h) => h.amount > 0).map((holding) => {
                const asset = assetMap.get(holding.assetId);
                if (!asset) return null;

                const holdingValue = holding.amount * asset.price;
                const costBasis = holding.amount * holding.avgBuyPrice;
                const pnlDollar = holdingValue - costBasis;
                const pnlPercent = costBasis > 0 ? (pnlDollar / costBasis) * 100 : 0;
                const isPos = pnlDollar >= 0;

                return (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-4 sm:px-6">
                      <div 
                        onClick={() => onOpenAssetDetail(asset)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${asset.iconBg}`}>
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                            <span>{asset.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">({asset.symbol})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase">{asset.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-white font-mono">{formatCurrency(holdingValue)}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatCryptoAmount(holding.amount, asset.symbol)}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-200 font-mono">{formatCurrency(asset.price)}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center font-semibold px-2 py-0.5 rounded text-[11px] ${
                        asset.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      {formatCurrency(holding.avgBuyPrice)}
                    </td>

                    <td className="py-4 px-4">
                      <div className={`font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}{formatCurrency(pnlDollar)}
                      </div>
                      <div className={`text-[11px] font-semibold ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPos ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectAssetForTrade(asset.id, 'buy')}
                          className="px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition-colors border border-indigo-500/30"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => onSelectAssetForTrade(asset.id, 'sell')}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors border border-slate-700"
                        >
                          Sell
                        </button>
                        <button
                          onClick={() => onOpenSend(asset.id)}
                          title="Transfer or send to another address"
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staking & Index Opportunities Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Yield Vault Callout */}
        <div className="bg-gradient-to-br from-purple-950/50 to-slate-900 border border-purple-800/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold mb-3 border border-purple-500/30">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>EARN PASSIVE CRYPTO YIELD</span>
            </div>
            <h4 className="text-base font-bold text-white mb-1">High-Yield Staking Pools Active</h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Earn up to <strong className="text-purple-300">12.8% APY</strong> by staking Solana, Polkadot, Near, or Ethereum in audited decentralized smart contract vaults.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate('earn')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-all hover:scale-[1.02]"
            >
              <span>Explore Staking Vaults</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Index Bundles Callout */}
        <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold mb-3 border border-indigo-500/30">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>THEMATIC CRYPTO BUNDLES</span>
            </div>
            <h4 className="text-base font-bold text-white mb-1">One-Click Thematic Index Investing</h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Invest into the <strong className="text-indigo-300">Top 5 Bluechip Index</strong> or <strong className="text-indigo-300">AI & Distributed Compute</strong> basket with automated rebalancing.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate('bundles')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all hover:scale-[1.02]"
            >
              <span>Browse Index Bundles</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { CryptoAsset, AssetCategory } from '../types';
import { formatCurrency, formatCompactNumber, formatPercentage } from '../utils/cryptoUtils';
import { 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Zap, 
  Coins, 
  Info,
  SlidersHorizontal
} from 'lucide-react';

interface MarketsViewProps {
  assets: CryptoAsset[];
  onSelectAssetForTrade: (assetId: string, action?: 'buy' | 'sell') => void;
  onOpenAssetDetail: (asset: CryptoAsset) => void;
  onNavigateToEarn: (assetId?: string) => void;
}

type SortField = 'rank' | 'price' | 'change24h' | 'volume24h' | 'marketCap';
type SortOrder = 'asc' | 'desc';

export const MarketsView: React.FC<MarketsViewProps> = ({
  assets,
  onSelectAssetForTrade,
  onOpenAssetDetail,
  onNavigateToEarn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
        const matchesSearch = 
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        switch (sortField) {
          case 'price':
            valA = a.price;
            valB = b.price;
            break;
          case 'change24h':
            valA = a.change24h;
            valB = b.change24h;
            break;
          case 'volume24h':
            valA = a.volume24h;
            valB = b.volume24h;
            break;
          case 'marketCap':
          default:
            valA = a.marketCap;
            valB = b.marketCap;
            break;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [assets, searchQuery, selectedCategory, sortField, sortOrder]);

  const categories: { id: AssetCategory; label: string }[] = [
    { id: 'all', label: 'All Assets' },
    { id: 'layer1', label: 'Layer 1 Chains' },
    { id: 'defi', label: 'DeFi & Protocols' },
    { id: 'ai', label: 'AI & GPU Compute' },
    { id: 'stablecoin', label: 'Stablecoins' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Crypto Market Screener</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live pricing, institutional liquidity, 7-day technical sparklines, and instant execution
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coin or symbol..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Markets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 sm:px-6">Asset Name</th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                  onClick={() => handleSort('change24h')}
                >
                  <div className="flex items-center gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 hidden md:table-cell">24h High / Low</th>
                <th 
                  className="py-3.5 px-4 hidden lg:table-cell cursor-pointer hover:text-slate-200 transition-colors"
                  onClick={() => handleSort('volume24h')}
                >
                  <div className="flex items-center gap-1">
                    <span>24h Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                  onClick={() => handleSort('marketCap')}
                >
                  <div className="flex items-center gap-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 w-32 hidden sm:table-cell text-center">7D Trend</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredAssets.map((asset, index) => {
                const isPositive = asset.change24h >= 0;

                // Sparkline SVG calculation
                const sparkMin = Math.min(...asset.sparkline);
                const sparkMax = Math.max(...asset.sparkline);
                const sparkRange = sparkMax - sparkMin || 1;
                const sparkWidth = 100;
                const sparkHeight = 32;

                const sparkPoints = asset.sparkline
                  .map((val, idx) => {
                    const x = (idx / (asset.sparkline.length - 1)) * sparkWidth;
                    const y = sparkHeight - ((val - sparkMin) / sparkRange) * (sparkHeight - 6) - 3;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-4 text-center font-mono text-slate-500 font-semibold">
                      {index + 1}
                    </td>

                    <td className="py-4 px-4 sm:px-6">
                      <div 
                        onClick={() => onOpenAssetDetail(asset)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${asset.iconBg} shadow-xs`}>
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                            <span>{asset.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">({asset.symbol})</span>
                            {asset.stakingApy && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                                {asset.stakingApy}% APY
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">{asset.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-100 text-sm">
                      {formatCurrency(asset.price)}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded text-[11px] ${
                        isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {formatPercentage(asset.change24h)}
                      </span>
                    </td>

                    <td className="py-4 px-4 hidden md:table-cell font-mono text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400/80">{formatCurrency(asset.low24h)}</span>
                        <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(10, ((asset.price - asset.low24h) / (asset.high24h - asset.low24h || 1)) * 100))}%`
                            }}
                          />
                        </div>
                        <span className="text-emerald-400/80">{formatCurrency(asset.high24h)}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 hidden lg:table-cell font-mono text-slate-300">
                      {formatCompactNumber(asset.volume24h)}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-300">
                      {formatCompactNumber(asset.marketCap)}
                    </td>

                    <td className="py-4 px-4 hidden sm:table-cell text-center">
                      <div className="w-24 h-8 mx-auto flex items-center justify-center">
                        <svg viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} className="w-full h-full">
                          <polyline
                            fill="none"
                            stroke={isPositive ? '#10B981' : '#F43F5E'}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={sparkPoints}
                          />
                        </svg>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectAssetForTrade(asset.id, 'buy')}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm active:scale-95 text-xs"
                        >
                          Trade
                        </button>
                        {asset.stakingApy && (
                          <button
                            onClick={() => onNavigateToEarn(asset.id)}
                            title={`Stake ${asset.symbol} for ${asset.stakingApy}% APY`}
                            className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40 transition-colors"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenAssetDetail(asset)}
                          title="View coin analytics & history"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
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
    </div>
  );
};

import React, { useState } from 'react';
import { IndexBundle, CryptoAsset, PortfolioState } from '../types';
import { formatCurrency, formatCryptoAmount } from '../utils/cryptoUtils';
import { 
  Layers, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  PieChart, 
  ArrowRight,
  Zap,
  Info,
  DollarSign
} from 'lucide-react';

interface IndexBundlesViewProps {
  bundles: IndexBundle[];
  assets: CryptoAsset[];
  portfolio: PortfolioState;
  onInvestInBundle: (bundleId: string, totalUsd: number) => void;
  onOpenDeposit: () => void;
}

export const IndexBundlesView: React.FC<IndexBundlesViewProps> = ({
  bundles,
  assets,
  portfolio,
  onInvestInBundle,
  onOpenDeposit,
}) => {
  const [selectedBundle, setSelectedBundle] = useState<IndexBundle | null>(null);
  const [investAmount, setInvestAmount] = useState<string>('500');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const assetMap = new Map<string, CryptoAsset>(assets.map((a) => [a.id, a]));

  const parsedAmount = parseFloat(investAmount) || 0;

  const handleConfirmInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBundle) return;

    if (parsedAmount < selectedBundle.minInvestment) {
      alert(`Minimum investment for this bundle is ${formatCurrency(selectedBundle.minInvestment)}.`);
      return;
    }

    if (parsedAmount > portfolio.cashBalance) {
      alert(`Insufficient USD cash balance. You have ${formatCurrency(portfolio.cashBalance)} available.`);
      return;
    }

    onInvestInBundle(selectedBundle.id, parsedAmount);
    setToastMessage(`Successfully invested ${formatCurrency(parsedAmount)} into ${selectedBundle.name}! Tokens added to your portfolio.`);
    setSelectedBundle(null);
    setTimeout(() => setToastMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Automated Crypto Thematic Portfolios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Thematic Crypto Index Bundles
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Diversify in one transaction. Apex Index Bundles package high-conviction market sectors into rebalanced crypto baskets so you don't have to manually buy dozens of individual tokens.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bundles.map((bundle) => {
          return (
            <div
              key={bundle.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-white tracking-tight">{bundle.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {bundle.badge}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400 uppercase">{bundle.symbol} Index</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">30D Return</span>
                    <span className="text-sm font-black text-emerald-400 font-mono flex items-center justify-end">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                      +{bundle.pastReturn30d}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                  {bundle.description}
                </p>

                {/* Composition Bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-semibold">
                    <span>Index Composition</span>
                    <span className="text-slate-500">Risk: <strong className="text-slate-300">{bundle.riskLevel}</strong></span>
                  </div>

                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
                    {bundle.components.map((comp) => {
                      const asset = assetMap.get(comp.assetId);
                      return (
                        <div
                          key={comp.assetId}
                          style={{
                            width: `${comp.weightPercent}%`,
                            backgroundColor: asset?.color || '#6366F1'
                          }}
                          className="h-full rounded-xs"
                          title={`${asset?.name || comp.assetId}: ${comp.weightPercent}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Constituent breakdown chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {bundle.components.map((comp) => {
                      const asset = assetMap.get(comp.assetId);
                      if (!asset) return null;
                      return (
                        <div
                          key={comp.assetId}
                          className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                          <span className="font-bold text-slate-200">{asset.symbol}</span>
                          <span className="text-slate-400 font-mono">{comp.weightPercent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span>Min: </span>
                  <strong className="text-white font-mono">{formatCurrency(bundle.minInvestment)}</strong>
                </div>

                <button
                  onClick={() => setSelectedBundle(bundle)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>Invest Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Investment Modal */}
      {selectedBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white">Invest in {selectedBundle.name}</h3>
                <p className="text-xs text-slate-400">Automated multi-asset allocation</p>
              </div>
              <button
                onClick={() => setSelectedBundle(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmInvestment} className="space-y-5">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold">Investment Amount (USD)</span>
                  <span>Available Cash: <strong className="text-slate-200">{formatCurrency(portfolio.cashBalance)}</strong></span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min={selectedBundle.minInvestment}
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl font-black text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {[100, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setInvestAmount(preset.toString())}
                        className="px-2 py-1 text-[11px] font-bold rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview of underlying purchases */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  You will receive approximately:
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedBundle.components.map((comp) => {
                    const asset = assetMap.get(comp.assetId);
                    if (!asset) return null;
                    const allocatedUsd = (parsedAmount * comp.weightPercent) / 100;
                    const estimatedUnits = asset.price > 0 ? allocatedUsd / asset.price : 0;

                    return (
                      <div key={comp.assetId} className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                          <span className="font-bold text-slate-200">{asset.name} ({comp.weightPercent}%)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-300 font-semibold">{formatCurrency(allocatedUsd)}</span>
                          <span className="text-slate-500 text-[10px] block">
                            ≈ {formatCryptoAmount(estimatedUnits, asset.symbol)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {parsedAmount > portfolio.cashBalance ? (
                <div className="space-y-2">
                  <div className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Insufficient cash. Deposit USD to complete investment.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBundle(null);
                      onOpenDeposit();
                    }}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    Deposit USD Cash
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={parsedAmount < selectedBundle.minInvestment}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-98"
                >
                  Confirm Investment of {formatCurrency(parsedAmount)}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

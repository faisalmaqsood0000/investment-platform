import React, { useState } from 'react';
import { CryptoAsset, PortfolioState, StakedPosition } from '../types';
import { formatCurrency, formatCryptoAmount } from '../utils/cryptoUtils';
import { 
  Coins, 
  Zap, 
  Lock, 
  Unlock, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';

interface EarnStakingViewProps {
  portfolio: PortfolioState;
  assets: CryptoAsset[];
  onStakeAsset: (stake: {
    assetId: string;
    amount: number;
    apy: number;
    lockPeriodDays: number;
  }) => void;
  onUnstakeAsset: (positionId: string) => void;
  onClaimRewards: (positionId: string) => void;
}

export const EarnStakingView: React.FC<EarnStakingViewProps> = ({
  portfolio,
  assets,
  onStakeAsset,
  onUnstakeAsset,
  onClaimRewards,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('solana');
  const [stakeAmountInput, setStakeAmountInput] = useState<string>('');
  const [selectedLockDays, setSelectedLockDays] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const userHolding = portfolio.holdings[selectedAssetId]?.amount || 0;

  // Calculate dynamic APY with lock bonuses
  const baseApy = selectedAsset.stakingApy || 5.0;
  const apyBonus = selectedLockDays === 0 ? 0 : selectedLockDays === 30 ? 1.5 : 3.2;
  const effectiveApy = baseApy + apyBonus;

  // Staking projection calculations
  const parsedStakeAmount = parseFloat(stakeAmountInput) || 0;
  const yearlyCryptoReward = (parsedStakeAmount * effectiveApy) / 100;
  const monthlyCryptoReward = yearlyCryptoReward / 12;
  const dailyCryptoReward = yearlyCryptoReward / 365;

  const yearlyUsdReward = yearlyCryptoReward * selectedAsset.price;
  const monthlyUsdReward = monthlyCryptoReward * selectedAsset.price;

  const handleStakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedStakeAmount <= 0) return;
    if (parsedStakeAmount > userHolding) {
      alert(`Insufficient ${selectedAsset.symbol} balance. You hold ${formatCryptoAmount(userHolding, selectedAsset.symbol)}.`);
      return;
    }

    onStakeAsset({
      assetId: selectedAsset.id,
      amount: parsedStakeAmount,
      apy: effectiveApy,
      lockPeriodDays: selectedLockDays,
    });

    setToastMessage(`Successfully staked ${formatCryptoAmount(parsedStakeAmount, selectedAsset.symbol)} at ${effectiveApy.toFixed(1)}% APY!`);
    setStakeAmountInput('');
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Earn Header Stats Banner */}
      <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 border border-purple-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-3 border border-purple-500/30">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            <span>Audited Proof-of-Stake Yield Pools</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Institutional Staking & Compound Yield
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Put your idle cryptocurrency to work. Stake directly into decentralized consensus validators and audited liquidity vaults with real-time accrued rewards and flexible redemption.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-purple-900/40">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Staked Value</span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
              {formatCurrency(
                portfolio.stakedPositions.reduce((acc, pos) => {
                  const asset = assets.find((a) => a.id === pos.assetId);
                  return acc + (pos.status === 'active' && asset ? pos.amount * asset.price : 0);
                }, 0)
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Rewards Earned</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
              +{formatCurrency(
                portfolio.stakedPositions.reduce((acc, pos) => {
                  const asset = assets.find((a) => a.id === pos.assetId);
                  return acc + (asset ? pos.accruedRewards * asset.price : 0);
                }, 0)
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Security Assurance</span>
            <div className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Smart Contract Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Grid: Staking Terminal + Vault Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Stake Terminal (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Stake Into Vault</span>
            </h3>
            <span className="text-xs font-bold text-purple-400 font-mono">
              {effectiveApy.toFixed(1)}% APY
            </span>
          </div>

          <form onSubmit={handleStakeSubmit} className="space-y-4">
            {/* Asset Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Select Asset to Stake</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {assets.filter((a) => a.stakingApy).map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.symbol}) — Base {asset.stakingApy}% APY
                  </option>
                ))}
              </select>
            </div>

            {/* Lock Term Options */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Lockup Duration & Boost</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 0, label: 'Flexible', bonus: 'Base' },
                  { days: 30, label: '30 Days', bonus: '+1.5% APY' },
                  { days: 90, label: '90 Days', bonus: '+3.2% APY' },
                ].map((term) => (
                  <button
                    key={term.days}
                    type="button"
                    onClick={() => setSelectedLockDays(term.days)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedLockDays === term.days
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{term.label}</div>
                    <div className="text-[10px] text-purple-400 font-semibold">{term.bonus}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold">Stake Amount</span>
                <span>Available: <strong className="text-slate-200">{formatCryptoAmount(userHolding, selectedAsset.symbol)}</strong></span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={stakeAmountInput}
                  onChange={(e) => setStakeAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-bold text-white font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setStakeAmountInput(userHolding > 0 ? userHolding.toString() : '0')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[11px] font-bold"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Projected Returns Calculator Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Daily Projected:</span>
                <span className="text-slate-200 font-semibold">
                  +{dailyCryptoReward.toFixed(5)} {selectedAsset.symbol} (≈ {formatCurrency(dailyCryptoReward * selectedAsset.price)})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Monthly Projected:</span>
                <span className="text-slate-200 font-semibold">
                  +{monthlyCryptoReward.toFixed(4)} {selectedAsset.symbol} (≈ {formatCurrency(monthlyUsdReward)})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Annual Projected:</span>
                <span className="text-emerald-400 font-bold">
                  +{yearlyCryptoReward.toFixed(4)} {selectedAsset.symbol} (≈ {formatCurrency(yearlyUsdReward)})
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={parsedStakeAmount <= 0 || parsedStakeAmount > userHolding}
              className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                parsedStakeAmount <= 0 || parsedStakeAmount > userHolding
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 active:scale-98'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Confirm & Stake {selectedAsset.symbol}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Your Active Staked Positions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Your Active Staked Positions</span>
            </h3>

            {portfolio.stakedPositions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                You have no active staked positions yet. Choose a token from the left to start earning yield!
              </div>
            ) : (
              <div className="space-y-3">
                {portfolio.stakedPositions.map((pos) => {
                  const asset = assets.find((a) => a.id === pos.assetId);
                  if (!asset) return null;

                  return (
                    <div
                      key={pos.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${asset.iconBg}`}>
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{asset.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                              {pos.apy}% APY
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {pos.lockPeriodDays === 0 ? 'Flexible' : `${pos.lockPeriodDays}D Lock`}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            Staked: <strong className="text-slate-200">{formatCryptoAmount(pos.amount, asset.symbol)}</strong> ({formatCurrency(pos.amount * asset.price)})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:border-l sm:border-slate-800 sm:pl-4 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-slate-500 font-semibold block">Accrued Yield</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            +{pos.accruedRewards.toFixed(4)} {asset.symbol}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onClaimRewards(pos.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                          >
                            Claim
                          </button>
                          <button
                            onClick={() => onUnstakeAsset(pos.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                          >
                            Unstake
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Staking Vaults Catalog */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Available Verified Vault Opportunities</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assets.filter((a) => a.stakingApy).map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedAssetId === asset.id
                      ? 'bg-purple-950/30 border-purple-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${asset.iconBg}`}>
                        {asset.symbol.slice(0, 3)}
                      </div>
                      <span className="font-bold text-xs text-white">{asset.name}</span>
                    </div>
                    <span className="text-xs font-black text-purple-400 font-mono">
                      Up to {(asset.stakingApy! + 3.2).toFixed(1)}% APY
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                    {asset.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Base: {asset.stakingApy}%</span>
                    <span className="text-purple-300 font-semibold">Select →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

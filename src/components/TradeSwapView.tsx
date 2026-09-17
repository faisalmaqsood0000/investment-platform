import React, { useState, useEffect } from 'react';
import { CryptoAsset, PortfolioState, Transaction } from '../types';
import { formatCurrency, formatCryptoAmount, generateTxHash } from '../utils/cryptoUtils';
import { 
  ArrowLeftRight, 
  ArrowDown, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Wallet,
  Sparkles
} from 'lucide-react';

interface TradeSwapViewProps {
  portfolio: PortfolioState;
  assets: CryptoAsset[];
  initialAssetId?: string;
  initialMode?: 'buy' | 'sell' | 'swap';
  onExecuteTrade: (trade: {
    type: 'BUY' | 'SELL' | 'SWAP';
    assetId: string;
    toAssetId?: string;
    amount: number;
    toAmount?: number;
    pricePerUnit: number;
    totalUsd: number;
  }) => void;
  onOpenDeposit: () => void;
}

export const TradeSwapView: React.FC<TradeSwapViewProps> = ({
  portfolio,
  assets,
  initialAssetId = 'bitcoin',
  initialMode = 'buy',
  onExecuteTrade,
  onOpenDeposit,
}) => {
  const [mode, setMode] = useState<'buy' | 'sell' | 'swap'>(initialMode);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId);
  const [swapTargetAssetId, setSwapTargetAssetId] = useState<string>('ethereum');
  const [amountInput, setAmountInput] = useState<string>('');
  const [isUsdDenominated, setIsUsdDenominated] = useState<boolean>(true);
  const [slippage, setSlippage] = useState<number>(0.1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialAssetId) setSelectedAssetId(initialAssetId);
    if (initialMode) setMode(initialMode);
  }, [initialAssetId, initialMode]);

  const sourceAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const targetAsset = assets.find((a) => a.id === swapTargetAssetId) || assets[1];

  const userHolding = portfolio.holdings[selectedAssetId]?.amount || 0;
  const targetHolding = portfolio.holdings[swapTargetAssetId]?.amount || 0;

  // Calculate parsed amounts
  const numInput = parseFloat(amountInput) || 0;

  let cryptoAmount = 0;
  let totalUsd = 0;

  if (mode === 'buy') {
    if (isUsdDenominated) {
      totalUsd = numInput;
      cryptoAmount = sourceAsset.price > 0 ? numInput / sourceAsset.price : 0;
    } else {
      cryptoAmount = numInput;
      totalUsd = numInput * sourceAsset.price;
    }
  } else if (mode === 'sell') {
    if (isUsdDenominated) {
      totalUsd = numInput;
      cryptoAmount = sourceAsset.price > 0 ? numInput / sourceAsset.price : 0;
    } else {
      cryptoAmount = numInput;
      totalUsd = numInput * sourceAsset.price;
    }
  } else {
    // Swap
    cryptoAmount = numInput;
    totalUsd = cryptoAmount * sourceAsset.price;
  }

  const swapReceiveCrypto = targetAsset.price > 0 ? totalUsd / targetAsset.price : 0;

  // Validation
  const canSubmit = () => {
    if (numInput <= 0) return false;
    if (mode === 'buy') {
      return totalUsd <= portfolio.cashBalance;
    }
    if (mode === 'sell') {
      return cryptoAmount <= userHolding;
    }
    if (mode === 'swap') {
      return cryptoAmount <= userHolding && selectedAssetId !== swapTargetAssetId;
    }
    return false;
  };

  const handlePercentageSelect = (percentage: number) => {
    if (mode === 'buy') {
      const usdAmount = (portfolio.cashBalance * percentage) / 100;
      setAmountInput(usdAmount > 0 ? usdAmount.toFixed(2) : '0');
      setIsUsdDenominated(true);
    } else if (mode === 'sell') {
      const tokenAmount = (userHolding * percentage) / 100;
      setAmountInput(tokenAmount > 0 ? tokenAmount.toFixed(4) : '0');
      setIsUsdDenominated(false);
    } else {
      const tokenAmount = (userHolding * percentage) / 100;
      setAmountInput(tokenAmount > 0 ? tokenAmount.toFixed(4) : '0');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (numInput <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    if (mode === 'buy') {
      if (totalUsd > portfolio.cashBalance) {
        setErrorMessage(`Insufficient USD cash balance. You need ${formatCurrency(totalUsd)}.`);
        return;
      }

      onExecuteTrade({
        type: 'BUY',
        assetId: sourceAsset.id,
        amount: cryptoAmount,
        pricePerUnit: sourceAsset.price,
        totalUsd: totalUsd,
      });

      setSuccessMessage(`Successfully purchased ${formatCryptoAmount(cryptoAmount, sourceAsset.symbol)} for ${formatCurrency(totalUsd)}!`);
      setAmountInput('');
    } else if (mode === 'sell') {
      if (cryptoAmount > userHolding) {
        setErrorMessage(`Insufficient ${sourceAsset.symbol} balance. You hold ${formatCryptoAmount(userHolding, sourceAsset.symbol)}.`);
        return;
      }

      onExecuteTrade({
        type: 'SELL',
        assetId: sourceAsset.id,
        amount: cryptoAmount,
        pricePerUnit: sourceAsset.price,
        totalUsd: totalUsd,
      });

      setSuccessMessage(`Successfully sold ${formatCryptoAmount(cryptoAmount, sourceAsset.symbol)} for ${formatCurrency(totalUsd)} USD!`);
      setAmountInput('');
    } else {
      // Swap
      if (selectedAssetId === swapTargetAssetId) {
        setErrorMessage('Cannot swap a token for itself. Please choose a different target asset.');
        return;
      }
      if (cryptoAmount > userHolding) {
        setErrorMessage(`Insufficient ${sourceAsset.symbol} balance to swap.`);
        return;
      }

      onExecuteTrade({
        type: 'SWAP',
        assetId: sourceAsset.id,
        toAssetId: targetAsset.id,
        amount: cryptoAmount,
        toAmount: swapReceiveCrypto,
        pricePerUnit: sourceAsset.price,
        totalUsd: totalUsd,
      });

      setSuccessMessage(
        `Swapped ${formatCryptoAmount(cryptoAmount, sourceAsset.symbol)} for ${formatCryptoAmount(swapReceiveCrypto, targetAsset.symbol)}!`
      );
      setAmountInput('');
    }

    setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  const handleInvertSwap = () => {
    const prevSource = selectedAssetId;
    setSelectedAssetId(swapTargetAssetId);
    setSwapTargetAssetId(prevSource);
    setAmountInput('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Trading Terminal Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mt-20"></div>

        {/* Header Tabs: Buy, Sell, Swap */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => { setMode('buy'); setAmountInput(''); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'buy'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buy Crypto
            </button>
            <button
              onClick={() => { setMode('sell'); setAmountInput(''); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'sell'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sell to USD
            </button>
            <button
              onClick={() => { setMode('swap'); setAmountInput(''); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'swap'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Swap Tokens
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Fee Spot Tier</span>
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Input Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                {mode === 'buy' ? 'Pay With (USD Cash)' : mode === 'sell' ? 'Sell Asset' : 'You Pay'}
              </span>
              <div className="flex items-center gap-1 font-mono">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                <span>Available:</span>
                {mode === 'buy' ? (
                  <strong className="text-slate-200">{formatCurrency(portfolio.cashBalance)}</strong>
                ) : (
                  <strong className="text-slate-200">{formatCryptoAmount(userHolding, sourceAsset.symbol)}</strong>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="number"
                step="any"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl sm:text-3xl font-black text-white font-mono placeholder-slate-600 focus:outline-none"
              />

              {/* Asset Dropdown Selector */}
              {mode === 'buy' ? (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl shrink-0">
                  <span className="font-bold text-sm text-emerald-400 font-mono">USD</span>
                </div>
              ) : (
                <select
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    setAmountInput('');
                  }}
                  className="bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0"
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id} className="bg-slate-900 text-white">
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick Percentage Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-900">
              <span className="text-[11px] text-slate-500">
                {mode === 'buy' && (
                  <span>≈ {formatCryptoAmount(cryptoAmount, sourceAsset.symbol)}</span>
                )}
                {mode === 'sell' && (
                  <span>≈ {formatCurrency(totalUsd)}</span>
                )}
              </span>

              <div className="flex items-center gap-1.5">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageSelect(pct)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Swap Divider Button */}
          {mode === 'swap' && (
            <div className="flex justify-center -my-3 relative z-10">
              <button
                type="button"
                onClick={handleInvertSwap}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/30 transition-all hover:scale-110 active:scale-95"
                title="Invert swap pair"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Secondary Output Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                {mode === 'buy' ? 'You Receive (Crypto)' : mode === 'sell' ? 'You Receive (USD)' : 'You Receive'}
              </span>
              <div className="flex items-center gap-1 font-mono">
                <span>Holdings:</span>
                {mode === 'buy' ? (
                  <strong className="text-slate-200">{formatCryptoAmount(userHolding, sourceAsset.symbol)}</strong>
                ) : mode === 'sell' ? (
                  <strong className="text-slate-200">{formatCurrency(portfolio.cashBalance)}</strong>
                ) : (
                  <strong className="text-slate-200">{formatCryptoAmount(targetHolding, targetAsset.symbol)}</strong>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-full text-2xl sm:text-3xl font-black text-slate-100 font-mono">
                {mode === 'buy' 
                  ? cryptoAmount > 0 ? cryptoAmount.toFixed(6) : '0.00'
                  : mode === 'sell'
                  ? totalUsd > 0 ? formatCurrency(totalUsd) : '$0.00'
                  : swapReceiveCrypto > 0 ? swapReceiveCrypto.toFixed(6) : '0.00'
                }
              </div>

              {/* Target Asset Selector */}
              {mode === 'buy' ? (
                <select
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    setAmountInput('');
                  }}
                  className="bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0"
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id} className="bg-slate-900 text-white">
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
              ) : mode === 'sell' ? (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl shrink-0">
                  <span className="font-bold text-sm text-emerald-400 font-mono">USD</span>
                </div>
              ) : (
                <select
                  value={swapTargetAssetId}
                  onChange={(e) => setSwapTargetAssetId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0"
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id} className="bg-slate-900 text-white">
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Trade Rate & Execution Metadata */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Reference Rate:</span>
              <span className="text-slate-200 font-semibold">
                1 {sourceAsset.symbol} = {formatCurrency(sourceAsset.price)}
              </span>
            </div>
            {mode === 'swap' && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Swap Exchange Ratio:</span>
                <span className="text-slate-200 font-semibold">
                  1 {sourceAsset.symbol} ≈ {(sourceAsset.price / targetAsset.price).toFixed(4)} {targetAsset.symbol}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-400">
              <span>Estimated Network Fee:</span>
              <span className="text-emerald-400 font-semibold">$0.00 (Platform Sponsored)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Max Slippage Tolerance:</span>
              <span className="text-slate-300">{slippage}%</span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {mode === 'buy' && portfolio.cashBalance < 10 ? (
              <button
                type="button"
                onClick={onOpenDeposit}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Deposit USD to Start Trading</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit()}
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                  !canSubmit()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : mode === 'buy'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.99]'
                    : mode === 'sell'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-[0.99]'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-[0.99]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>
                  {mode === 'buy'
                    ? `Confirm Buy ${sourceAsset.symbol}`
                    : mode === 'sell'
                    ? `Confirm Sell ${sourceAsset.symbol}`
                    : `Execute ${sourceAsset.symbol} → ${targetAsset.symbol} Swap`}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Recent Trading Activity Quick List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Executions</h3>
          </div>
          <span className="text-xs text-slate-500">Live order matching engine</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {portfolio.transactions.slice(0, 4).map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  tx.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  tx.type === 'SELL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {tx.type}
                </span>
                <div>
                  <div className="font-bold text-white font-mono">
                    {tx.type === 'SWAP' 
                      ? `${tx.amount} ${tx.assetId.toUpperCase()} → ${tx.toAmount?.toFixed(4)} ${tx.toAssetId?.toUpperCase()}`
                      : `${tx.amount} ${tx.assetId.toUpperCase()}`
                    }
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-200 font-mono">{formatCurrency(tx.totalUsd)}</div>
                <span className="text-[10px] text-emerald-400 font-semibold">Completed</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

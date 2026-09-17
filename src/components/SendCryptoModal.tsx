import React, { useState } from 'react';
import { CryptoAsset, PortfolioState } from '../types';
import { formatCurrency, formatCryptoAmount, generateTxHash } from '../utils/cryptoUtils';
import { ArrowUpRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SendCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioState;
  assets: CryptoAsset[];
  initialAssetId?: string;
  onSendCrypto: (tx: {
    assetId: string;
    recipientAddress: string;
    amount: number;
    totalUsd: number;
  }) => void;
}

export const SendCryptoModal: React.FC<SendCryptoModalProps> = ({
  isOpen,
  onClose,
  portfolio,
  assets,
  initialAssetId = 'bitcoin',
  onSendCrypto,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const userHolding = portfolio.holdings[selectedAssetId]?.amount || 0;

  const parsedAmount = parseFloat(sendAmount) || 0;
  const totalUsd = parsedAmount * selectedAsset.price;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientAddress.trim()) {
      alert('Please enter a recipient wallet address.');
      return;
    }
    if (parsedAmount <= 0) {
      alert('Please enter an amount greater than 0.');
      return;
    }
    if (parsedAmount > userHolding) {
      alert(`Insufficient ${selectedAsset.symbol} balance. You hold ${formatCryptoAmount(userHolding, selectedAsset.symbol)}.`);
      return;
    }

    onSendCrypto({
      assetId: selectedAsset.id,
      recipientAddress: recipientAddress.trim(),
      amount: parsedAmount,
      totalUsd,
    });

    setToastMessage(`Sent ${formatCryptoAmount(parsedAmount, selectedAsset.symbol)} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}!`);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Send Crypto to External Wallet</h3>
              <p className="text-xs text-slate-400">Transfer tokens to another address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {toastMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div className="text-sm font-bold text-white">{toastMessage}</div>
            <p className="text-xs text-slate-400">Transaction broadcasted to blockchain network.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Select Asset</label>
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setSendAmount('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.symbol}) — Held: {formatCryptoAmount(portfolio.holdings[asset.id]?.amount || 0, asset.symbol)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Recipient Wallet Address</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="e.g. 0x71C... or Sol... address"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold">Amount to Send</span>
                <span>Available: <strong className="text-slate-200">{formatCryptoAmount(userHolding, selectedAsset.symbol)}</strong></span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-bold text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setSendAmount(userHolding > 0 ? userHolding.toString() : '0')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[11px] font-bold"
                >
                  MAX
                </button>
              </div>
              {parsedAmount > 0 && (
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  ≈ {formatCurrency(totalUsd)} USD
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Estimated Gas Fee:</span>
                <span className="text-emerald-400">$0.00 (Subsidized)</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmation Time:</span>
                <span className="text-slate-300">~12 seconds</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={parsedAmount <= 0 || parsedAmount > userHolding || !recipientAddress.trim()}
              className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                parsedAmount <= 0 || parsedAmount > userHolding || !recipientAddress.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-98'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send {selectedAsset.symbol} Now</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

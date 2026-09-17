import React, { useState } from 'react';
import { formatCurrency } from '../utils/cryptoUtils';
import { Wallet, QrCode, Copy, Check, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositFunds: (amountUsd: number) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onDepositFunds,
}) => {
  const [depositTab, setDepositTab] = useState<'fiat' | 'crypto'>('fiat');
  const [customAmount, setCustomAmount] = useState<string>('2500');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const demoDepositAddress = '0x71C38B1902849AbcE07138092Bcd182049e61234';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(demoDepositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customAmount);
    if (val > 0) {
      onDepositFunds(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Deposit Account Funds</h3>
              <p className="text-xs text-slate-400">Add capital to your trading account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            onClick={() => setDepositTab('fiat')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              depositTab === 'fiat'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            USD Cash / Demo Faucet
          </button>
          <button
            onClick={() => setDepositTab('crypto')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              depositTab === 'crypto'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crypto Address & QR
          </button>
        </div>

        {depositTab === 'fiat' ? (
          <form onSubmit={handleConfirmDeposit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Deposit USD Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">$</span>
                <input
                  type="number"
                  step="100"
                  min="10"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-xl font-black text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomAmount(preset.toString())}
                  className="py-2 text-xs font-bold rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  +${preset}
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant credit. Funds are immediately available for trading, staking, or bundle investments.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-98"
            >
              Add {formatCurrency(parseFloat(customAmount) || 0)} Cash to Account
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            {/* Simulated QR Code Box */}
            <div className="w-44 h-44 mx-auto bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg">
              <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-2 text-slate-900">
                <QrCode className="w-24 h-24 text-slate-900" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mt-1">Multi-Chain USDC / ETH</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Your Personal Multi-Chain Deposit Address:</span>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                <span className="truncate">{demoDepositAddress}</span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Supports native transfers across Ethereum, Solana, and Arbitrum. Automatic credit within 1 block confirmation.
            </p>

            <button
              onClick={() => {
                onDepositFunds(1000);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            >
              Simulate Inbound $1,000 Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

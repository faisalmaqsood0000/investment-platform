import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatCryptoAmount } from '../utils/cryptoUtils';
import { 
  History, 
  Search, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Coins 
} from 'lucide-react';

interface ActivityLedgerViewProps {
  transactions: Transaction[];
}

export const ActivityLedgerView: React.FC<ActivityLedgerViewProps> = ({ transactions }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesFilter = selectedFilter === 'ALL' || tx.type === selectedFilter;
      const matchesSearch = 
        tx.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [transactions, selectedFilter, searchQuery]);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Type', 'Asset', 'ToAsset', 'Amount', 'PricePerUnit', 'TotalUSD', 'Status', 'TxHash', 'Timestamp'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.assetId,
      t.toAssetId || '',
      t.amount,
      t.pricePerUnit,
      t.totalUsd,
      t.status,
      t.txHash,
      t.timestamp,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apex_crypto_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalVolume = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (t.totalUsd || 0), 0);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">On-Chain Activity & Ledger</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive immutable transaction audit log, settlement records, and verification receipts
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors w-fit"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'BUY', 'SELL', 'SWAP', 'STAKE', 'DEPOSIT'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === type
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by coin or hash..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Type</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">Value (USD)</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Price / Rate</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Transaction Hash</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Timestamp</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          tx.type === 'BUY'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : tx.type === 'SELL'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : tx.type === 'SWAP'
                            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                            : tx.type === 'STAKE'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {tx.type === 'BUY' && <ArrowDownLeft className="w-3 h-3" />}
                          {tx.type === 'SELL' && <ArrowUpRight className="w-3 h-3" />}
                          {tx.type === 'SWAP' && <ArrowLeftRight className="w-3 h-3" />}
                          {tx.type === 'STAKE' && <Coins className="w-3 h-3" />}
                          <span>{tx.type}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-white font-mono">
                          {tx.type === 'SWAP'
                            ? `${tx.amount} ${tx.assetId.toUpperCase()} → ${tx.toAmount?.toFixed(4)} ${tx.toAssetId?.toUpperCase()}`
                            : `${tx.amount} ${tx.assetId.toUpperCase()}`}
                        </div>
                        {tx.notes && (
                          <div className="text-[10px] text-slate-400">{tx.notes}</div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-100">
                        {formatCurrency(tx.totalUsd)}
                      </td>

                      <td className="py-4 px-4 hidden md:table-cell font-mono text-slate-400">
                        {formatCurrency(tx.pricePerUnit)}
                      </td>

                      <td className="py-4 px-4 hidden sm:table-cell font-mono text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}</span>
                          <button
                            onClick={() => handleCopy(tx.txHash)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Copy Tx Hash"
                          >
                            {copiedHash === tx.txHash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 hidden lg:table-cell text-slate-400 text-[11px]">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-4 px-4 text-right sm:pr-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Completed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

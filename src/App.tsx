import React, { useState, useEffect, useMemo } from 'react';
import { 
  CryptoAsset, 
  PortfolioState, 
  NavigationTab, 
  Transaction, 
  IndexBundle 
} from './types';
import { 
  INITIAL_CRYPTO_ASSETS, 
  INDEX_BUNDLES, 
  INITIAL_PORTFOLIO 
} from './data/cryptoData';
import { 
  calculatePortfolioMetrics, 
  loadPortfolioFromStorage, 
  savePortfolioToStorage, 
  generateTxHash 
} from './utils/cryptoUtils';

import { HeaderNav } from './components/HeaderNav';
import { DashboardView } from './components/DashboardView';
import { MarketsView } from './components/MarketsView';
import { TradeSwapView } from './components/TradeSwapView';
import { EarnStakingView } from './components/EarnStakingView';
import { IndexBundlesView } from './components/IndexBundlesView';
import { ActivityLedgerView } from './components/ActivityLedgerView';
import { DepositModal } from './components/DepositModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { SendCryptoModal } from './components/SendCryptoModal';

export default function App() {
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => loadPortfolioFromStorage());
  const [assets, setAssets] = useState<CryptoAsset[]>(INITIAL_CRYPTO_ASSETS);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Trade terminal shortcuts
  const [tradeAssetId, setTradeAssetId] = useState<string>('bitcoin');
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell' | 'swap'>('buy');

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isSendOpen, setIsSendOpen] = useState<boolean>(false);
  const [sendAssetId, setSendAssetId] = useState<string>('bitcoin');
  const [detailAsset, setDetailAsset] = useState<CryptoAsset | null>(null);

  // Sync portfolio with localStorage whenever it changes
  useEffect(() => {
    savePortfolioToStorage(portfolio);
  }, [portfolio]);

  // Live market tick simulator (subtle realistic fluctuations)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setAssets((prevAssets) =>
        prevAssets.map((asset) => {
          // Stablecoins stay very close to 1.00
          if (asset.category === 'stablecoin') {
            const tinyChange = (Math.random() - 0.5) * 0.0004;
            const newPrice = Math.max(0.9995, Math.min(1.0005, asset.price + tinyChange));
            return { ...asset, price: newPrice };
          }

          // Random percentage fluctuation between -0.4% and +0.45%
          const pctChange = (Math.random() - 0.48) * 0.007;
          const newPrice = Math.max(0.01, asset.price * (1 + pctChange));
          const newChange24h = asset.change24h + pctChange * 10;
          
          // Update sparkline last point
          const newSparkline = [...asset.sparkline];
          newSparkline[newSparkline.length - 1] = newPrice;

          return {
            ...asset,
            price: Number(newPrice.toFixed(asset.price < 10 ? 4 : 2)),
            change24h: Number(newChange24h.toFixed(2)),
            high24h: Math.max(asset.high24h, newPrice),
            low24h: Math.min(asset.low24h, newPrice),
            sparkline: newSparkline,
          };
        })
      );

      // Micro-increment accrued rewards for active staked positions
      setPortfolio((prevPortfolio) => {
        if (prevPortfolio.stakedPositions.length === 0) return prevPortfolio;

        const updatedPositions = prevPortfolio.stakedPositions.map((pos) => {
          if (pos.status !== 'active') return pos;
          // Accrue fractional reward for 4 seconds
          const annualReward = (pos.amount * pos.apy) / 100;
          const deltaReward = annualReward * (4 / (365 * 86400));
          return {
            ...pos,
            accruedRewards: pos.accruedRewards + deltaReward,
          };
        });

        return {
          ...prevPortfolio,
          stakedPositions: updatedPositions,
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Compute live portfolio metrics
  const metrics = useMemo(() => {
    return calculatePortfolioMetrics(portfolio, assets);
  }, [portfolio, assets]);

  // Handler: Execute Buy / Sell / Swap
  const handleExecuteTrade = (trade: {
    type: 'BUY' | 'SELL' | 'SWAP';
    assetId: string;
    toAssetId?: string;
    amount: number;
    toAmount?: number;
    pricePerUnit: number;
    totalUsd: number;
  }) => {
    setPortfolio((prev) => {
      const newCash = 
        trade.type === 'BUY'
          ? prev.cashBalance - trade.totalUsd
          : trade.type === 'SELL'
          ? prev.cashBalance + trade.totalUsd
          : prev.cashBalance;

      const newHoldings = { ...prev.holdings };

      if (trade.type === 'BUY') {
        const existing = newHoldings[trade.assetId] || { assetId: trade.assetId, amount: 0, avgBuyPrice: trade.pricePerUnit };
        const totalAmount = existing.amount + trade.amount;
        const totalCost = (existing.amount * existing.avgBuyPrice) + trade.totalUsd;
        newHoldings[trade.assetId] = {
          assetId: trade.assetId,
          amount: totalAmount,
          avgBuyPrice: totalAmount > 0 ? totalCost / totalAmount : trade.pricePerUnit,
        };
      } else if (trade.type === 'SELL') {
        const existing = newHoldings[trade.assetId];
        if (existing) {
          const remaining = Math.max(0, existing.amount - trade.amount);
          newHoldings[trade.assetId] = {
            ...existing,
            amount: remaining,
          };
        }
      } else if (trade.type === 'SWAP' && trade.toAssetId && trade.toAmount) {
        // Deduct source
        const sourceExisting = newHoldings[trade.assetId];
        if (sourceExisting) {
          newHoldings[trade.assetId] = {
            ...sourceExisting,
            amount: Math.max(0, sourceExisting.amount - trade.amount),
          };
        }
        // Add target
        const targetExisting = newHoldings[trade.toAssetId] || { assetId: trade.toAssetId, amount: 0, avgBuyPrice: trade.pricePerUnit };
        const targetAsset = assets.find((a) => a.id === trade.toAssetId);
        const targetPrice = targetAsset?.price || 1;
        newHoldings[trade.toAssetId] = {
          assetId: trade.toAssetId,
          amount: targetExisting.amount + trade.toAmount,
          avgBuyPrice: targetPrice,
        };
      }

      const newTransaction: Transaction = {
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: trade.type,
        assetId: trade.assetId,
        toAssetId: trade.toAssetId,
        amount: trade.amount,
        toAmount: trade.toAmount,
        pricePerUnit: trade.pricePerUnit,
        totalUsd: trade.totalUsd,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: generateTxHash(),
      };

      return {
        ...prev,
        cashBalance: Math.max(0, newCash),
        holdings: newHoldings,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  };

  // Handler: Stake an Asset
  const handleStakeAsset = (stake: {
    assetId: string;
    amount: number;
    apy: number;
    lockPeriodDays: number;
  }) => {
    setPortfolio((prev) => {
      const currentHolding = prev.holdings[stake.assetId];
      if (!currentHolding || currentHolding.amount < stake.amount) return prev;

      const newHoldings = { ...prev.holdings };
      newHoldings[stake.assetId] = {
        ...currentHolding,
        amount: currentHolding.amount - stake.amount,
      };

      const asset = assets.find((a) => a.id === stake.assetId);
      const price = asset?.price || 1;

      const newPosition = {
        id: `stake-${Date.now()}`,
        assetId: stake.assetId,
        amount: stake.amount,
        apy: stake.apy,
        lockPeriodDays: stake.lockPeriodDays,
        startDate: new Date().toISOString(),
        accruedRewards: 0,
        status: 'active' as const,
      };

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'STAKE',
        assetId: stake.assetId,
        amount: stake.amount,
        pricePerUnit: price,
        totalUsd: stake.amount * price,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: generateTxHash(),
        notes: `${stake.lockPeriodDays === 0 ? 'Flexible' : `${stake.lockPeriodDays}D Lock`} @ ${stake.apy}% APY`,
      };

      return {
        ...prev,
        holdings: newHoldings,
        stakedPositions: [newPosition, ...prev.stakedPositions],
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // Handler: Unstake Asset
  const handleUnstakeAsset = (positionId: string) => {
    setPortfolio((prev) => {
      const position = prev.stakedPositions.find((p) => p.id === positionId);
      if (!position) return prev;

      const asset = assets.find((a) => a.id === position.assetId);
      const price = asset?.price || 1;
      const totalReturned = position.amount + position.accruedRewards;

      const newHoldings = { ...prev.holdings };
      const currentHolding = newHoldings[position.assetId] || {
        assetId: position.assetId,
        amount: 0,
        avgBuyPrice: price,
      };

      newHoldings[position.assetId] = {
        ...currentHolding,
        amount: currentHolding.amount + totalReturned,
      };

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'UNSTAKE',
        assetId: position.assetId,
        amount: totalReturned,
        pricePerUnit: price,
        totalUsd: totalReturned * price,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: generateTxHash(),
        notes: `Principal ${position.amount} + Yield ${position.accruedRewards.toFixed(4)}`,
      };

      return {
        ...prev,
        holdings: newHoldings,
        stakedPositions: prev.stakedPositions.filter((p) => p.id !== positionId),
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // Handler: Claim Staking Rewards
  const handleClaimRewards = (positionId: string) => {
    setPortfolio((prev) => {
      const position = prev.stakedPositions.find((p) => p.id === positionId);
      if (!position || position.accruedRewards <= 0) return prev;

      const asset = assets.find((a) => a.id === position.assetId);
      const price = asset?.price || 1;
      const rewardAmount = position.accruedRewards;

      const newHoldings = { ...prev.holdings };
      const currentHolding = newHoldings[position.assetId] || {
        assetId: position.assetId,
        amount: 0,
        avgBuyPrice: price,
      };

      newHoldings[position.assetId] = {
        ...currentHolding,
        amount: currentHolding.amount + rewardAmount,
      };

      const updatedPositions = prev.stakedPositions.map((p) =>
        p.id === positionId ? { ...p, accruedRewards: 0 } : p
      );

      return {
        ...prev,
        holdings: newHoldings,
        stakedPositions: updatedPositions,
      };
    });
  };

  // Handler: Invest in Bundle
  const handleInvestInBundle = (bundleId: string, totalUsd: number) => {
    const bundle = INDEX_BUNDLES.find((b) => b.id === bundleId);
    if (!bundle || totalUsd > portfolio.cashBalance) return;

    setPortfolio((prev) => {
      const newCash = prev.cashBalance - totalUsd;
      const newHoldings = { ...prev.holdings };
      const newTxs: Transaction[] = [];

      bundle.components.forEach((comp) => {
        const asset = assets.find((a) => a.id === comp.assetId);
        if (!asset) return;

        const allocatedUsd = (totalUsd * comp.weightPercent) / 100;
        const units = asset.price > 0 ? allocatedUsd / asset.price : 0;

        const current = newHoldings[comp.assetId] || {
          assetId: comp.assetId,
          amount: 0,
          avgBuyPrice: asset.price,
        };

        const totalAmount = current.amount + units;
        const totalCost = (current.amount * current.avgBuyPrice) + allocatedUsd;

        newHoldings[comp.assetId] = {
          assetId: comp.assetId,
          amount: totalAmount,
          avgBuyPrice: totalAmount > 0 ? totalCost / totalAmount : asset.price,
        };

        newTxs.push({
          id: `tx-${Date.now()}-${comp.assetId}`,
          type: 'BUY',
          assetId: comp.assetId,
          amount: units,
          pricePerUnit: asset.price,
          totalUsd: allocatedUsd,
          timestamp: new Date().toISOString(),
          status: 'completed',
          txHash: generateTxHash(),
          notes: `Index Bundle: ${bundle.name} (${comp.weightPercent}%)`,
        });
      });

      return {
        ...prev,
        cashBalance: Math.max(0, newCash),
        holdings: newHoldings,
        transactions: [...newTxs, ...prev.transactions],
      };
    });
  };

  // Handler: Deposit Funds
  const handleDepositFunds = (amountUsd: number) => {
    setPortfolio((prev) => {
      const newCash = prev.cashBalance + amountUsd;
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'DEPOSIT',
        assetId: 'usdc',
        amount: amountUsd,
        pricePerUnit: 1.0,
        totalUsd: amountUsd,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: generateTxHash(),
        notes: 'Deposit / Demo Account Top-up',
      };

      return {
        ...prev,
        cashBalance: newCash,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // Handler: Send Crypto
  const handleSendCrypto = (txData: {
    assetId: string;
    recipientAddress: string;
    amount: number;
    totalUsd: number;
  }) => {
    setPortfolio((prev) => {
      const currentHolding = prev.holdings[txData.assetId];
      if (!currentHolding || currentHolding.amount < txData.amount) return prev;

      const newHoldings = { ...prev.holdings };
      newHoldings[txData.assetId] = {
        ...currentHolding,
        amount: Math.max(0, currentHolding.amount - txData.amount),
      };

      const asset = assets.find((a) => a.id === txData.assetId);

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'WITHDRAW',
        assetId: txData.assetId,
        amount: txData.amount,
        pricePerUnit: asset?.price || 1,
        totalUsd: txData.totalUsd,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: generateTxHash(),
        notes: `Transfer to ${txData.recipientAddress.slice(0, 6)}...${txData.recipientAddress.slice(-4)}`,
      };

      return {
        ...prev,
        holdings: newHoldings,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // Handler: Reset to default demo
  const handleResetDemo = () => {
    if (confirm('Reset your portfolio to initial demo state ($5,850 cash + standard crypto assets)?')) {
      setPortfolio(INITIAL_PORTFOLIO);
      setAssets(INITIAL_CRYPTO_ASSETS);
    }
  };

  const handleSelectAssetForTrade = (assetId: string, action: 'buy' | 'sell' = 'buy') => {
    setTradeAssetId(assetId);
    setTradeMode(action);
    setActiveTab('trade');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Header & Ticker */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cashBalance={portfolio.cashBalance}
        totalPortfolioValue={metrics.totalValue}
        dayGainDollar={metrics.dayGainDollar}
        dayGainPercent={metrics.dayGainPercent}
        assets={assets}
        onOpenDeposit={() => setIsDepositOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating(!isSimulating)}
        onResetDemo={handleResetDemo}
      />

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            portfolio={portfolio}
            assets={assets}
            metrics={metrics}
            onNavigate={setActiveTab}
            onSelectAssetForTrade={handleSelectAssetForTrade}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenSend={(assetId) => {
              if (assetId) setSendAssetId(assetId);
              setIsSendOpen(true);
            }}
            onOpenAssetDetail={setDetailAsset}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsView
            assets={assets}
            onSelectAssetForTrade={handleSelectAssetForTrade}
            onOpenAssetDetail={setDetailAsset}
            onNavigateToEarn={(assetId) => {
              if (assetId) setTradeAssetId(assetId);
              setActiveTab('earn');
            }}
          />
        )}

        {activeTab === 'trade' && (
          <TradeSwapView
            portfolio={portfolio}
            assets={assets}
            initialAssetId={tradeAssetId}
            initialMode={tradeMode}
            onExecuteTrade={handleExecuteTrade}
            onOpenDeposit={() => setIsDepositOpen(true)}
          />
        )}

        {activeTab === 'earn' && (
          <EarnStakingView
            portfolio={portfolio}
            assets={assets}
            onStakeAsset={handleStakeAsset}
            onUnstakeAsset={handleUnstakeAsset}
            onClaimRewards={handleClaimRewards}
          />
        )}

        {activeTab === 'bundles' && (
          <IndexBundlesView
            bundles={INDEX_BUNDLES}
            assets={assets}
            portfolio={portfolio}
            onInvestInBundle={handleInvestInBundle}
            onOpenDeposit={() => setIsDepositOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <ActivityLedgerView transactions={portfolio.transactions} />
        )}
      </main>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositFunds={handleDepositFunds}
      />

      <AssetDetailModal
        asset={detailAsset}
        onClose={() => setDetailAsset(null)}
        onTradeAsset={(id) => handleSelectAssetForTrade(id, 'buy')}
        onStakeAsset={(id) => {
          setTradeAssetId(id);
          setActiveTab('earn');
        }}
      />

      <SendCryptoModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        portfolio={portfolio}
        assets={assets}
        initialAssetId={sendAssetId}
        onSendCrypto={handleSendCrypto}
      />
    </div>
  );
}

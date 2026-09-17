import { CryptoAsset, PortfolioState } from '../types';
import { INITIAL_PORTFOLIO } from '../data/cryptoData';

const STORAGE_KEY = 'apex_crypto_portfolio_v1';

export function formatCurrency(value: number, minFractionDigits: number = 2): string {
  if (value === undefined || isNaN(value)) return '$0.00';
  if (value < 0.01 && value > 0) {
    return '$' + value.toFixed(4);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: value > 1000 ? 2 : 4,
  }).format(value);
}

export function formatCryptoAmount(amount: number, symbol: string): string {
  if (amount === undefined || isNaN(amount)) return `0 ${symbol}`;
  const formatted = amount > 1000 ? amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) :
    amount < 0.001 ? amount.toFixed(6) : amount.toFixed(4);
  return `${formatted} ${symbol}`;
}

export function formatCompactNumber(num: number): string {
  if (num === undefined || isNaN(num)) return '$0';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatPercentage(value: number): string {
  if (value === undefined || isNaN(value)) return '+0.00%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function calculatePortfolioMetrics(portfolio: PortfolioState, assets: CryptoAsset[]) {
  const assetMap = new Map<string, CryptoAsset>(assets.map((a) => [a.id, a]));

  let holdingsValue = 0;
  let totalCostBasis = 0;
  let dayGainDollar = 0;

  Object.values(portfolio.holdings).forEach((holding) => {
    const asset = assetMap.get(holding.assetId);
    if (asset && holding.amount > 0) {
      const currentVal = holding.amount * asset.price;
      const costVal = holding.amount * holding.avgBuyPrice;
      holdingsValue += currentVal;
      totalCostBasis += costVal;

      // 24h change contribution
      const assetYesterdayPrice = asset.price / (1 + asset.change24h / 100);
      dayGainDollar += currentVal - (holding.amount * assetYesterdayPrice);
    }
  });

  let stakedValue = 0;
  let pendingRewardsUsd = 0;
  portfolio.stakedPositions.forEach((pos) => {
    const asset = assetMap.get(pos.assetId);
    if (asset && pos.status === 'active') {
      const posVal = pos.amount * asset.price;
      stakedValue += posVal;
      pendingRewardsUsd += pos.accruedRewards * asset.price;

      const assetYesterdayPrice = asset.price / (1 + asset.change24h / 100);
      dayGainDollar += posVal - (pos.amount * assetYesterdayPrice);
    }
  });

  const totalValue = portfolio.cashBalance + holdingsValue + stakedValue;
  const dayGainPercent = totalValue > 0 ? (dayGainDollar / (totalValue - dayGainDollar || 1)) * 100 : 0;
  const allTimeProfitDollar = (holdingsValue - totalCostBasis) + pendingRewardsUsd;
  const allTimeProfitPercent = totalCostBasis > 0 ? (allTimeProfitDollar / totalCostBasis) * 100 : 0;

  return {
    cashBalance: portfolio.cashBalance,
    holdingsValue,
    stakedValue,
    pendingRewardsUsd,
    totalValue,
    dayGainDollar,
    dayGainPercent,
    allTimeProfitDollar,
    allTimeProfitPercent,
  };
}

export function savePortfolioToStorage(portfolio: PortfolioState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  } catch (err) {
    console.error('Failed to save portfolio to local storage', err);
  }
}

export function loadPortfolioFromStorage(): PortfolioState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.cashBalance === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse portfolio from storage, using initial', err);
  }
  return INITIAL_PORTFOLIO;
}

export type AssetCategory = 'all' | 'layer1' | 'defi' | 'ai' | 'stablecoin';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: string;
  sparkline: number[];
  category: AssetCategory;
  color: string;
  iconBg: string;
  stakingApy?: number;
  description: string;
  allTimeHigh: number;
}

export interface UserHolding {
  assetId: string;
  amount: number;
  avgBuyPrice: number;
}

export interface StakedPosition {
  id: string;
  assetId: string;
  amount: number;
  apy: number;
  lockPeriodDays: number; // 0 for Flexible, 30, 90
  startDate: string;
  accruedRewards: number;
  status: 'active' | 'completed';
}

export type TransactionType = 'BUY' | 'SELL' | 'SWAP' | 'STAKE' | 'UNSTAKE' | 'DEPOSIT' | 'WITHDRAW';

export interface Transaction {
  id: string;
  type: TransactionType;
  assetId: string;
  toAssetId?: string;
  amount: number;
  toAmount?: number;
  pricePerUnit: number;
  totalUsd: number;
  timestamp: string;
  status: 'completed' | 'pending';
  txHash: string;
  notes?: string;
}

export interface IndexBundleComponent {
  assetId: string;
  weightPercent: number;
}

export interface IndexBundle {
  id: string;
  name: string;
  symbol: string;
  description: string;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  pastReturn30d: number;
  minInvestment: number;
  components: IndexBundleComponent[];
  color: string;
  badge: string;
}

export interface PortfolioState {
  cashBalance: number; // USD
  holdings: Record<string, UserHolding>;
  stakedPositions: StakedPosition[];
  transactions: Transaction[];
}

export type NavigationTab = 'dashboard' | 'markets' | 'trade' | 'earn' | 'bundles' | 'history';
export type Timeframe = '1D' | '1W' | '1M' | '1Y' | 'ALL';

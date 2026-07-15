export type Currency = 'cny' | 'usd';
export type PlanId = 'basic' | 'advanced' | 'pro' | 'vip';
export type DataPackage = 'none' | 'pack1' | 'pack2' | 'pack3';

export type QuoteNeeds = {
  majorMedia: number;
  videoChannels: number;
  monthlyAdsWan: number;
  totalAdsWan: number;
  users: number;
  adAccounts: number;
  aiRules: number;
  scheduledReports: number;
  storageTb: number;
  youtubeChannels: number;
  subChannelApps: number;
  trialRuns: number;
  reportApi: boolean;
  attributionApi: boolean;
  trafficPool: boolean;
  autoAdCreation: boolean;
  creativeSuite: boolean;
  aiVideo: boolean;
  diagnosis: boolean;
  highFrequencyAi: boolean;
  highFrequencyAccounts: boolean;
  dataPackage: DataPackage;
};

type Plan = {
  id: PlanId;
  name: string;
  rank: number;
  price: Record<Currency, { list: number; promo: number }>;
  included: {
    majorMedia: number;
    videoChannels: number;
    monthlyAdsWan: number;
    users: number;
    adAccounts: number;
    aiRules: number;
    scheduledReports: number;
    storageTb: number;
    youtubeChannels: number;
    subChannelApps: number;
    trialRuns: number;
  };
  features: {
    advanced: boolean;
    diagnosis: boolean;
    reportApi: boolean;
    attributionApi: boolean;
    trafficPool: boolean;
  };
};

export type PriceLine = {
  id: string;
  label: string;
  detail: string;
  activityAmount: number;
  listAmount: number;
};

export type CoverageLine = {
  id: string;
  label: string;
  requested: number;
  included: number;
  extra: number;
  unit: string;
  note?: string;
};

export type QuoteOption = {
  plan: Plan;
  eligible: boolean;
  unavailableReasons: string[];
  components: PriceLine[];
  coverage: CoverageLine[];
  activityTotal: number;
  listTotal: number;
  minimumPrice: number;
  recommendedPrice: number;
};

export const DEFAULT_NEEDS: QuoteNeeds = {
  majorMedia: 2,
  videoChannels: 0,
  monthlyAdsWan: 12,
  totalAdsWan: 0,
  users: 120,
  adAccounts: 7000,
  aiRules: 0,
  scheduledReports: 0,
  storageTb: 0,
  youtubeChannels: 0,
  subChannelApps: 0,
  trialRuns: 0,
  reportApi: true,
  attributionApi: false,
  trafficPool: false,
  autoAdCreation: false,
  creativeSuite: false,
  aiVideo: false,
  diagnosis: false,
  highFrequencyAi: false,
  highFrequencyAccounts: false,
  dataPackage: 'none',
};

export const PLANS: Plan[] = [
  {
    id: 'basic', name: '基础版', rank: 0,
    price: { cny: { list: 50000, promo: 39000 }, usd: { list: 8000, promo: 5500 } },
    included: { majorMedia: 1, videoChannels: 1, monthlyAdsWan: 3, users: 25, adAccounts: 100, aiRules: 2, scheduledReports: 2, storageTb: 1, youtubeChannels: 2, subChannelApps: 2, trialRuns: 0 },
    features: { advanced: false, diagnosis: false, reportApi: false, attributionApi: false, trafficPool: false },
  },
  {
    id: 'advanced', name: '高级版', rank: 1,
    price: { cny: { list: 80000, promo: 69000 }, usd: { list: 15000, promo: 9500 } },
    included: { majorMedia: 2, videoChannels: 2, monthlyAdsWan: 5, users: 40, adAccounts: 500, aiRules: 5, scheduledReports: 5, storageTb: 5, youtubeChannels: 5, subChannelApps: 5, trialRuns: 0 },
    features: { advanced: true, diagnosis: false, reportApi: false, attributionApi: false, trafficPool: false },
  },
  {
    id: 'pro', name: '专业版', rank: 2,
    price: { cny: { list: 120000, promo: 89000 }, usd: { list: 25000, promo: 12500 } },
    included: { majorMedia: 3, videoChannels: 3, monthlyAdsWan: 7, users: 60, adAccounts: 1200, aiRules: 10, scheduledReports: 10, storageTb: 10, youtubeChannels: 10, subChannelApps: 10, trialRuns: 0 },
    features: { advanced: true, diagnosis: false, reportApi: true, attributionApi: true, trafficPool: false },
  },
  {
    id: 'vip', name: 'VIP 版', rank: 3,
    price: { cny: { list: 175000, promo: 100000 }, usd: { list: 30000, promo: 14500 } },
    included: { majorMedia: 4, videoChannels: 5, monthlyAdsWan: 10, users: 100, adAccounts: 2000, aiRules: 15, scheduledReports: 15, storageTb: 20, youtubeChannels: 15, subChannelApps: 15, trialRuns: 10 },
    features: { advanced: true, diagnosis: true, reportApi: true, attributionApi: true, trafficPool: true },
  },
];

const ADDON_PRICE: Record<string, Record<Currency, number>> = {
  majorMedia: { cny: 20000, usd: 2800 },
  monthlyAds: { cny: 10000, usd: 1400 },
  totalAds: { cny: 1000, usd: 120 },
  aiRule: { cny: 1000, usd: 140 },
  adAccount: { cny: 2500, usd: 350 },
  adAccountHigh: { cny: 5000, usd: 710 },
  scheduledReport: { cny: 800, usd: 70 },
  user: { cny: 500, usd: 70 },
  storage: { cny: 2000, usd: 280 },
  youtube: { cny: 1000, usd: 140 },
  subChannel: { cny: 1000, usd: 140 },
  trial: { cny: 1500, usd: 200 },
  reportApi: { cny: 12000, usd: 1650 },
  attributionApi: { cny: 12000, usd: 1650 },
};

const FLOW_PRICE: Record<Exclude<PlanId, 'vip'>, Record<Currency, number>> = {
  basic: { cny: 20000, usd: 2800 },
  advanced: { cny: 15000, usd: 2100 },
  pro: { cny: 10000, usd: 1400 },
};

const DATA_PACKAGES: Record<Exclude<DataPackage, 'none'>, { name: string; price: Record<Currency, number>; detail: string }> = {
  pack1: { name: '数据接入套餐一', price: { cny: 15000, usd: 2000 }, detail: '20 个指标 · 600 万行/年 · 60 天存储' },
  pack2: { name: '数据接入套餐二', price: { cny: 30000, usd: 4000 }, detail: '50 个指标 · 1,000 万行/年 · 120 天存储' },
  pack3: { name: '数据接入套餐三', price: { cny: 50000, usd: 7000 }, detail: '100 个指标 · 2,000 万行/年 · 1 年存储' },
};

const rounded = (value: number) => Math.round(value);

function evaluatePlan(plan: Plan, needs: QuoteNeeds, currency: Currency): QuoteOption {
  const unavailableReasons: string[] = [];
  const needsAdvanced = needs.autoAdCreation || needs.creativeSuite || needs.aiVideo;
  if (needsAdvanced && !plan.features.advanced) unavailableReasons.push('所选自动化/素材能力需要高级版及以上');
  if (needs.diagnosis && !plan.features.diagnosis) unavailableReasons.push('投放诊断仅 VIP 版提供');

  const components: PriceLine[] = [{
    id: 'base',
    label: `${plan.name}年费`,
    detail: `活动价 ${formatMoney(plan.price[currency].promo, currency)} · 刊例价 ${formatMoney(plan.price[currency].list, currency)}`,
    activityAmount: plan.price[currency].promo,
    listAmount: plan.price[currency].list,
  }];
  const coverage: CoverageLine[] = [];

  const addComponent = (id: string, label: string, detail: string, amount: number, listAmount = amount) => {
    if (amount <= 0 && listAmount <= 0) return;
    components.push({ id, label, detail, activityAmount: amount, listAmount });
  };

  const addUsage = (
    id: string,
    label: string,
    requested: number,
    included: number,
    unit: string,
    priceKey: keyof typeof ADDON_PRICE,
    billingUnit = 1,
  ) => {
    if (requested <= 0) return;
    const extra = Math.max(0, requested - included);
    coverage.push({ id, label, requested, included, extra, unit });
    if (extra > 0) {
      const quantity = Math.ceil(extra / billingUnit);
      const price = ADDON_PRICE[priceKey][currency] * quantity;
      addComponent(id, `${label}增购`, `${extra}${unit} · ${quantity} 个计价单位`, price);
    }
  };

  addUsage('majorMedia', '大媒体', needs.majorMedia, plan.included.majorMedia, '个', 'majorMedia');
  if (needs.videoChannels > 0) {
    coverage.push({
      id: 'videoChannels', label: '视频渠道', requested: needs.videoChannels,
      included: plan.included.videoChannels, extra: Math.max(0, needs.videoChannels - plan.included.videoChannels), unit: '个',
      note: '不计额外渠道费用，但需在套餐容量内',
    });
    if (needs.videoChannels > plan.included.videoChannels) unavailableReasons.push(`视频渠道需求 ${needs.videoChannels} 个超过套餐容量 ${plan.included.videoChannels} 个`);
  }
  addUsage('monthlyAds', '每月 Ad 创建量', needs.monthlyAdsWan, plan.included.monthlyAdsWan, '万/月', 'monthlyAds');
  if (needs.totalAdsWan > 0) {
    coverage.push({ id: 'totalAds', label: 'Ad 创建总额度', requested: needs.totalAdsWan, included: 0, extra: needs.totalAdsWan, unit: '万' });
    addComponent('totalAds', 'Ad 创建总额度', `${needs.totalAdsWan} 万个`, ADDON_PRICE.totalAds[currency] * Math.ceil(needs.totalAdsWan));
  }
  addUsage('users', '用户', needs.users, plan.included.users, '人', 'user');
  addUsage('adAccounts', '广告账户', needs.adAccounts, plan.included.adAccounts, '个', needs.highFrequencyAccounts ? 'adAccountHigh' : 'adAccount', 100);
  addUsage('aiRules', 'AI 助手规则', needs.aiRules, plan.included.aiRules, '条', 'aiRule');
  addUsage('scheduledReports', '定时报表', needs.scheduledReports, plan.included.scheduledReports, '条', 'scheduledReport');
  addUsage('storage', '素材库容量', needs.storageTb, plan.included.storageTb, 'T', 'storage');
  addUsage('youtube', 'YouTube 频道', needs.youtubeChannels, plan.included.youtubeChannels, '个', 'youtube');
  addUsage('subChannel', '子渠道报表应用', needs.subChannelApps, plan.included.subChannelApps, '个', 'subChannel');

  if (needs.reportApi && !plan.features.reportApi) addComponent('reportApi', '标准 Report API', '套餐未包含，按年加购', ADDON_PRICE.reportApi[currency]);
  if (needs.attributionApi && !plan.features.attributionApi) addComponent('attributionApi', '归因数据 API', '套餐未包含，按年加购', ADDON_PRICE.attributionApi[currency]);

  let includedTrials = plan.included.trialRuns;
  if (needs.trafficPool && !plan.features.trafficPool) {
    const amount = FLOW_PRICE[plan.id as Exclude<PlanId, 'vip'>][currency];
    addComponent('trafficPool', '流量池', `${plan.name}加购价 · 附赠 10 次一键试新`, amount);
    includedTrials += 10;
  }
  if (needs.trialRuns > 0) {
    const extraTrials = Math.max(0, needs.trialRuns - includedTrials);
    coverage.push({ id: 'trialRuns', label: 'Mintegral 一键试新', requested: needs.trialRuns, included: includedTrials, extra: extraTrials, unit: '次' });
    if (extraTrials > 0) addComponent('trialRuns', 'Mintegral 一键试新', `${extraTrials} 次额外试新`, ADDON_PRICE.trial[currency] * extraTrials);
  }

  if (needs.highFrequencyAi) {
    addComponent(
      'highFrequencyAi',
      '高频 AI 助手与数据更新',
      '套餐价格按 1.5 倍系数计费',
      plan.price[currency].promo * 0.5,
      plan.price[currency].list * 0.5,
    );
  }

  if (needs.dataPackage !== 'none') {
    const dataPackage = DATA_PACKAGES[needs.dataPackage];
    addComponent('dataPackage', dataPackage.name, dataPackage.detail, dataPackage.price[currency]);
  }

  const activityTotal = components.reduce((sum, line) => sum + line.activityAmount, 0);
  const listTotal = components.reduce((sum, line) => sum + line.listAmount, 0);

  return {
    plan,
    eligible: unavailableReasons.length === 0,
    unavailableReasons,
    components,
    coverage,
    activityTotal,
    listTotal,
    minimumPrice: rounded(listTotal * 0.6),
    recommendedPrice: rounded(listTotal * 0.9),
  };
}

export function recommendQuote(needs: QuoteNeeds, currency: Currency) {
  const options = PLANS.map((plan) => evaluatePlan(plan, needs, currency));
  const eligible = options
    .filter((option) => option.eligible)
    .sort((a, b) => a.listTotal - b.listTotal || a.components.length - b.components.length || a.plan.rank - b.plan.rank);
  const recommended = eligible[0] ?? options[options.length - 1];
  const runnerUp = eligible[1];
  const savings = runnerUp ? runnerUp.listTotal - recommended.listTotal : 0;
  const reason = eligible.length === 0
    ? '当前需求超出四档标准套餐的可售能力，请人工确认定制方案。'
    : runnerUp && savings > 0
      ? `${recommended.plan.name}满足全部需求，且刊例总价比次优方案低 ${formatMoney(savings, currency)}。`
      : `${recommended.plan.name}是满足全部必选能力的最低成本方案。`;
  return { recommended, options, reason };
}

export function formatMoney(value: number, currency: Currency) {
  return `${currency === 'cny' ? '¥' : '$'}${Math.round(value).toLocaleString(currency === 'cny' ? 'zh-CN' : 'en-US')}`;
}

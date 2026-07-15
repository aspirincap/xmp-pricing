import { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Calculator,
  Check,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

type PlanId = 'basic' | 'advanced' | 'pro' | 'vip' | 'trial';
type Market = 'cny' | 'usd';
type AddonSelection = { id: string; quantity: number };
type ImageData = { mimeType: string; data: string };
type UsageRequest = {
  channels?: number;
  monthlyAds?: number;
  users?: number;
  adAccounts?: number;
  aiRules?: number;
  scheduledReports?: number;
  storage?: number;
  youtube?: number;
  subChannels?: number;
};
type UsageBreakdown = { id: string; label: string; requested: number; included: number; extra: number; unit: string };

type Plan = {
  name: string;
  nameEn: string;
  prices: { cny: { list: number; promo: number }; usd?: { list: number; promo: number } };
};

const BASE_PLANS: Record<PlanId, Plan> = {
  basic: { name: '基础版', nameEn: 'Basic', prices: { cny: { list: 50000, promo: 39000 }, usd: { list: 8000, promo: 5500 } } },
  advanced: { name: '高级版', nameEn: 'Advanced', prices: { cny: { list: 80000, promo: 69000 }, usd: { list: 15000, promo: 9500 } } },
  pro: { name: '专业版', nameEn: 'Professional', prices: { cny: { list: 120000, promo: 89000 }, usd: { list: 25000, promo: 12500 } } },
  vip: { name: 'VIP 版', nameEn: 'VIP', prices: { cny: { list: 175000, promo: 100000 }, usd: { list: 30000, promo: 14500 } } },
  trial: { name: '仅试新版', nameEn: 'Trial only', prices: { cny: { list: 50000, promo: 40000 } } },
};

const ADDONS = [
  { id: 'channel', name: '大媒体渠道', nameEn: 'Major media channel', prices: { cny: 20000, usd: 2800 }, unit: '个大媒体', unitEn: 'major media channel' },
  { id: 'ad_creation_monthly', name: '每月 Ad 创建数量', nameEn: 'Monthly Ad creation quota', prices: { cny: 10000, usd: 1400 }, unit: '1 万个/月', unitEn: '10,000 Ads/month' },
  { id: 'ad_creation_single', name: '不过期 Ad 创建数量', nameEn: 'Non-expiring Ad creation quota', prices: { cny: 1000, usd: 120 }, unit: '1 万个', unitEn: '10,000 Ads' },
  { id: 'ai_rule', name: 'AI 助手规则', nameEn: 'AI assistant rule', prices: { cny: 1000, usd: 140 }, unit: '个规则', unitEn: 'rule' },
  { id: 'ad_account', name: '广告账户', nameEn: 'Ad accounts', prices: { cny: 2500, usd: 350 }, unit: '百个', unitEn: '100 accounts' },
  { id: 'ad_account_high', name: '广告账户（高频次）', nameEn: 'Ad accounts (high frequency)', prices: { cny: 5000, usd: 710 }, unit: '百个', unitEn: '100 accounts' },
  { id: 'schedule_report', name: '定时报表', nameEn: 'Scheduled report', prices: { cny: 800, usd: 70 }, unit: '个规则', unitEn: 'rule' },
  { id: 'user_count', name: '用户数', nameEn: 'Users', prices: { cny: 500, usd: 70 }, unit: '个用户', unitEn: 'user' },
  { id: 'storage', name: '素材库容量', nameEn: 'Creative library storage', prices: { cny: 2000, usd: 280 }, unit: 'T', unitEn: 'TB' },
  { id: 'youtube', name: 'YouTube 频道数量', nameEn: 'YouTube channels', prices: { cny: 1000, usd: 140 }, unit: '个频道', unitEn: 'channel' },
  { id: 'sub_channel', name: '子渠道报表', nameEn: 'Sub-channel reports', prices: { cny: 1000, usd: 140 }, unit: '个应用', unitEn: 'app' },
  { id: 'flow_basic', name: '流量池（基础版加购）', nameEn: 'Traffic pool (Basic)', prices: { cny: 20000, usd: 2800 }, unit: '项', unitEn: 'package' },
  { id: 'flow_adv', name: '流量池（高级版加购）', nameEn: 'Traffic pool (Advanced)', prices: { cny: 15000, usd: 2100 }, unit: '项', unitEn: 'package' },
  { id: 'flow_pro', name: '流量池（专业版加购）', nameEn: 'Traffic pool (Professional)', prices: { cny: 10000, usd: 1400 }, unit: '项', unitEn: 'package' },
  { id: 'mint_trial', name: 'Mintegral 一键试新', nameEn: 'Mintegral one-click testing', prices: { cny: 1500, usd: 200 }, unit: '次', unitEn: 'test' },
  { id: 'report_api', name: '标准 Report API', nameEn: 'Standard Report API', prices: { cny: 12000, usd: 1650 }, unit: '项', unitEn: 'package' },
  { id: 'attr_api', name: '归因数据 API 接入', nameEn: 'Attribution Data API', prices: { cny: 12000, usd: 1650 }, unit: '项', unitEn: 'package' },
] as const;

const DEDUCTIBLE_ADDONS = ADDONS.filter((item) => item.id !== 'ad_creation_single');

const PLAN_INCLUSIONS: Record<PlanId, Required<UsageRequest>> = {
  basic: { channels: 1, monthlyAds: 3, users: 25, adAccounts: 100, aiRules: 2, scheduledReports: 2, storage: 1, youtube: 2, subChannels: 2 },
  advanced: { channels: 2, monthlyAds: 5, users: 40, adAccounts: 500, aiRules: 5, scheduledReports: 5, storage: 5, youtube: 5, subChannels: 5 },
  pro: { channels: 3, monthlyAds: 7, users: 60, adAccounts: 1200, aiRules: 10, scheduledReports: 10, storage: 10, youtube: 10, subChannels: 10 },
  vip: { channels: 4, monthlyAds: 10, users: 100, adAccounts: 2000, aiRules: 15, scheduledReports: 15, storage: 20, youtube: 15, subChannels: 15 },
  trial: { channels: 0, monthlyAds: 0, users: 0, adAccounts: 0, aiRules: 0, scheduledReports: 0, storage: 0, youtube: 0, subChannels: 0 },
};

const PLAN_INCLUDED_ADDONS: Record<PlanId, string[]> = {
  basic: [],
  advanced: [],
  pro: ['report_api', 'attr_api'],
  vip: ['report_api', 'attr_api', 'flow_basic', 'flow_adv', 'flow_pro'],
  trial: [],
};

const cnNumbers: Record<string, number> = {
  一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

const currency = (value: number, market: Market) =>
  `${market === 'cny' ? '¥' : '$'}${value.toLocaleString(market === 'cny' ? 'zh-CN' : 'en-US')}`;

export default function App() {
  const [market, setMarket] = useState<Market>('cny');
  const [inputText, setInputText] = useState('XMP新签基础版+API，5W申请赠送一个大媒体。');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('basic');
  const [selectedAddons, setSelectedAddons] = useState<AddonSelection[]>([]);
  const [selectedDeductions, setSelectedDeductions] = useState<AddonSelection[]>([]);
  const [parsedUsage, setParsedUsage] = useState<UsageRequest>({});
  const [usageBreakdowns, setUsageBreakdowns] = useState<UsageBreakdown[]>([]);
  const [quotedPrices, setQuotedPrices] = useState<Record<Market, number>>({ cny: 50000, usd: 5500 });
  const [success, setSuccess] = useState(false);
  const [isAIParsing, setIsAIParsing] = useState(false);
  const [error, setError] = useState('');
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<number | undefined>(undefined);
  const quotedPrice = quotedPrices[market];
  const setQuotedPrice = (value: number) => setQuotedPrices((current) => ({ ...current, [market]: value }));
  const planLabel = (plan: Plan) => plan.name;
  const addonLabel = (addon: typeof ADDONS[number]) => addon.name;
  const addonUnit = (addon: typeof ADDONS[number]) => addon.unit;

  const summary = useMemo(() => {
    const currentPlanPrice = BASE_PLANS[selectedPlan].prices[market]?.promo ?? BASE_PLANS.basic.prices[market]!.promo;
    const addonsTotal = selectedAddons.reduce((sum, selected) => {
      const addon = ADDONS.find((item) => item.id === selected.id);
      return sum + (addon?.prices[market] ?? 0) * selected.quantity;
    }, 0);
    const deductionsTotal = selectedDeductions.reduce((sum, selected) => {
      const addon = DEDUCTIBLE_ADDONS.find((item) => item.id === selected.id);
      return sum + (addon?.prices[market] ?? 0) * selected.quantity;
    }, 0);
    const totalPrice = Math.max(0, currentPlanPrice + addonsTotal - deductionsTotal);
    const discount = totalPrice ? (quotedPrice / totalPrice) * 10 : 0;
    const monthlyAds = selectedAddons
      .filter((item) => item.id === 'ad_creation_monthly')
      .reduce((sum, item) => sum + item.quantity, 0);
    const singleAds = selectedAddons
      .filter((item) => item.id === 'ad_creation_single')
      .reduce((sum, item) => sum + item.quantity, 0);
    return { planPrice: currentPlanPrice, addonsTotal, deductionsTotal, totalPrice, discount, monthlyAds, singleAds };
  }, [market, quotedPrice, selectedAddons, selectedDeductions, selectedPlan]);

  const switchMarket = (nextMarket: Market) => {
    setMarket(nextMarket);
    if (nextMarket === 'usd' && selectedPlan === 'trial') setSelectedPlan('basic');
    setError('');
    setSuccess(false);
  };

  const flashSuccess = () => {
    window.clearTimeout(successTimer.current);
    setSuccess(true);
    successTimer.current = window.setTimeout(() => setSuccess(false), 1800);
  };

  const findQuantity = (text: string, keyword: string) => {
    const before = text.match(new RegExp(`([0-9]+|[一二两三四五六七八九十])[个项次]*(?:的)?${keyword}`, 'i'));
    const after = text.match(new RegExp(`${keyword}[*xX×]?([0-9]+|[一二两三四五六七八九十])`, 'i'));
    const raw = before?.[1] ?? after?.[1];
    if (raw) return Number.isNaN(Number(raw)) ? cnNumbers[raw] ?? 1 : Number(raw);
    return text.includes(keyword) ? 1 : 0;
  };

  const extractAdQuota = (text: string, type: 'monthly' | 'single') => {
    const marker = type === 'monthly' ? /每月|月度|\/月/i : /不过期|永久/i;
    const fragment = text
      .split(/[，,。；;\n]/)
      .find((part) => marker.test(part) && /\bads?\b|广告/i.test(part));
    if (type === 'monthly') {
      const direct = text.match(/每月\s*([0-9]+(?:\.[0-9]+)?)\s*[wW万]/i)
        ?? text.match(/([0-9]+(?:\.[0-9]+)?)\s*[wW万]\s*\/月/i);
      if (direct) return Number(direct[1]);
      const annual = text.match(/全年[^，,。；;\n]{0,20}(?:\bads?\b|广告)[^，,。；;\n]{0,15}([0-9]+(?:\.[0-9]+)?)\s*[wW万]/i);
      if (annual) return Number(annual[1]) / 12;
    }
    const match = fragment?.match(/([0-9]+(?:\.[0-9]+)?)\s*[wW万]/);
    return match ? Number(match[1]) : 0;
  };

  const extractRequestedUsage = (text: string): UsageRequest => {
    const usage: UsageRequest = {};
    const monthlyFragment = text.split(/[，,。；;\n]/).find((part) => /每月|月度|\/月|全年/i.test(part) && /\bads?\b|广告/i.test(part));
    const monthlyAds = extractAdQuota(text, 'monthly');
    if (monthlyAds && !/再加|额外|增购|加购/.test(monthlyFragment ?? '')) usage.monthlyAds = monthlyAds;

    const mediaMatch = text.match(/(大媒体数量|媒体数量)\s*[:：]?\s*([^\n，,。；;]+)/i);
    const mediaFragment = mediaMatch?.[2];
    if (mediaFragment) {
      const numeric = mediaFragment.match(/([0-9]+)/);
      if (numeric && /大媒体数量/i.test(mediaMatch?.[1] ?? '')) usage.channels = Number(numeric[1]);
      else {
        const media = new Set<string>();
        if (/\bTT\b|TikTok/i.test(mediaFragment)) media.add('tiktok');
        if (/\bFB\b|Facebook|Meta/i.test(mediaFragment)) media.add('meta');
        if (/Google/i.test(mediaFragment)) media.add('google');
        if (/Snapchat/i.test(mediaFragment)) media.add('snapchat');
        if (/Kwai/i.test(mediaFragment)) media.add('kwai');
        if (/Apple/i.test(mediaFragment)) media.add('apple');
        usage.channels = media.size;
      }
    }

    const readNumber = (pattern: RegExp) => {
      const match = text.match(pattern);
      return match ? Number(match[1].replace(/,/g, '')) : undefined;
    };
    usage.users = readNumber(/用户数(?:量)?\s*[:：]?\s*([0-9,]+)/i);
    usage.adAccounts = readNumber(/广告账[户号](?:数(?:量)?)?\s*[:：]?\s*([0-9,]+)/i);
    usage.aiRules = readNumber(/AI\s*助手规则(?:数量)?\s*[:：]?\s*([0-9,]+)/i);
    usage.scheduledReports = readNumber(/定时报表(?:数量)?\s*[:：]?\s*([0-9,]+)/i);
    usage.storage = readNumber(/素材库容量\s*[:：]?\s*([0-9,.]+)\s*T/i);
    usage.youtube = readNumber(/YouTube\s*频道(?:数量)?\s*[:：]?\s*([0-9,]+)/i);
    usage.subChannels = readNumber(/子渠道报表(?:[-—]\s*应用)?(?:数量)?\s*[:：]?\s*([0-9,]+)/i);
    return Object.fromEntries(Object.entries(usage).filter(([, value]) => value !== undefined)) as UsageRequest;
  };

  const applyPlanInclusions = (baseAddons: AddonSelection[], plan: PlanId, usage: UsageRequest) => {
    const included = PLAN_INCLUSIONS[plan];
    const includedAddonIds = new Set(PLAN_INCLUDED_ADDONS[plan]);
    const additions: AddonSelection[] = [];
    const breakdowns: UsageBreakdown[] = [];
    const controlledIds = new Set<string>();

    const addUsage = (key: keyof UsageRequest, id: string, label: string, unit: string, billingUnit = 1) => {
      const requested = usage[key];
      if (requested === undefined) return;
      controlledIds.add(id);
      const includedValue = included[key];
      const extra = Math.max(0, requested - includedValue);
      breakdowns.push({ id, label, requested, included: includedValue, extra, unit });
      if (extra > 0) additions.push({ id, quantity: Math.ceil(extra / billingUnit) });
    };

    addUsage('channels', 'channel', '大媒体数量', '个');
    addUsage('monthlyAds', 'ad_creation_monthly', '每月 Ad 数量', '万/月');
    addUsage('users', 'user_count', '用户数', '个');
    addUsage('adAccounts', 'ad_account', '广告账号', '个', 100);
    addUsage('aiRules', 'ai_rule', 'AI 助手规则', '个');
    addUsage('scheduledReports', 'schedule_report', '定时报表', '个');
    addUsage('storage', 'storage', '素材库容量', 'T');
    addUsage('youtube', 'youtube', 'YouTube 频道', '个');
    addUsage('subChannels', 'sub_channel', '子渠道报表应用', '个');

    baseAddons.filter((item) => includedAddonIds.has(item.id)).forEach((item) => {
      const addon = ADDONS.find((candidate) => candidate.id === item.id);
      if (addon) breakdowns.push({ id: `included-${item.id}`, label: addon.name, requested: item.quantity, included: item.quantity, extra: 0, unit: '项' });
    });

    return {
      addons: [...baseAddons.filter((item) => !controlledIds.has(item.id) && !includedAddonIds.has(item.id)), ...additions],
      breakdowns,
    };
  };

  const handleLocalParse = (warning = '') => {
    const text = inputText.trim();
    if (!text) {
      setError('请先输入销售报价内容。');
      return;
    }
    let plan = selectedPlan;
    if (/高级版|\badvanced\b/i.test(text)) plan = 'advanced';
    else if (/专业版|\bprofessional\b|\bpro\b/i.test(text)) plan = 'pro';
    else if (/VIP版|VIP 版|vip版|\bvip\b/i.test(text)) plan = 'vip';
    else if (/试新版/.test(text)) plan = 'trial';
    else if (/基础版|\bbasic\b/i.test(text)) plan = 'basic';
    if (market === 'usd' && plan === 'trial') plan = 'basic';

    const monthlyAdQuota = extractAdQuota(text, 'monthly');
    const singleAdQuota = extractAdQuota(text, 'single');
    const requestedUsage = extractRequestedUsage(text);
    let price = quotedPrice;
    const multipliedPrice = text.match(/(?:报价|回款|申请|quote|payment)?[^0-9$]{0,8}\$?\s*([0-9,]+(?:\.[0-9]+)?)\s*[*xX×]\s*(0?\.\d+)/i);
    const markedShorthand = text.match(/(?:报价|回款|申请|quote|payment)[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?)\s*[wW万]/i);
    const shorthand = [...text.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*[wW万]/g)].find((match) => {
      const index = match.index ?? 0;
      const nearby = text.slice(Math.max(0, index - 12), index + match[0].length + 18);
      return !(/不过期|永久|每月|月度|\/月/i.test(nearby) && /\bads?\b|广告/i.test(nearby));
    });
    const usdPrice = text.match(/\$\s*([0-9,]+(?:\.[0-9]+)?)|([0-9,]+(?:\.[0-9]+)?)\s*USD/i);
    const explicit = text.match(/(?:报价|回款|申请|quote|payment)[^0-9]{0,12}([0-9][0-9,]{2,})/i);
    if (multipliedPrice) price = Number(multipliedPrice[1].replace(/,/g, '')) * Number(multipliedPrice[2]);
    else if (market === 'usd' && usdPrice) price = Number((usdPrice[1] ?? usdPrice[2]).replace(/,/g, ''));
    else if (markedShorthand) price = Number(markedShorthand[1]) * 10000;
    else if (shorthand) price = Number(shorthand[1]) * 10000;
    else if (explicit) price = Number(explicit[1].replace(/,/g, ''));

    const addons: AddonSelection[] = [];
    if (/api/i.test(text)) addons.push({ id: /归因/.test(text) ? 'attr_api' : 'report_api', quantity: 1 });
    const channelCount = findQuantity(text, '大媒体');
    if (channelCount) addons.push({ id: 'channel', quantity: channelCount });
    if (monthlyAdQuota && requestedUsage.monthlyAds === undefined) addons.push({ id: 'ad_creation_monthly', quantity: monthlyAdQuota });
    if (singleAdQuota) addons.push({ id: 'ad_creation_single', quantity: singleAdQuota });
    const netted = applyPlanInclusions(addons, plan, requestedUsage);

    setSelectedPlan(plan);
    setSelectedAddons(netted.addons);
    setSelectedDeductions([]);
    setParsedUsage(requestedUsage);
    setUsageBreakdowns(netted.breakdowns);
    setQuotedPrice(price);
    setError(warning);
    flashSuccess();
  };

  const requiresAI = () => {
    const text = inputText.trim();
    if (imageData) return true;

    const planCount = [
      /基础版|\bbasic\b/i,
      /高级版|\badvanced\b/i,
      /专业版|\bprofessional\b|\bpro\b/i,
      /VIP版|VIP 版|vip版|\bvip\b/i,
      /试新版/,
    ].filter((pattern) => pattern.test(text)).length;
    const shorthandPrices = text.match(/([0-9]+(?:\.[0-9]+)?)\s*[wW万]/g)?.length ?? 0;
    const usdPrices = text.match(/\$\s*[0-9,]+(?:\.[0-9]+)?|[0-9,]+(?:\.[0-9]+)?\s*USD/gi)?.length ?? 0;
    const hasConversationContext = /改成|最终|最后|不要|不含|取消|还是|之前|上次|后来|重新|分别|方案[一二三123]/i.test(text);
    const hasUnsupportedAddon = /用户数|素材库|YouTube|子渠道|定时报表|广告账户|流量池|一键试新|AI助手/i.test(text);
    const isLongConversation = text.length > 180 || (text.match(/\n/g)?.length ?? 0) >= 3;

    return planCount > 1 || shorthandPrices + usdPrices > 1 || hasConversationContext || hasUnsupportedAddon || isLongConversation;
  };

  const handleSmartParse = () => {
    if (!inputText.trim() && !imageData) {
      setError('请粘贴报价文本或上传一张截图。');
      return;
    }

    if (!requiresAI()) {
      handleLocalParse();
      return;
    }

    void handleAIParse();
  };

  const callAI = async () => {
    const content: Array<Record<string, unknown>> = [];
    if (inputText.trim()) content.push({ type: 'input_text', text: `分析以下销售记录并提取报价信息：${inputText}` });
    if (imageData) {
      content.push({ type: 'input_text', text: '仔细读取这张销售聊天截图，以截图中的最终报价为准。' });
      content.push({ type: 'input_image', image_url: `data:${imageData.mimeType};base64,${imageData.data}` });
    }
    const response = await fetch('/api/ai-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructions: `你负责从销售报价中提取结构化数据。先识别套餐，再提取客户的总需求，净增购由程序计算。当前报价体系为 ${market === 'cny' ? '人民币 CNY' : '美元 USD'}。套餐 planId 只能为 basic、advanced、pro、vip${market === 'cny' ? '、trial' : ''}；加购项 id 只能为 ${ADDONS.map((item) => item.id).join('、')}。requestedUsage 可包含 channels、monthlyAds、users、adAccounts、aiRules、scheduledReports、storage、youtube、subChannels，全部填写客户要求的总量，不要预先扣减套餐额度；其中 channels 只统计需要额外付费的大媒体：Meta/Facebook、Google、TikTok、Snapchat、Kwai、Apple Ads。Mintegral、Unity、AppLovin、Liftoff 等视频渠道不计入 channels，也不能生成 channel 加购项。monthlyAds 单位为万/月。例如专业版每月需要12万，应返回 monthlyAds:12，由程序扣除专业版自带7万后加购5万。明确写“额外、再加、增购”的项目才直接放入 addons。Ad 创建数量以“万”为 quantity 单位，“50w不过期的Ad”输出 {"id":"ad_creation_single","quantity":50}，不能输出500000，也不能误认为报价金额。专业版和 VIP 已含标准 Report API 与归因 API，程序会自动抵扣。“不要、取消、不含”表示完全忽略该项目，不放入 addons，也不放入 deductions；只有明确说“从总价值减去、扣减成本”才进入 deductions，且 deductions 不能包含 ad_creation_single。price 输出最终实际报价；例如“12500*0.9”输出11250。只返回合法 JSON，不要输出 Markdown 或解释。格式：{"planId":"pro","price":11250,"requestedUsage":{"channels":2,"monthlyAds":12,"users":120,"adAccounts":7000},"addons":[],"deductions":[]}。`,
        input: [{ role: 'user', content }],
      }),
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      throw new Error(failure.error?.message || failure.error || `AI 服务请求失败（${response.status}）`);
    }
    const payload = await response.json();
    const raw = payload.output_text || payload.output
      ?.flatMap((item: any) => item.content ?? [])
      .find((item: any) => item.type === 'output_text')?.text;
    if (!raw) throw new Error('AI 未返回可用结果。');
    const cleanJson = String(raw).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson) as {
      planId?: PlanId;
      price?: number;
      requestedUsage?: UsageRequest;
      addons?: AddonSelection[];
      deductions?: AddonSelection[];
    };
  };

  const handleAIParse = async () => {
    if (!inputText.trim() && !imageData) {
      setError('请粘贴报价文本或上传一张截图。');
      return;
    }
    setIsAIParsing(true);
    setError('');
    try {
      const result = await callAI();
      const resolvedPlan = result.planId && BASE_PLANS[result.planId] && BASE_PLANS[result.planId].prices[market]
        ? result.planId
        : selectedPlan;
      setSelectedPlan(resolvedPlan);
      const monthlyQuota = extractAdQuota(inputText, 'monthly');
      const singleQuota = extractAdQuota(inputText, 'single');
      const amountCount = inputText.match(/([0-9]+(?:\.[0-9]+)?)\s*[wW万]/g)?.length ?? 0;
      const hasExplicitPriceMarker = /报价|回款|申请|quote|payment|\$|USD/i.test(inputText);
      const quotaOnlyAmount = Boolean(monthlyQuota || singleQuota) && amountCount === 1 && !hasExplicitPriceMarker;
      const multipliedPrice = inputText.match(/(?:报价|回款|申请|quote|payment)?[^0-9$]{0,8}\$?\s*([0-9,]+(?:\.[0-9]+)?)\s*[*xX×]\s*(0?\.\d+)/i);
      if (multipliedPrice) setQuotedPrice(Number(multipliedPrice[1].replace(/,/g, '')) * Number(multipliedPrice[2]));
      else if (result.price && !quotaOnlyAmount) setQuotedPrice(result.price);

      {
        const trialExcluded = /试新[^，,。；;\n]{0,10}(?:不要|取消|不含)|(?:不要|取消|不含)[^，,。；;\n]{0,10}试新/.test(inputText);
        const normalized = (Array.isArray(result.addons) ? result.addons : [])
          .filter((item) => ADDONS.some((addon) => addon.id === item.id) && !(trialExcluded && item.id === 'mint_trial'))
          .map((item) => ({
            ...item,
            quantity: ['ad_creation_monthly', 'ad_creation_single'].includes(item.id) && item.quantity >= 10000
              ? item.quantity / 10000
              : item.quantity,
          }));
        const upsertQuota = (id: string, quantity: number) => {
          if (!quantity) return;
          const existing = normalized.find((item) => item.id === id);
          if (existing) existing.quantity = quantity;
          else normalized.push({ id, quantity });
        };
        const requestedUsage = { ...(result.requestedUsage ?? {}), ...extractRequestedUsage(inputText) };
        if (requestedUsage.monthlyAds === undefined) upsertQuota('ad_creation_monthly', monthlyQuota);
        upsertQuota('ad_creation_single', singleQuota);
        const netted = applyPlanInclusions(normalized, resolvedPlan, requestedUsage);
        setSelectedAddons(netted.addons);
        setParsedUsage(requestedUsage);
        setUsageBreakdowns(netted.breakdowns);
        setSelectedDeductions((Array.isArray(result.deductions) ? result.deductions : [])
          .filter((item) => item.id !== 'ad_creation_single' && !(trialExcluded && item.id === 'mint_trial') && DEDUCTIBLE_ADDONS.some((addon) => addon.id === item.id))
          .map((item) => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) })));
      }
      flashSuccess();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'AI 解析失败';
      if (inputText.trim()) handleLocalParse(`${message}；已自动使用本地规则生成结果，请核对。`);
      else setError(`${message}，请稍后重试。`);
    } finally {
      setIsAIParsing(false);
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择 JPEG、PNG 或 WebP 图片。');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('图片不能超过 8MB。');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result);
      setImagePreview(preview);
      setImageData({ mimeType: file.type, data: preview.split(',')[1] });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageData(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateAddon = (index: number, patch: Partial<AddonSelection>) => {
    setSelectedAddons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const updateDeduction = (index: number, patch: Partial<AddonSelection>) => {
    setSelectedDeductions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const handlePlanChange = (plan: PlanId) => {
    const netted = applyPlanInclusions(selectedAddons, plan, parsedUsage);
    setSelectedPlan(plan);
    setSelectedAddons(netted.addons);
    setUsageBreakdowns(netted.breakdowns);
  };

  return (
    <main className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="workspace">
        <header className="page-header">
          <div className="brand-mark"><Calculator size={25} strokeWidth={2.2} /></div>
          <div className="heading-copy">
            <div className="eyebrow"><span /> XMP SALES TOOLKIT · 2026</div>
            <h1>报价折扣智能计算器</h1>
            <p>解析销售口径，核对活动价值，实时生成折扣推演。</p>
          </div>
          <div className="header-actions">
            <div className="currency-toggle" aria-label="切换报价币种">
              <button className={market === 'cny' ? 'active' : ''} onClick={() => switchMarket('cny')}>人民币</button>
              <button className={market === 'usd' ? 'active' : ''} onClick={() => switchMarket('usd')}>USD</button>
            </div>
            <div className="status-pill"><span className="status-dot" />{market === 'cny' ? '人民币活动价' : '美元活动价'}</div>
          </div>
        </header>

        <div className="main-grid">
          <section className="left-column">
            <article className="card parser-card">
              <div className="card-title-row">
                <div>
                  <span className="section-index">01</span>
                  <h2><Sparkles size={17} /> 销售报价内容</h2>
                  <p>粘贴文字，或上传销售聊天截图</p>
                </div>
                <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud size={16} /> 上传截图
                </button>
                <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={handleImageUpload} />
              </div>

              {imagePreview && (
                <div className="preview-wrap">
                  <img src={imagePreview} alt="销售报价截图预览" />
                  <div className="preview-label"><ImageIcon size={14} /> 截图已载入</div>
                  <button aria-label="移除截图" onClick={removeImage}><X size={15} /></button>
                </div>
              )}

              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="例如：XMP 新签基础版 + API，5W 申请赠送一个大媒体……"
              />
              {error && <div className="error-message">{error}</div>}
              <div className="action-row">
                <button className={`button primary ${success ? 'success' : ''}`} onClick={handleSmartParse} disabled={isAIParsing}>
                  {isAIParsing ? <LoaderCircle className="spin" size={17} /> : success ? <Check size={17} /> : <Sparkles size={17} />}
                  {isAIParsing ? '正在解析' : success ? '解析完成' : '智能提取'}
                </button>
              </div>
            </article>

            <article className="card details-card">
              <div className="card-title-row compact">
                <div>
                  <span className="section-index">02</span>
                  <h2>报价明细核对</h2>
                  <p>所有金额按 2026 年活动价计算</p>
                </div>
              </div>

              <div className="form-block">
                <label>套餐版本</label>
                <select value={selectedPlan} onChange={(event) => handlePlanChange(event.target.value as PlanId)}>
                  {Object.entries(BASE_PLANS).filter(([, plan]) => Boolean(plan.prices[market])).map(([id, plan]) => (
                    <option key={id} value={id}>{planLabel(plan)} · 活动价 {currency(plan.prices[market]!.promo, market)}</option>
                  ))}
                </select>
              </div>

              <div className="form-block addon-block">
                <div className="addon-heading">
                  <label>加购项 / 赠送项</label>
                  <span>{selectedAddons.length} 项</span>
                </div>
                <div className="addon-list">
                  {selectedAddons.length === 0 && <div className="empty-state">暂无加购项目，可点击下方按钮添加</div>}
                  {selectedAddons.map((selected, index) => (
                    <div className="addon-row" key={`${selected.id}-${index}`}>
                      <select value={selected.id} onChange={(event) => updateAddon(index, { id: event.target.value })}>
                        {ADDONS.map((addon) => <option key={addon.id} value={addon.id}>{addonLabel(addon)} · {currency(addon.prices[market], market)}/{addonUnit(addon)}</option>)}
                      </select>
                      <div className="quantity-field">
                        <input type="number" min="1" value={selected.quantity} onChange={(event) => updateAddon(index, { quantity: Math.max(1, Number(event.target.value) || 1) })} />
                        <span>{selected.id === 'ad_creation_monthly' ? '万/月' : selected.id === 'ad_creation_single' ? '万' : ['ad_account', 'ad_account_high'].includes(selected.id) ? '百' : '份'}</span>
                      </div>
                      <button className="icon-button danger" aria-label="删除加购项" onClick={() => setSelectedAddons((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="add-button" onClick={() => setSelectedAddons((current) => [...current, { id: 'channel', quantity: 1 }])}>
                  <Plus size={16} /> 添加一项
                </button>
              </div>

              {usageBreakdowns.length > 0 && (
                <div className="package-offset">
                  <div className="offset-heading"><Sparkles size={15} /><strong>套餐内含额度抵扣</strong></div>
                  {usageBreakdowns.map((item) => (
                    <div className="offset-row" key={item.id}>
                      <span>{item.label}</span>
                      <b>{item.requested}{item.unit} − 已含 {item.included}{item.unit} = 增购 {item.extra}{item.unit}</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-block addon-block deduction-block">
                <div className="addon-heading">
                  <label>减去项</label>
                  <span>{selectedDeductions.length} 项</span>
                </div>
                <div className="addon-list">
                  {selectedDeductions.length === 0 && <div className="empty-state deduction-empty">暂无减去项目</div>}
                  {selectedDeductions.map((selected, index) => (
                    <div className="addon-row" key={`deduction-${selected.id}-${index}`}>
                      <select value={selected.id} onChange={(event) => updateDeduction(index, { id: event.target.value })}>
                        {DEDUCTIBLE_ADDONS.map((addon) => <option key={addon.id} value={addon.id}>{addonLabel(addon)} · {currency(addon.prices[market], market)}/{addonUnit(addon)}</option>)}
                      </select>
                      <div className="quantity-field">
                        <input type="number" min="1" value={selected.quantity} onChange={(event) => updateDeduction(index, { quantity: Math.max(1, Number(event.target.value) || 1) })} />
                        <span>{selected.id === 'ad_creation_monthly' ? '万/月' : ['ad_account', 'ad_account_high'].includes(selected.id) ? '百' : '份'}</span>
                      </div>
                      <button className="icon-button danger" aria-label="删除减去项" onClick={() => setSelectedDeductions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="add-button deduction-add" onClick={() => setSelectedDeductions((current) => [...current, { id: 'channel', quantity: 1 }])}>
                  <Plus size={16} /> 添加减去项
                </button>
              </div>

              <div className="price-field">
                <div><label>申请回款总额</label><span>销售申请的最终含税金额</span></div>
                <div className="price-input"><span>{market === 'cny' ? '¥' : '$'}</span><input type="number" min="0" value={quotedPrice} onChange={(event) => setQuotedPrice(Math.max(0, Number(event.target.value) || 0))} /></div>
              </div>
            </article>
          </section>

          <aside className="result-card">
            <div className="result-topline">
              <span><ReceiptText size={18} /> 折扣测算结果</span>
              <small>实时计算</small>
            </div>
            <div className="discount-stage">
              <span className="discount-label">FINAL DISCOUNT</span>
              <div className="discount-value">{summary.discount.toFixed(2)}<small>折</small></div>
              <p>套餐活动价 + 净增购 − 减去项</p>
              <div className="discount-meter"><span style={{ width: `${Math.min(summary.discount * 10, 100)}%` }} /></div>
            </div>

            <div className="breakdown">
              <h3>计算公式与明细</h3>
              <div className="amount-row highlight"><span>实际报价金额</span><strong>{currency(quotedPrice, market)}</strong></div>
              <div className="division-line"><span>÷</span></div>
              <div className="amount-row"><span>标准活动总价值</span><strong>{currency(summary.totalPrice, market)}</strong></div>
              <div className="line-items">
                <div><span>{planLabel(BASE_PLANS[selectedPlan])}（活动价）</span><b>{currency(summary.planPrice, market)}</b></div>
                {selectedAddons.map((selected, index) => {
                  const addon = ADDONS.find((item) => item.id === selected.id);
                  if (!addon) return null;
                  const quantityText = selected.id === 'ad_creation_monthly'
                    ? `${selected.quantity} 万个/月`
                    : selected.id === 'ad_creation_single'
                      ? `${selected.quantity} 万个`
                      : ['ad_account', 'ad_account_high'].includes(selected.id)
                        ? `${selected.quantity * 100} 个`
                      : `× ${selected.quantity}`;
                  return <div key={`${selected.id}-summary-${index}`}><span>+ {addonLabel(addon)} {quantityText}</span><b>{currency(addon.prices[market] * selected.quantity, market)}</b></div>;
                })}
                {selectedDeductions.map((selected, index) => {
                  const addon = DEDUCTIBLE_ADDONS.find((item) => item.id === selected.id);
                  if (!addon) return null;
                  return <div className="deduction-line" key={`${selected.id}-deduction-summary-${index}`}><span>− {addonLabel(addon)} × {selected.quantity}</span><b>−{currency(addon.prices[market] * selected.quantity, market)}</b></div>;
                })}
              </div>
            </div>

            <div className="formula-box">
              <span>计算推演</span>
              <p>{quotedPrice.toLocaleString(market === 'cny' ? 'zh-CN' : 'en-US')} ÷ {summary.totalPrice.toLocaleString(market === 'cny' ? 'zh-CN' : 'en-US')} × 10 = <strong>{summary.discount.toFixed(2)} 折</strong></p>
            </div>

            {(summary.monthlyAds > 0 || summary.singleAds > 0) && (
              <div className="quota-box">
                <Sparkles size={15} />
                <div><strong>Ad 创建额度汇总</strong>{summary.monthlyAds > 0 && <span>周期额度 +{summary.monthlyAds} 万个/月</span>}{summary.singleAds > 0 && <span>不过期额度 +{summary.singleAds} 万个</span>}</div>
              </div>
            )}

            <div className="result-footer"><span>活动价口径 · {market.toUpperCase()}</span><a href={market === 'usd' ? 'https://help-xmp.mobvista.com/docs/xmp_price_usd' : '#'} target={market === 'usd' ? '_blank' : undefined} rel="noreferrer">{market === 'usd' ? '英文报价来源' : '报价规则'} <ArrowUpRight size={13} /></a></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

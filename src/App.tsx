import { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Database,
  ExternalLink,
  Gauge,
  Info,
  Layers3,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_NEEDS,
  PLANS,
  formatMoney,
  recommendQuote,
  type Currency,
  type DataPackage,
  type PlanId,
  type QuoteNeeds,
} from './pricing';

type PlanMode = 'auto' | PlanId;

const EMPTY_NEEDS: QuoteNeeds = {
  majorMedia: 0,
  videoChannels: 0,
  monthlyAdsWan: 0,
  totalAdsWan: 0,
  users: 0,
  adAccounts: 0,
  aiRules: 0,
  scheduledReports: 0,
  storageTb: 0,
  youtubeChannels: 0,
  subChannelApps: 0,
  trialRuns: 0,
  reportApi: false,
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

type NumberFieldProps = {
  label: string;
  hint: string;
  value: number;
  suffix: string;
  step?: number;
  onChange: (value: number) => void;
};

function NumberField({ label, hint, value, suffix, step = 1, onChange }: NumberFieldProps) {
  return (
    <label className="number-field">
      <span className="field-label">{label}</span>
      <span className="field-hint">{hint}</span>
      <span className="number-control">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        />
        <b>{suffix}</b>
      </span>
    </label>
  );
}

type ToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleCard({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button type="button" className={`feature-toggle ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-check">{checked && <Check size={13} strokeWidth={3} />}</span>
      <span><strong>{label}</strong><small>{description}</small></span>
    </button>
  );
}

export default function App() {
  const [currency, setCurrency] = useState<Currency>('usd');
  const [planMode, setPlanMode] = useState<PlanMode>('auto');
  const [needs, setNeeds] = useState<QuoteNeeds>(DEFAULT_NEEDS);

  const quote = useMemo(() => recommendQuote(needs, currency), [currency, needs]);
  const selected = planMode === 'auto'
    ? quote.recommended
    : quote.options.find((option) => option.plan.id === planMode) ?? quote.recommended;
  const selectedIsRecommended = selected.plan.id === quote.recommended.plan.id;

  const update = <K extends keyof QuoteNeeds>(key: K, value: QuoteNeeds[K]) => {
    setNeeds((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="quote-app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-symbol"><BadgeDollarSign size={27} /></div>
          <div>
            <span className="product-kicker">XMP · COMMERCIAL DESK</span>
            <h1>商务报价工作台</h1>
          </div>
        </div>
        <div className="topbar-controls">
          <div className="source-status"><span /> 2026 官方价格表</div>
          <div className="currency-switch" aria-label="选择报价币种">
            <button className={currency === 'cny' ? 'active' : ''} onClick={() => setCurrency('cny')}>人民币</button>
            <button className={currency === 'usd' ? 'active' : ''} onClick={() => setCurrency('usd')}>USD</button>
          </div>
        </div>
      </header>

      <section className="intro-strip">
        <div>
          <span className="step-tag">01 / 输入需求</span>
          <h2>让报价从需求开始，<em>不是从折扣开始。</em></h2>
          <p>系统枚举四档套餐，先抵扣套餐内含额度，再计算必要加购，推荐满足需求的最低刊例总价组合。</p>
        </div>
        <div className="intro-actions">
          <button onClick={() => setNeeds(DEFAULT_NEEDS)}><Sparkles size={15} />载入示例</button>
          <button onClick={() => setNeeds(EMPTY_NEEDS)}><RefreshCcw size={15} />清空</button>
        </div>
      </section>

      <div className="workspace-grid">
        <section className="requirements-panel">
          <div className="panel-heading">
            <div><span className="section-number">A</span><div><h3>推荐策略</h3><p>默认自动，也可锁定套餐进行模拟</p></div></div>
            <select value={planMode} onChange={(event) => setPlanMode(event.target.value as PlanMode)}>
              <option value="auto">自动推荐最优套餐</option>
              {PLANS.map((plan) => <option key={plan.id} value={plan.id}>指定 {plan.name}</option>)}
            </select>
          </div>

          <div className="input-section">
            <div className="input-section-title"><Layers3 size={16} /><span><strong>媒体与投放量</strong><small>视频渠道只校验套餐容量，不额外计费</small></span></div>
            <div className="number-grid">
              <NumberField label="大媒体" hint="Meta / Google / TikTok 等" value={needs.majorMedia} suffix="个" onChange={(value) => update('majorMedia', value)} />
              <NumberField label="视频渠道" hint="Mintegral / Unity 等" value={needs.videoChannels} suffix="个" onChange={(value) => update('videoChannels', value)} />
              <NumberField label="每月 Ad 创建量" hint="按月峰值填写" value={needs.monthlyAdsWan} suffix="万/月" step={0.1} onChange={(value) => update('monthlyAdsWan', value)} />
              <NumberField label="Ad 创建总额度" hint="非月度累计池" value={needs.totalAdsWan} suffix="万" step={0.1} onChange={(value) => update('totalAdsWan', value)} />
            </div>
          </div>

          <div className="input-section">
            <div className="input-section-title"><Users size={16} /><span><strong>账户与协作规模</strong><small>所有字段填写真实需求总量</small></span></div>
            <div className="number-grid three-column">
              <NumberField label="广告账户" hint="按百个向上计费" value={needs.adAccounts} suffix="个" onChange={(value) => update('adAccounts', value)} />
              <NumberField label="用户" hint="协作席位" value={needs.users} suffix="人" onChange={(value) => update('users', value)} />
              <NumberField label="AI 助手规则" hint="最快 15 分钟" value={needs.aiRules} suffix="条" onChange={(value) => update('aiRules', value)} />
              <NumberField label="定时报表" hint="自动发送规则" value={needs.scheduledReports} suffix="条" onChange={(value) => update('scheduledReports', value)} />
              <NumberField label="素材库容量" hint="云端素材空间" value={needs.storageTb} suffix="T" step={0.1} onChange={(value) => update('storageTb', value)} />
              <NumberField label="YouTube 频道" hint="授权频道数量" value={needs.youtubeChannels} suffix="个" onChange={(value) => update('youtubeChannels', value)} />
              <NumberField label="子渠道报表" hint="应用数量" value={needs.subChannelApps} suffix="个" onChange={(value) => update('subChannelApps', value)} />
              <NumberField label="一键试新" hint="Mintegral 次数" value={needs.trialRuns} suffix="次" onChange={(value) => update('trialRuns', value)} />
            </div>
          </div>

          <div className="input-section">
            <div className="input-section-title"><Workflow size={16} /><span><strong>功能与高级能力</strong><small>不可单独加购的能力会限定套餐档位</small></span></div>
            <div className="feature-grid">
              <ToggleCard label="标准 Report API" description="专业版 / VIP 已含" checked={needs.reportApi} onChange={(value) => update('reportApi', value)} />
              <ToggleCard label="归因数据 API" description="专业版 / VIP 已含" checked={needs.attributionApi} onChange={(value) => update('attributionApi', value)} />
              <ToggleCard label="流量池" description="VIP 已含；加购赠 10 次试新" checked={needs.trafficPool} onChange={(value) => update('trafficPool', value)} />
              <ToggleCard label="自动创建广告" description="需要高级版及以上" checked={needs.autoAdCreation} onChange={(value) => update('autoAdCreation', value)} />
              <ToggleCard label="素材编辑与推送" description="需要高级版及以上" checked={needs.creativeSuite} onChange={(value) => update('creativeSuite', value)} />
              <ToggleCard label="AI 生成视频" description="需要高级版及以上" checked={needs.aiVideo} onChange={(value) => update('aiVideo', value)} />
              <ToggleCard label="投放诊断" description="仅 VIP 提供" checked={needs.diagnosis} onChange={(value) => update('diagnosis', value)} />
              <ToggleCard label="高频 AI 与数据更新" description="套餐价格 × 1.5" checked={needs.highFrequencyAi} onChange={(value) => update('highFrequencyAi', value)} />
              <ToggleCard label="高频广告账户" description="超额账户使用高频单价" checked={needs.highFrequencyAccounts} onChange={(value) => update('highFrequencyAccounts', value)} />
            </div>
            <label className="data-package-field">
              <span><Database size={16} /><b>高级数据接入</b></span>
              <select value={needs.dataPackage} onChange={(event) => update('dataPackage', event.target.value as DataPackage)}>
                <option value="none">不需要 Postback / S2S 数据包</option>
                <option value="pack1">套餐一 · 20 指标 / 600 万行 / 60 天</option>
                <option value="pack2">套餐二 · 50 指标 / 1,000 万行 / 120 天</option>
                <option value="pack3">套餐三 · 100 指标 / 2,000 万行 / 1 年</option>
              </select>
            </label>
          </div>
        </section>

        <aside className="quote-panel">
          <div className="recommendation-head">
            <div className="recommendation-label"><Sparkles size={15} />{planMode === 'auto' ? '系统推荐' : '指定套餐模拟'}</div>
            <span className={`eligibility ${selected.eligible ? 'valid' : 'invalid'}`}>{selected.eligible ? '需求可满足' : '存在能力缺口'}</span>
          </div>
          <div className="plan-hero">
            <div><span>RECOMMENDED PLAN</span><h2>{selected.plan.name}</h2></div>
            <div className="plan-orbit">{selected.plan.rank + 1}<small>/4</small></div>
          </div>
          <p className="recommendation-reason">
            {planMode === 'auto' ? quote.reason : selectedIsRecommended ? '该指定套餐也是当前需求下的系统最优方案。' : `系统更推荐 ${quote.recommended.plan.name}，当前为手动模拟结果。`}
          </p>
          {!selected.eligible && <div className="invalid-notice"><Info size={15} /><span>{selected.unavailableReasons.join('；')}</span></div>}

          <div className="price-ladder">
            <article className="price-card minimum"><span>最低成交价</span><strong>{formatMoney(selected.minimumPrice, currency)}</strong><small>刊例总价 × 60%</small></article>
            <article className="price-card recommended"><div className="recommended-ribbon">建议对外报价</div><span>推荐报价</span><strong>{formatMoney(selected.recommendedPrice, currency)}</strong><small>刊例总价 × 90%</small></article>
            <article className="price-card list"><span>刊例总价</span><strong>{formatMoney(selected.listTotal, currency)}</strong><small>套餐刊例 + 必要加购</small></article>
          </div>

          <div className="activity-reference"><Gauge size={15} /><span>官网活动价口径参考</span><b>{formatMoney(selected.activityTotal, currency)}</b></div>

          <div className="quote-breakdown">
            <div className="breakdown-title"><div><CircleDollarSign size={17} /><span><strong>报价构成</strong><small>{selected.components.length} 个计价项目</small></span></div><b>刊例金额</b></div>
            <div className="component-list">
              {selected.components.map((line, index) => (
                <div className="component-row" key={`${line.id}-${index}`}>
                  <span className="component-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="component-copy"><strong>{line.label}</strong><small>{line.detail}</small></span>
                  <b>{formatMoney(line.listAmount, currency)}</b>
                </div>
              ))}
            </div>
          </div>

          {selected.coverage.length > 0 && (
            <div className="coverage-box">
              <div className="coverage-title"><ShieldCheck size={16} />套餐额度抵扣</div>
              {selected.coverage.map((line) => (
                <div className="coverage-row" key={line.id}>
                  <span>{line.label}{line.note && <i title={line.note}>i</i>}</span>
                  <b>{line.requested}{line.unit} − {line.included}{line.unit} = <em>{line.extra}{line.unit}</em></b>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <section className="comparison-section">
        <div className="comparison-header">
          <div><span className="step-tag">02 / 方案复核</span><h2>四档套餐横向试算</h2><p>自动推荐按刊例总价排序，再比较加购项目数与套餐档位。</p></div>
          <BarChart3 size={28} />
        </div>
        <div className="comparison-grid">
          {quote.options.map((option) => {
            const isWinner = option.plan.id === quote.recommended.plan.id;
            return (
              <article className={`comparison-card ${isWinner ? 'winner' : ''} ${!option.eligible ? 'disabled' : ''}`} key={option.plan.id}>
                <div className="comparison-card-top"><span>{option.plan.name}</span>{isWinner && <b><Sparkles size={12} />最优</b>}</div>
                <strong>{formatMoney(option.listTotal, currency)}</strong>
                <small>{option.eligible ? `${option.components.length - 1} 项加购 · 推荐价 ${formatMoney(option.recommendedPrice, currency)}` : option.unavailableReasons.join('；')}</small>
                <div className="comparison-bar"><span style={{ width: `${Math.min(100, (option.listTotal / Math.max(...quote.options.map((item) => item.listTotal))) * 100)}%` }} /></div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="app-footer">
        <div><Zap size={14} /><span>视频渠道按内部规则不加价；超过套餐容量时需升级套餐。</span></div>
        <div className="source-links">
          <a href="https://help-xmp.mobvista.com/docs/xmp_price_cny" target="_blank" rel="noreferrer">人民币报价源 <ExternalLink size={12} /></a>
          <a href="https://help-xmp.mobvista.com/docs/xmp_price_usd" target="_blank" rel="noreferrer">USD 报价源 <ExternalLink size={12} /></a>
        </div>
      </footer>
    </main>
  );
}

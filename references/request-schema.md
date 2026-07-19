# 请求结构

只把用户明确提供的数量写入 `needs`。字段缺失表示未提供；显式 `0` / `false` 表示明确不需要。不要为了补齐 JSON 而写入一组默认零值，因为明确为零可以触发减去项。

```json
{
  "currency": "usd",
  "locked_plan": null,
  "actual_quote": null,
  "deduction_mode": "auto",
  "major_media_names": ["TikTok", "Meta"],
  "video_channel_names": [],
  "needs": {
    "major_media": 2,
    "monthly_ads_wan": 12,
    "annual_ads_wan_for_reference": 144,
    "users": 120,
    "ad_accounts": 7000,
    "report_api": false,
    "trial_runs": 0
  },
  "explicit_no": ["report_api", "trial_runs"],
  "manual_deductions": []
}
```

## 顶层字段

| 字段 | 单位/取值 |
|---|---|
| `currency` | 必填：`cny` 或 `usd`；未指定时由调用方分别计算两次 |
| `locked_plan` | 可选：`basic` / `advanced` / `pro` / `vip` |
| `actual_quote` | 可选：客户已确认或商务拟报金额；例如“美金11500”写为 `11500`，未提供时保持 `null` |
| `pricing_check` | 由初始化脚本生成并保存为 `references/pricing-check.json`；正式报价复用 `status: "verified"` 的初始化快照 |
| `deduction_mode` | `auto`（默认）或 `none`；“不做减去项”必须用 `none` |
| `major_media_names` | 可选：归一化并去重后的大媒体名称，用于审计 |
| `video_channel_names` | 可选：归一化并去重后的视频渠道名称，用于审计 |

## `needs` 字段

| 字段 | 单位/取值 |
|---|---|
| `major_media` | 客户需要的大媒体总数 |
| `video_channels` | 客户需要的视频渠道总数；只校验容量，不收费 |
| `monthly_ads_wan` | 每月 Ad 创建额度，万/月 |
| `annual_ads_wan_for_reference` | 全年 Ad 创建量，万；只校验，不直接计价 |
| `non_expiring_ads_wan` | 不过期 Ad 创建总额度，万 |
| `users` | 人 |
| `ad_accounts` | 个；脚本按每 100 个向上计费 |
| `ai_rules` | 条 |
| `scheduled_reports` | 条 |
| `storage_tb` | T |
| `youtube_channels` | 个 |
| `sub_channel_apps` | 个应用 |
| `trial_runs` | 次 |
| `report_api` | 是否需要标准 Report API |
| `attribution_api` | 是否需要归因数据 API |
| `traffic_pool` | 是否需要流量池 |
| `auto_ad_creation` | 是否需要自动创建广告 |
| `creative_suite` | 是否需要素材编辑与推送 |
| `ai_video` | 是否需要 AI 视频 |
| `diagnosis` | 是否需要投放诊断 |
| `high_frequency_ai` | 是否需要最快 5 分钟的 AI/数据更新 |
| `high_frequency_accounts` | 超额广告账户是否使用高频单价 |
| `data_package` | `none` / `pack1` / `pack2` / `pack3` |

只有 `annual_ads_wan_for_reference`、没有 `monthly_ads_wan` 时，计算器返回 `needs_clarification`，不得把全年量除以 12，也不得输出正式报价。

## 实际报价金额

金额词与币种词组合时优先识别为报价，不要当作用量。例如：

```text
媒体 TT、FB；每月 12 万 Ad；120 个用户；7000 个广告账户；美金 11500
```

应设置：

```json
{"currency": "usd", "actual_quote": 11500}
```

计算器只输出“实际报价 ÷ 调整后活动价”的折扣。不要同时输出实际报价相对原活动价总价值的折扣。

## “套餐 + 加购”表达

报价组合中的加号表示增购，不表示客户总需求。例如：

```text
基础版 + API + 一个大媒体
```

应转换为：

```json
{
  "locked_plan": "basic",
  "needs": {
    "report_api": true,
    "major_media": 2
  }
}
```

基础版已含 1 个大媒体，因此“+ 一个大媒体”对应总覆盖需求 2 个。“客户使用一个大媒体”则仍是 `major_media: 1`。

## 明确不要

`explicit_no` 支持：

- `report_api`
- `attribution_api`
- `trial_runs`
- `traffic_pool`

布尔字段明确写成 `false`、或 `trial_runs` 明确写成 `0`，计算器也会识别为明确不要；建议同时写入 `explicit_no`，保留原话证据。

## 手动减去项

手动减去项中的 `quantity` 始终是真实业务数量，不是计价单位数量。例如扣减 500 个广告账户时，脚本会按 5 个“每百账户”计价单位核算。

```json
{
  "id": "users",
  "label": "商务特批用户扣减",
  "quantity": 5,
  "unit": "人",
  "reason": "客户不使用这 5 个用户席位"
}
```

`non_expiring_ads_wan` 会被脚本拒绝。相同项目已有自动减去项时，同项手动扣减也会被拒绝，以免重复扣减。

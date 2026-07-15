# XMP 商务报价工作台

需求驱动的 XMP 套餐推荐与报价系统。商务填写客户所需媒体、用量、账户规模与高级能力，系统会枚举基础版、高级版、专业版和 VIP 版，抵扣套餐内含额度后计算必要加购，并推荐刊例总价最低的有效方案。

## 报价口径

- 刊例总价：套餐刊例价 + 必要加购刊例价
- 推荐报价：刊例总价 × 90%
- 最低成交价：刊例总价 × 60%
- 官网活动价：仅作为参考，不参与套餐推荐与三档报价
- CNY 与 USD 独立计算，不进行汇率换算

价格来源：

- https://help-xmp.mobvista.com/docs/xmp_price_cny
- https://help-xmp.mobvista.com/docs/xmp_price_usd

## 本地运行

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
```

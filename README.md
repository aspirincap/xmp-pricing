# 报价折扣智能计算器

基于提供的 React 原型复刻的本地 Vite 项目，包含销售文本提取、报价截图上传、套餐与加购项核对、活动价折扣实时测算。

## 本地运行

```bash
pnpm install
pnpm dev
```

打开终端提示的本地地址即可使用。基础文本提取完全在浏览器内运行。

## 可选：启用 AI 多模态解析

复制 `.env.example` 为 `.env`，填入 AI 网关密钥：

```bash
NEWAPI_BASE_URL=https://llm-api.mobvista.com
NEWAPI_API_KEY=你的密钥
```

模型固定使用 `gpt-5.5`，浏览器通过本地 `/api/ai-parse` 代理调用，密钥不会进入前端构建产物。修改环境变量后需重启开发服务器。

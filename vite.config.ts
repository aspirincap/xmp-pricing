import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function newApiProxy(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '');

  const middleware = () => async (request: any, response: any, next: () => void) => {
    if (request.url !== '/api/ai-parse') return next();
    if (request.method !== 'POST') {
      response.statusCode = 405;
      return response.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    const apiKey = env.NEWAPI_API_KEY;
    if (!apiKey) {
      response.statusCode = 503;
      response.setHeader('Content-Type', 'application/json');
      return response.end(JSON.stringify({ error: 'AI 网关密钥尚未配置' }));
    }

    try {
      let rawBody = '';
      for await (const chunk of request) rawBody += chunk;
      const clientPayload = JSON.parse(rawBody || '{}');
      const baseUrl = (env.NEWAPI_BASE_URL || 'https://llm-api.mobvista.com').replace(/\/$/, '');
      const upstream = await fetch(`${baseUrl}/v1/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...clientPayload,
          model: 'gpt-5.5',
          stream: false,
          max_output_tokens: 1200,
        }),
      });
      const result = await upstream.text();
      response.statusCode = upstream.status;
      response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      response.end(result);
    } catch (error) {
      response.statusCode = 502;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'AI 网关请求失败' }));
    }
  };

  return {
    name: 'newapi-local-proxy',
    configureServer(server) {
      server.middlewares.use(middleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware());
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), newApiProxy(mode)],
}));

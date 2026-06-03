import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateJson, OpenRouterError } from '../openrouter-client';

const originalFetch = global.fetch;
const originalEnv = process.env.OPENROUTER_API_KEY;

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'test-key-12345';
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.OPENROUTER_API_KEY = originalEnv;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function mockFetchResponse(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'Status ' + status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  });
}

describe('generateJson — success', () => {
  it('parses JSON response', async () => {
    global.fetch = mockFetchResponse(200, {
      choices: [{ message: { content: '{"message_text":"hello"}' } }],
    });

    const result = await generateJson<{ message_text: string }>('test prompt');
    expect(result.message_text).toBe('hello');
  });

  it('passes system instruction as first message', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({ choices: [{ message: { content: '{"x":1}' } }] }),
      };
    });

    await generateJson('user prompt', 'system prompt');
    expect(capturedBody.messages[0]).toEqual({ role: 'system', content: 'system prompt' });
    expect(capturedBody.messages[1]).toEqual({ role: 'user', content: 'user prompt' });
  });

  it('sets json_object response format and correct model', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (_url, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({ choices: [{ message: { content: '{"x":1}' } }] }),
      };
    });

    await generateJson('p');
    expect(capturedBody.response_format).toEqual({ type: 'json_object' });
    expect(capturedBody.model).toBe('openrouter/gpt-oss-120b');
  });

  it('strips markdown json fences before parsing', async () => {
    global.fetch = mockFetchResponse(200, {
      choices: [{ message: { content: '```json\n{"x":42}\n```' } }],
    });
    const result = await generateJson<{ x: number }>('p');
    expect(result.x).toBe(42);
  });

  it('extracts json object from surrounding text', async () => {
    global.fetch = mockFetchResponse(200, {
      choices: [{ message: { content: 'Here is the result: {"foo":"bar"} thanks!' } }],
    });
    const result = await generateJson<{ foo: string }>('p');
    expect(result.foo).toBe('bar');
  });
});

describe('generateJson — error handling', () => {
  it('throws OpenRouterError on 401', async () => {
    global.fetch = mockFetchResponse(401, { error: 'invalid api key' });
    await expect(generateJson('p')).rejects.toThrow(OpenRouterError);
  });

  it('throws OpenRouterError on 500', async () => {
    global.fetch = mockFetchResponse(500, 'internal error');
    await expect(generateJson('p')).rejects.toThrow(OpenRouterError);
  });

  it('throws OpenRouterError on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(generateJson('p')).rejects.toThrow(OpenRouterError);
  });

  it('returns generic message in production, detailed in dev', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    global.fetch = mockFetchResponse(500, 'detailed server error stack trace');
    await expect(generateJson('p')).rejects.toThrow(/Upstream service is having issues/);
  });

  it('throws OpenRouterError on empty content', async () => {
    global.fetch = mockFetchResponse(200, { choices: [{ message: { content: '' } }] });
    await expect(generateJson('p')).rejects.toThrow(OpenRouterError);
  });

  it('throws OpenRouterError on unparseable JSON', async () => {
    global.fetch = mockFetchResponse(200, { choices: [{ message: { content: 'totally not json' } }] });
    await expect(generateJson('p')).rejects.toThrow(/invalid JSON/);
  });
});

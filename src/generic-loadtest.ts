// generic-loadtest.ts
import { performance } from "node:perf_hooks";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

interface GenericTestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string | object;
  concurrency?: number;
  durationSec?: number;
  totalRequests?: number;
  timeoutMs?: number;
  output?: string;
}

interface RequestStat {
  start: number;
  end: number;
  latency: number;
  status?: number;
  ok: boolean;
  error?: string;
  responseSize?: number;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p50Latency: number;
  p90Latency: number;
  p99Latency: number;
  minLatency: number;
  maxLatency: number;
  requestsPerSecond: number;
  statusCodes: Record<number, number>;
  errors: Record<string, number>;
  totalDuration: number;
}

function now(): number {
  return performance.now();
}

function loadConfigFile(filePath: string): GenericTestConfig {
  const fullPath = resolve(filePath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Arquivo de configuração não encontrado: ${fullPath}`);
  }

  try {
    const content = readFileSync(fullPath, "utf-8");
    const config = JSON.parse(content) as GenericTestConfig;
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Erro ao fazer parse do JSON: ${error.message}`);
    }
    throw new Error(`Erro ao ler arquivo de configuração: ${error}`);
  }
}

function validateConfig(config: GenericTestConfig): void {
  if (!config.url || typeof config.url !== "string") {
    throw new Error("url é obrigatório e deve ser uma string");
  }

  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!config.method || !validMethods.includes(config.method)) {
    throw new Error(`method deve ser um dos seguintes: ${validMethods.join(', ')}`);
  }

  if (config.durationSec && config.totalRequests) {
    throw new Error("Não é possível usar durationSec e totalRequests simultaneamente");
  }

  if (config.durationSec && (typeof config.durationSec !== "number" || config.durationSec <= 0)) {
    throw new Error("durationSec deve ser um número positivo");
  }

  if (config.totalRequests && (typeof config.totalRequests !== "number" || config.totalRequests <= 0)) {
    throw new Error("totalRequests deve ser um número positivo");
  }

  // Validação de compatibilidade método/body
  if (config.method === 'GET' && config.body) {
    console.warn("⚠️  Aviso: GET requests normalmente não devem ter body");
  }
}

function mergeConfigs(fileConfig: GenericTestConfig, cliArgs: Record<string, string>): GenericTestConfig {
  const config: GenericTestConfig = {
    url: fileConfig.url,
    method: fileConfig.method,
    headers: fileConfig.headers || {},
    body: fileConfig.body,
    concurrency: fileConfig.concurrency || 10,
    durationSec: fileConfig.durationSec,
    totalRequests: fileConfig.totalRequests,
    timeoutMs: fileConfig.timeoutMs || 10000,
    output: fileConfig.output,
  };

  // CLI args têm prioridade sobre arquivo de configuração
  if (cliArgs.url) config.url = cliArgs.url;
  if (cliArgs.method) config.method = cliArgs.method as any;
  if (cliArgs.headers) config.headers = JSON.parse(cliArgs.headers);
  if (cliArgs.body) {
    try {
      config.body = JSON.parse(cliArgs.body);
    } catch {
      config.body = cliArgs.body;
    }
  }
  if (cliArgs.concurrency) config.concurrency = Number(cliArgs.concurrency);
  if (cliArgs.duration) config.durationSec = Number(cliArgs.duration);
  if (cliArgs.totalRequests) config.totalRequests = Number(cliArgs.totalRequests);
  if (cliArgs.timeout) config.timeoutMs = Number(cliArgs.timeout);
  if (cliArgs.output) config.output = cliArgs.output;

  return config;
}

async function makeRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | object | undefined,
  timeoutMs: number,
): Promise<{ status?: number; latency: number; ok: boolean; error?: string; responseSize?: number }> {
  const start = now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    let requestBody: string | null = null;
    let requestHeaders = { ...headers };

    // Preparar body baseado no tipo
    if (body !== undefined) {
      if (typeof body === 'string') {
        requestBody = body;
      } else {
        requestBody = JSON.stringify(body);
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json';
        }
      }
    }

    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    const latency = now() - start;
    const responseText = await res.text();
    const responseSize = responseText.length;

    return {
      status: res.status,
      latency,
      ok: res.status >= 200 && res.status < 400,
      responseSize,
    };
  } catch (err: any) {
    return {
      latency: now() - start,
      ok: false,
      error: err?.name === "AbortError" ? "timeout" : err?.message || String(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? 0;
  const w = idx - lo;
  return (sorted[lo] ?? 0) * (1 - w) + (sorted[hi] ?? 0) * w;
}

function aggregateStats(stats: RequestStat[]): LoadTestResult {
  const latencies = stats.map(s => s.latency).sort((a, b) => a - b);
  const successfulRequests = stats.filter(s => s.ok).length;
  const failedRequests = stats.length - successfulRequests;
  
  const statusCodes = stats.reduce((acc: Record<number, number>, s) => {
    if (s.status) acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const errors = stats.reduce((acc: Record<string, number>, s) => {
    if (s.error) acc[s.error] = (acc[s.error] || 0) + 1;
    return acc;
  }, {});

  const totalDuration = stats.length > 0 ? (Math.max(...stats.map(s => s.end)) - Math.min(...stats.map(s => s.start))) / 1000 : 0;
  const requestsPerSecond = totalDuration > 0 ? stats.length / totalDuration : 0;

  return {
    totalRequests: stats.length,
    successfulRequests,
    failedRequests,
    averageLatency: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    p50Latency: percentile(latencies, 50),
    p90Latency: percentile(latencies, 90),
    p99Latency: percentile(latencies, 99),
    minLatency: latencies[0] || 0,
    maxLatency: latencies[latencies.length - 1] || 0,
    requestsPerSecond,
    statusCodes,
    errors,
    totalDuration,
  };
}

async function runLoadTest(config: GenericTestConfig): Promise<LoadTestResult> {
  const stats: RequestStat[] = [];
  const start = now();
  let running = true;
  let requestCount = 0;
  const workers: Promise<void>[] = [];

  async function worker(): Promise<void> {
    while (running) {
      const requestStart = now();
      const result = await makeRequest(
        config.url,
        config.method,
        config.headers || {},
        config.body,
        config.timeoutMs || 10000,
      );
      const requestEnd = now();

      stats.push({
        start: requestStart,
        end: requestEnd,
        latency: result.latency,
        status: result.status,
        ok: result.ok,
        error: result.error,
        responseSize: result.responseSize,
      });

      requestCount++;

      // Verificar limites
      if (config.totalRequests && requestCount >= config.totalRequests) {
        running = false;
        break;
      }
    }
  }

  // Iniciar workers
  for (let i = 0; i < (config.concurrency || 10); i++) {
    workers.push(worker());
  }

  // Configurar timeout se especificado
  if (config.durationSec) {
    setTimeout(() => {
      running = false;
    }, config.durationSec * 1000);
  }

  await Promise.all(workers);
  const totalTime = (now() - start) / 1000;

  const result = aggregateStats(stats);
  result.totalDuration = totalTime;

  return result;
}

function printResults(result: LoadTestResult, config: GenericTestConfig): void {
  console.log("\n=== RESULTADOS DO LOAD TEST ===");
  console.log(`URL: ${config.url}`);
  console.log(`Método: ${config.method}`);
  console.log(`Concorrência: ${config.concurrency}`);
  console.log(`Duração total: ${result.totalDuration.toFixed(2)}s`);
  console.log(`\n📊 REQUISIÇÕES:`);
  console.log(`  Total: ${result.totalRequests}`);
  console.log(`  Sucesso: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  Falhas: ${result.failedRequests} (${((result.failedRequests / result.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  RPS: ${result.requestsPerSecond.toFixed(2)}`);
  
  console.log(`\n⏱️  LATÊNCIAS (ms):`);
  console.log(`  Média: ${result.averageLatency.toFixed(2)}`);
  console.log(`  P50: ${result.p50Latency.toFixed(2)}`);
  console.log(`  P90: ${result.p90Latency.toFixed(2)}`);
  console.log(`  P99: ${result.p99Latency.toFixed(2)}`);
  console.log(`  Min: ${result.minLatency.toFixed(2)}`);
  console.log(`  Max: ${result.maxLatency.toFixed(2)}`);

  if (Object.keys(result.statusCodes).length > 0) {
    console.log(`\n📈 CÓDIGOS DE STATUS:`);
    Object.entries(result.statusCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
  }

  if (Object.keys(result.errors).length > 0) {
    console.log(`\n❌ ERROS:`);
    Object.entries(result.errors).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
  }
}

function parseArgs(): GenericTestConfig {
  const argv = process.argv.slice(2);
  const args: Record<string, string> = {};
  
  for (let i = 0; i < argv.length; i++) {
    if (argv[i]?.startsWith("--")) {
      const key = argv[i]!.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = "true";
      } else {
        args[key] = next;
        i++;
      }
    }
  }

  // Se --config foi fornecido, carregar arquivo de configuração
  if (args.config) {
    try {
      const fileConfig = loadConfigFile(args.config);
      const config = mergeConfigs(fileConfig, args);
      validateConfig(config);
      return config;
    } catch (error) {
      console.error(`Erro na configuração: ${error}`);
      process.exit(1);
    }
  }

  // Modo tradicional (apenas argumentos CLI)
  if (!args.url) {
    console.error("Use --url obrigatoriamente, ou --config <arquivo.json>");
    console.error("\nExemplos:");
    console.error("  npm run generic -- --url 'https://api.exemplo.com/users' --method GET --concurrency 20");
    console.error("  npm run generic -- --config test-config.json");
    console.error("\nArgumentos disponíveis:");
    console.error("  --url: URL do endpoint");
    console.error("  --method: GET, POST, PUT, PATCH, DELETE (default: GET)");
    console.error("  --headers: JSON com headers");
    console.error("  --body: JSON com body da requisição");
    console.error("  --concurrency: número de workers (default: 10)");
    console.error("  --duration: duração em segundos");
    console.error("  --totalRequests: número total de requisições");
    console.error("  --timeout: timeout em ms (default: 10000)");
    console.error("  --output: arquivo para salvar relatório");
    process.exit(1);
  }

  const config: GenericTestConfig = {
    url: args.url!,
    method: (args.method as any) || 'GET',
    headers: args.headers ? JSON.parse(args.headers) : {},
    body: args.body ? (() => {
      try {
        return JSON.parse(args.body);
      } catch {
        return args.body;
      }
    })() : undefined,
    concurrency: Number(args.concurrency || 10),
    durationSec: args.duration ? Number(args.duration) : undefined,
    totalRequests: args.totalRequests ? Number(args.totalRequests) : undefined,
    timeoutMs: Number(args.timeout || 10000),
    output: args.output,
  };

  validateConfig(config);
  return config;
}

async function main(): Promise<void> {
  try {
    const config = parseArgs();
    const result = await runLoadTest(config);
    
    printResults(result, config);

    if (config.output) {
      const report = {
        config,
        result,
        timestamp: new Date().toISOString(),
      };
      writeFileSync(config.output, JSON.stringify(report, null, 2), "utf-8");
      console.log(`\n📄 Relatório salvo em: ${config.output}`);
    }
  } catch (error) {
    console.error(`Erro durante o teste: ${error}`);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export type { GenericTestConfig, LoadTestResult };
export { runLoadTest, makeRequest };

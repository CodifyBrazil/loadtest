// loadtest_scenario.ts
import { performance } from "node:perf_hooks";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

interface ConfigFile {
  createUrl: string;
  messageUrl: string;
  headers?: Record<string, string>;
  createBody?: string;
  messageBodyTemplate?: string;
  messagesPerConversation?: number;
  concurrency?: number;
  durationSec?: number;
  totalConversations?: number;
  timeoutMs?: number;
  output?: string;
}

type Config = {
  createUrl: string;
  messageUrl: string;
  headers: Record<string, string>;
  createBody: string;
  messageBodyTemplate: string;
  messagesPerConversation: number;
  concurrency: number;
  durationSec?: number;
  totalConversations?: number;
  timeoutMs: number;
  output?: string;
};

type Stat = {
  type: "create" | "message";
  start: number;
  end: number;
  latency: number;
  status?: number | undefined;
  ok: boolean;
  error?: string | undefined;
};

function now(): number {
  return performance.now();
}

function loadConfigFile(filePath: string): ConfigFile {
  const fullPath = resolve(filePath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Arquivo de configuração não encontrado: ${fullPath}`);
  }

  try {
    const content = readFileSync(fullPath, "utf-8");
    const config = JSON.parse(content) as ConfigFile;
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Erro ao fazer parse do JSON: ${error.message}`);
    }
    throw new Error(`Erro ao ler arquivo de configuração: ${error}`);
  }
}

function validateConfigFile(config: ConfigFile): void {
  if (!config.createUrl || typeof config.createUrl !== "string") {
    throw new Error("createUrl é obrigatório e deve ser uma string");
  }
  
  if (!config.messageUrl || typeof config.messageUrl !== "string") {
    throw new Error("messageUrl é obrigatório e deve ser uma string");
  }

  if (config.durationSec && config.totalConversations) {
    throw new Error("Não é possível usar durationSec e totalConversations simultaneamente");
  }

  if (config.durationSec && (typeof config.durationSec !== "number" || config.durationSec <= 0)) {
    throw new Error("durationSec deve ser um número positivo");
  }

  if (config.totalConversations && (typeof config.totalConversations !== "number" || config.totalConversations <= 0)) {
    throw new Error("totalConversations deve ser um número positivo");
  }
}

function mergeConfigs(fileConfig: ConfigFile, cliArgs: Record<string, string>): Config {
  const config: Config = {
    createUrl: fileConfig.createUrl,
    messageUrl: fileConfig.messageUrl,
    headers: fileConfig.headers || {},
    createBody: fileConfig.createBody || '{"title":"nova conversa"}',
    messageBodyTemplate: fileConfig.messageBodyTemplate || '{"conversationId":"{{conversationId}}","content":"Olá!"}',
    messagesPerConversation: fileConfig.messagesPerConversation || 3,
    concurrency: fileConfig.concurrency || 10,
    durationSec: fileConfig.durationSec,
    totalConversations: fileConfig.totalConversations,
    timeoutMs: fileConfig.timeoutMs || 10000,
    output: fileConfig.output,
  };

  // CLI args têm prioridade sobre arquivo de configuração
  if (cliArgs.createUrl) config.createUrl = cliArgs.createUrl;
  if (cliArgs.messageUrl) config.messageUrl = cliArgs.messageUrl;
  if (cliArgs.headers) config.headers = JSON.parse(cliArgs.headers);
  if (cliArgs.createBody) config.createBody = cliArgs.createBody;
  if (cliArgs.messageBodyTemplate) config.messageBodyTemplate = cliArgs.messageBodyTemplate;
  if (cliArgs.messagesPerConversation) config.messagesPerConversation = Number(cliArgs.messagesPerConversation);
  if (cliArgs.concurrency) config.concurrency = Number(cliArgs.concurrency);
  if (cliArgs.duration) config.durationSec = Number(cliArgs.duration);
  if (cliArgs.totalConversations) config.totalConversations = Number(cliArgs.totalConversations);
  if (cliArgs.timeout) config.timeoutMs = Number(cliArgs.timeout);
  if (cliArgs.output) config.output = cliArgs.output;

  return config;
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

async function makeRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
  timeoutMs: number,
): Promise<{ status?: number; latency: number; ok: boolean; error?: string; json?: any }> {
  const start = now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ?? null,
      signal: controller.signal,
    });
    const latency = now() - start;
    const txt = await res.text();
    let json: any;
    try {
      json = JSON.parse(txt);
    } catch {
      json = undefined;
    }
    return {
      status: res.status,
      latency,
      ok: res.status >= 200 && res.status < 400,
      json,
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

async function runScenario(cfg: Config, stats: Stat[]) {
  const create = await makeRequest(
    cfg.createUrl,
    "POST",
    cfg.headers,
    cfg.createBody,
    cfg.timeoutMs,
  );
  stats.push({
    type: "create",
    start: 0,
    end: 0,
    latency: create.latency,
    ok: create.ok,
    status: create.status,
    error: create.error,
  });

  if (!create.ok || !create.json?.id) return; // se falhou, não prossegue

  const conversationId = create.json.id;
  for (let i = 0; i < cfg.messagesPerConversation; i++) {
    const body = cfg.messageBodyTemplate.replace(/{{conversationId}}/g, conversationId);
    const msg = await makeRequest(
      cfg.messageUrl,
      "POST",
      cfg.headers,
      body,
      cfg.timeoutMs,
    );
    stats.push({
      type: "message",
      start: 0,
      end: 0,
      latency: msg.latency,
      ok: msg.ok,
      status: msg.status,
      error: msg.error,
    });
  }
}

function aggregate(stats: Stat[], type: "create" | "message") {
  const subset = stats.filter((s) => s.type === type);
  const latencies = subset.map((s) => s.latency).sort((a, b) => a - b);
  const okCount = subset.filter((s) => s.ok).length;
  const failCount = subset.length - okCount;
  const codes = subset.reduce((acc: Record<number, number>, s) => {
    if (s.status) acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  const errors = subset.reduce((acc: Record<string, number>, s) => {
    if (s.error) acc[s.error] = (acc[s.error] || 0) + 1;
    return acc;
  }, {});

  return {
    total: subset.length,
    ok: okCount,
    fail: failCount,
    p50: percentile(latencies, 50),
    p90: percentile(latencies, 90),
    p99: percentile(latencies, 99),
    avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    min: latencies[0] || 0,
    max: latencies[latencies.length - 1] || 0,
    codes,
    errors,
  };
}

async function main(cfg: Config) {
  const stats: Stat[] = [];
  const start = now();
  let running = true;
  const workers: Promise<void>[] = [];


  async function worker() {
    while (running) {
      await runScenario(cfg, stats);
    }
  }

  for (let i = 0; i < cfg.concurrency; i++) {
    workers.push(worker());
  }

  if (cfg.durationSec) {
    setTimeout(() => (running = false), cfg.durationSec * 1000);
  } else if (cfg.totalConversations) {
    let count = 0;
    const maxConversations = cfg.totalConversations;
    const originalWorker = workers.map(async () => {
      while (running && count < maxConversations) {
        const currentCount = ++count;
        if (currentCount > maxConversations) break;
        await runScenario(cfg, stats);
      }
    });
    await Promise.all(originalWorker);
    running = false;
  }

  await Promise.all(workers);
  const totalTime = (now() - start) / 1000;

  const aggCreate = aggregate(stats, "create");
  const aggMsg = aggregate(stats, "message");

  console.log("\n=== RESULTADOS FINAIS ===");
  console.log(`Tempo total: ${totalTime.toFixed(2)}s`);
  console.log(`Conversas criadas: ${aggCreate.ok}/${aggCreate.total}`);
  console.log(`Mensagens enviadas: ${aggMsg.ok}/${aggMsg.total}`);
  console.log(`Latências (ms):`);
  console.table({
    create: { p50: aggCreate.p50, p90: aggCreate.p90, p99: aggCreate.p99, avg: aggCreate.avg },
    message: { p50: aggMsg.p50, p90: aggMsg.p90, p99: aggMsg.p99, avg: aggMsg.avg },
  });

  if (cfg.output) {
    writeFileSync(
      cfg.output,
      JSON.stringify({ cfg, aggCreate, aggMsg, stats }, null, 2),
      "utf-8",
    );
    console.log(`Relatório salvo em ${cfg.output}`);
  }
}

// --- CLI com suporte a arquivo de configuração ---
function parseArgs(): Config {
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
      validateConfigFile(fileConfig);
      const config = mergeConfigs(fileConfig, args);
      
      // Validação final
      if (!config.createUrl || !config.messageUrl) {
        throw new Error("createUrl e messageUrl são obrigatórios");
      }
      
      return config;
    } catch (error) {
      console.error(`Erro na configuração: ${error}`);
      process.exit(1);
    }
  }

  // Modo tradicional (apenas argumentos CLI)
  if (!args.createUrl || !args.messageUrl) {
    console.error("Use --createUrl e --messageUrl obrigatoriamente, ou --config <arquivo.json>");
    console.error("\nExemplos:");
    console.error("  npm start -- --createUrl '...' --messageUrl '...'");
    console.error("  npm start -- --config config.json");
    process.exit(1);
  }

  return {
    createUrl: args.createUrl!,
    messageUrl: args.messageUrl!,
    headers: args.headers ? JSON.parse(args.headers) : {},
    createBody: args.createBody || '{"title":"nova conversa"}',
    messageBodyTemplate:
      args.messageBodyTemplate ||
      '{"conversationId":"{{conversationId}}","content":"Olá!"}',
    messagesPerConversation: Number(args.messagesPerConversation || 3),
    concurrency: Number(args.concurrency || 10),
    durationSec: args.duration ? Number(args.duration) : undefined,
    totalConversations: args.totalConversations
      ? Number(args.totalConversations)
      : undefined,
    timeoutMs: Number(args.timeout || 10000),
    output: args.output,
  };
}

(async () => {
  const cfg = parseArgs();
  await main(cfg);
})();

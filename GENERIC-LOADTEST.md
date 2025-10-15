# Generic Load Test Tool

Sistema genérico e flexível para testes de carga em qualquer API HTTP, suportando todos os métodos HTTP (GET, POST, PUT, PATCH, DELETE) com configuração dinâmica.

## 🚀 Características

- **Métodos HTTP**: GET, POST, PUT, PATCH, DELETE
- **Configuração flexível**: Via arquivo JSON ou argumentos CLI
- **Body dinâmico**: Suporte a JSON, form-data, strings
- **Headers customizáveis**: Qualquer header HTTP
- **Múltiplos cenários**: Duração fixa ou número de requisições
- **Estatísticas detalhadas**: Latências, percentis, códigos de status
- **Relatórios**: Exportação para JSON

## 📦 Instalação

```bash
npm install
npm run build
```

## 🎯 Uso Rápido

### Via CLI (Argumentos)
```bash
# Teste GET simples
npm run generic -- --url "https://api.exemplo.com/users" --method GET --concurrency 20 --duration 30

# Teste POST com JSON
npm run generic -- --url "https://api.exemplo.com/posts" --method POST --body '{"title":"Test","content":"Hello"}' --concurrency 15 --totalRequests 1000

# Teste com headers customizados
npm run generic -- --url "https://api.exemplo.com/data" --method GET --headers '{"Authorization":"Bearer token123"}' --concurrency 25
```

### Via Arquivo de Configuração
```bash
# Usando arquivo JSON
npm run generic -- --config config-examples/api-get.json
```

## ⚙️ Configuração

### Estrutura do Arquivo JSON
```json
{
  "url": "https://api.exemplo.com/endpoint",
  "method": "GET|POST|PUT|PATCH|DELETE",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token"
  },
  "body": "string ou objeto JSON",
  "concurrency": 20,
  "durationSec": 60,
  "totalRequests": 1000,
  "timeoutMs": 10000,
  "output": "results/meu-teste.json"
}
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `url` | string | ✅ | URL do endpoint |
| `method` | string | ✅ | Método HTTP (GET, POST, PUT, PATCH, DELETE) |
| `headers` | object | ❌ | Headers HTTP customizados |
| `body` | string/object | ❌ | Body da requisição |
| `concurrency` | number | ❌ | Número de workers (default: 10) |
| `durationSec` | number | ❌ | Duração em segundos |
| `totalRequests` | number | ❌ | Número total de requisições |
| `timeoutMs` | number | ❌ | Timeout em ms (default: 10000) |
| `output` | string | ❌ | Arquivo para salvar relatório |

**Nota**: Use `durationSec` OU `totalRequests`, não ambos.

## 📋 Exemplos Práticos

### 1. Teste de API REST (GET)
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts",
  "method": "GET",
  "headers": {
    "User-Agent": "LoadTest/1.0",
    "Accept": "application/json"
  },
  "concurrency": 20,
  "durationSec": 30,
  "timeoutMs": 5000
}
```

### 2. Teste de Criação (POST)
```json
{
  "url": "https://api.exemplo.com/posts",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer seu-token"
  },
  "body": {
    "title": "Test Post",
    "content": "Conteúdo do post",
    "author": "LoadTest"
  },
  "concurrency": 15,
  "totalRequests": 1000,
  "timeoutMs": 8000
}
```

### 3. Teste de Atualização (PUT)
```json
{
  "url": "https://api.exemplo.com/posts/1",
  "method": "PUT",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer seu-token"
  },
  "body": {
    "id": 1,
    "title": "Post Atualizado",
    "content": "Conteúdo atualizado"
  },
  "concurrency": 10,
  "durationSec": 60
}
```

### 4. Teste de Form Data
```json
{
  "url": "https://api.exemplo.com/upload",
  "method": "POST",
  "headers": {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  "body": "name=TestUser&email=test@example.com&file=test.txt",
  "concurrency": 20,
  "durationSec": 45
}
```

### 5. Teste de Stress
```json
{
  "url": "https://api.exemplo.com/heavy-endpoint",
  "method": "GET",
  "concurrency": 50,
  "durationSec": 120,
  "timeoutMs": 15000
}
```

## 📊 Interpretando Resultados

### Métricas Principais
- **Total Requests**: Número total de requisições
- **Sucesso/Falhas**: Taxa de sucesso em %
- **RPS**: Requisições por segundo
- **Latências**: Média, P50, P90, P99, Min, Max

### Códigos de Status
- **2xx**: Sucesso
- **4xx**: Erro do cliente
- **5xx**: Erro do servidor

### Exemplo de Saída
```
=== RESULTADOS DO LOAD TEST ===
URL: https://api.exemplo.com/users
Método: GET
Concorrência: 20
Duração total: 30.00s

📊 REQUISIÇÕES:
  Total: 1500
  Sucesso: 1485 (99.0%)
  Falhas: 15 (1.0%)
  RPS: 50.00

⏱️ LATÊNCIAS (ms):
  Média: 245.50
  P50: 200.00
  P90: 450.00
  P99: 800.00
  Min: 120.00
  Max: 1200.00

📈 CÓDIGOS DE STATUS:
  200: 1485
  500: 15
```

## 🔧 Argumentos CLI Completos

```bash
npm run generic -- \
  --url "https://api.exemplo.com/endpoint" \
  --method POST \
  --headers '{"Content-Type":"application/json","Authorization":"Bearer token"}' \
  --body '{"data":"value"}' \
  --concurrency 25 \
  --duration 60 \
  --timeout 5000 \
  --output "results/meu-teste.json"
```

## 🎯 Casos de Uso

### Teste de Performance
- **Objetivo**: Verificar latência e throughput
- **Configuração**: Alta concorrência, duração fixa
- **Métricas**: P90, P99, RPS

### Teste de Stress
- **Objetivo**: Encontrar limites do sistema
- **Configuração**: Concorrência crescente
- **Métricas**: Taxa de erro, degradação

### Teste de Volume
- **Objetivo**: Processar grande volume de dados
- **Configuração**: Muitas requisições, concorrência moderada
- **Métricas**: Total processado, tempo total

### Teste de Autenticação
- **Objetivo**: Validar endpoints protegidos
- **Configuração**: Headers de auth, baixa concorrência
- **Métricas**: Taxa de sucesso, códigos 401/403

## 🚨 Boas Práticas

1. **Comece pequeno**: Teste com baixa concorrência primeiro
2. **Monitore o servidor**: Use ferramentas de monitoramento
3. **Teste gradualmente**: Aumente carga progressivamente
4. **Documente resultados**: Salve relatórios para comparação
5. **Teste diferentes cenários**: GET, POST, PUT, DELETE
6. **Use timeouts apropriados**: Evite requisições que ficam "penduradas"

## 🔍 Troubleshooting

### Erro: "timeout"
- Aumente `timeoutMs`
- Verifique se o servidor está respondendo
- Reduza `concurrency`

### Erro: "ECONNREFUSED"
- Verifique se a URL está correta
- Confirme se o servidor está rodando
- Teste a URL manualmente

### Taxa de erro alta
- Reduza `concurrency`
- Verifique logs do servidor
- Teste com uma requisição manual primeiro

### Performance baixa
- Aumente `concurrency` gradualmente
- Verifique recursos do servidor (CPU, memória)
- Analise gargalos na rede

## 📁 Estrutura de Arquivos

```
loadtest/
├── src/
│   ├── loadtest.ts          # Script original (conversas)
│   └── generic-loadtest.ts  # Script genérico
├── config-examples/
│   ├── api-get.json         # Exemplo GET
│   ├── api-post.json        # Exemplo POST
│   ├── api-put.json         # Exemplo PUT
│   ├── stress-test.json     # Exemplo stress
│   ├── auth-api.json        # Exemplo autenticação
│   └── form-data.json       # Exemplo form data
├── results/                 # Relatórios salvos
└── GENERIC-LOADTEST.md      # Esta documentação
```

## 🎉 Pronto para Usar!

Agora você tem um sistema completo e flexível para testar qualquer API HTTP. Comece com os exemplos fornecidos e adapte conforme suas necessidades!

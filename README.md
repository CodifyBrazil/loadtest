# Load Test Tool

Ferramenta de load testing para APIs de conversação, desenvolvida em TypeScript com foco em performance e confiabilidade.

## Características

- **Teste de cenários completos**: Cria conversas e envia mensagens
- **Controle de concorrência**: Configuração flexível de workers paralelos
- **Métricas detalhadas**: Latência (p50, p90, p99), taxa de sucesso, códigos de erro
- **Múltiplos modos de execução**: Por duração ou número total de conversas
- **Relatórios exportáveis**: Saída em JSON para análise posterior

## Instalação

```bash
npm install
```

## Compilação

```bash
npm run build
```

## Uso

### Modo 1: Arquivo de Configuração (Recomendado)
```bash
npm start -- --config <arquivo.json>
```

### Modo 2: Argumentos CLI
```bash
npm start -- --createUrl "..." --messageUrl "..."
```

### Parâmetros Obrigatórios
- `--createUrl`: URL para criar conversas
- `--messageUrl`: URL para enviar mensagens
- **OU** `--config`: Arquivo de configuração JSON

### Parâmetros Opcionais
- `--headers`: Headers HTTP em JSON (padrão: `{}`)
- `--createBody`: Corpo da requisição para criar conversa (padrão: `{"title":"nova conversa"}`)
- `--messageBodyTemplate`: Template da mensagem com placeholder `{{conversationId}}` (padrão: `{"conversationId":"{{conversationId}}","content":"Olá!"}`)
- `--messagesPerConversation`: Número de mensagens por conversa (padrão: `3`)
- `--concurrency`: Número de workers paralelos (padrão: `10`)
- `--duration`: Duração em segundos (exclusivo com `--totalConversations`)
- `--totalConversations`: Número total de conversas (exclusivo com `--duration`)
- `--timeout`: Timeout em ms (padrão: `10000`)
- `--output`: Arquivo para salvar relatório JSON

### Exemplos

#### Usando arquivo de configuração (Recomendado)
```bash
# Configuração básica
npm start -- --config config-examples/basic.json

# Configuração avançada
npm start -- --config config-examples/advanced.json

# Teste de stress
npm start -- --config config-examples/stress-test.json
```

#### Sobrescrever configuração com argumentos CLI
```bash
# Usar config.json mas alterar concurrency
npm start -- --config config-examples/basic.json --concurrency 25

# Usar config.json mas alterar URLs
npm start -- --config config-examples/basic.json \
  --createUrl "https://nova-api.com/conversations" \
  --messageUrl "https://nova-api.com/messages"
```

#### Modo tradicional (argumentos CLI)
```bash
# Teste por duração (30 segundos)
npm start -- \
  --createUrl "https://api.exemplo.com/conversations" \
  --messageUrl "https://api.exemplo.com/messages" \
  --duration 30 \
  --concurrency 5

# Teste por número de conversas
npm start -- \
  --createUrl "https://api.exemplo.com/conversations" \
  --messageUrl "https://api.exemplo.com/messages" \
  --totalConversations 100 \
  --concurrency 10 \
  --messagesPerConversation 5

# Com headers personalizados
npm start -- \
  --createUrl "https://api.exemplo.com/conversations" \
  --messageUrl "https://api.exemplo.com/messages" \
  --headers '{"Authorization":"Bearer token123"}' \
  --duration 60 \
  --output "relatorio.json"
```

## Arquivos de Configuração

### Estrutura JSON
```json
{
  "createUrl": "string (obrigatório)",
  "messageUrl": "string (obrigatório)",
  "headers": "object (opcional)",
  "createBody": "string (opcional)",
  "messageBodyTemplate": "string (opcional)",
  "concurrency": "number (opcional, padrão: 10)",
  "durationSec": "number (opcional, exclusivo com totalConversations)",
  "totalConversations": "number (opcional, exclusivo com durationSec)",
  "messagesPerConversation": "number (opcional, padrão: 3)",
  "timeoutMs": "number (opcional, padrão: 10000)",
  "output": "string (opcional)"
}
```

### Exemplos Prontos
- `config-examples/basic.json` - Configuração básica
- `config-examples/advanced.json` - Configuração avançada com headers
- `config-examples/stress-test.json` - Teste de stress

### Validação Automática
- URLs obrigatórias
- Tipos de dados corretos
- Exclusividade entre `durationSec` e `totalConversations`
- Valores positivos para números
- Sintaxe JSON válida

## Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev -- --config config-examples/basic.json

# Compilar
npm run build

# Executar versão compilada
npm start -- --config config-examples/basic.json
```

## Arquitetura

O script segue princípios SOLID e Clean Code:

- **Single Responsibility**: Cada função tem uma responsabilidade específica
- **Open/Closed**: Extensível sem modificação do código existente
- **Dependency Inversion**: Abstrações não dependem de detalhes
- **Clean Code**: Nomes descritivos, early returns, tratamento de erros

### Módulos Principais

1. **Configuração**: Parsing de argumentos CLI
2. **Requisições**: Cliente HTTP com timeout e tratamento de erros
3. **Cenários**: Execução de fluxos de teste
4. **Workers**: Controle de concorrência
5. **Métricas**: Agregação e análise de resultados
6. **Relatórios**: Exportação de dados

## Métricas Coletadas

- **Latência**: p50, p90, p99, média, min, max
- **Taxa de sucesso**: Requisições bem-sucedidas vs falhas
- **Códigos de status**: Distribuição de códigos HTTP
- **Erros**: Categorização de falhas
- **Throughput**: Conversas e mensagens por segundo

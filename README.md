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

### Parâmetros Obrigatórios
- `--createUrl`: URL para criar conversas
- `--messageUrl`: URL para enviar mensagens

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

#### Teste por duração (30 segundos)
```bash
npm start -- \
  --createUrl "https://api.exemplo.com/conversations" \
  --messageUrl "https://api.exemplo.com/messages" \
  --duration 30 \
  --concurrency 5
```

#### Teste por número de conversas
```bash
npm start -- \
  --createUrl "https://api.exemplo.com/conversations" \
  --messageUrl "https://api.exemplo.com/messages" \
  --totalConversations 100 \
  --concurrency 10 \
  --messagesPerConversation 5
```

#### Com headers personalizados
```bash
npm start -- \
  --createUrl "https://api.exemplo.com/conversations" \
  --messageUrl "https://api.exemplo.com/messages" \
  --headers '{"Authorization":"Bearer token123"}' \
  --duration 60 \
  --output "relatorio.json"
```

## Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev -- --createUrl "..." --messageUrl "..."

# Compilar
npm run build

# Executar versão compilada
npm start -- --createUrl "..." --messageUrl "..."
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

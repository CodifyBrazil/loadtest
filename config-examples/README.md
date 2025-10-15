# Exemplos de Configuração

Este diretório contém exemplos de arquivos de configuração JSON para diferentes cenários de teste.

## Arquivos Disponíveis

### `basic.json`
Configuração básica para testes simples:
- 5 workers paralelos
- 30 segundos de duração
- 3 mensagens por conversa
- Timeout de 10 segundos

**Uso:**
```bash
npm start -- --config config-examples/basic.json
```

### `advanced.json`
Configuração avançada com headers personalizados:
- Headers de autenticação
- Corpo personalizado para criação de conversas
- Template de mensagem customizado
- 20 workers paralelos
- 1000 conversas totais
- 5 mensagens por conversa
- Relatório exportado

**Uso:**
```bash
npm start -- --config config-examples/advanced.json
```

### `stress-test.json`
Configuração para testes de stress:
- 50 workers paralelos
- 5 minutos de duração
- 10 mensagens por conversa
- Timeout reduzido (5 segundos)
- Headers de stress test

**Uso:**
```bash
npm start -- --config config-examples/stress-test.json
```

## Estrutura da Configuração

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

## Merge com Argumentos CLI

Argumentos da linha de comando sempre têm prioridade sobre o arquivo de configuração:

```bash
# Usar config.json mas sobrescrever concurrency
npm start -- --config config.json --concurrency 25

# Usar config.json mas sobrescrever URLs
npm start -- --config config.json --createUrl "https://nova-api.com/conversations" --messageUrl "https://nova-api.com/messages"
```

## Validação

O sistema valida automaticamente:
- URLs obrigatórias
- Tipos de dados corretos
- Exclusividade entre `durationSec` e `totalConversations`
- Valores positivos para números
- Sintaxe JSON válida

# 🚀 Exemplo Prático - Como Usar o Generic Load Test

## Teste Rápido com API Pública

Vamos testar a API do JSONPlaceholder (https://jsonplaceholder.typicode.com) que é gratuita e perfeita para testes:

### 1. Teste GET Simples
```bash
npm run generic -- --url "https://jsonplaceholder.typicode.com/posts" --method GET --concurrency 10 --duration 10
```

### 2. Teste POST com JSON
```bash
npm run generic -- --url "https://jsonplaceholder.typicode.com/posts" --method POST --body '{"title":"Test Post","body":"This is a test","userId":1}' --concurrency 5 --totalRequests 50
```

### 3. Usando Arquivo de Configuração
```bash
npm run generic -- --config config-examples/api-get.json
```

## Exemplos de Configuração para Seus Serviços

### Teste de API de Usuários
```json
{
  "url": "https://sua-api.com/api/users",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer seu-token-aqui",
    "Accept": "application/json"
  },
  "concurrency": 20,
  "durationSec": 60,
  "timeoutMs": 5000,
  "output": "results/usuarios-test.json"
}
```

### Teste de Criação de Produtos
```json
{
  "url": "https://sua-api.com/api/products",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer seu-token-aqui"
  },
  "body": {
    "name": "Produto Teste",
    "price": 99.99,
    "description": "Produto criado via load test",
    "category": "test"
  },
  "concurrency": 15,
  "totalRequests": 500,
  "timeoutMs": 8000,
  "output": "results/produtos-test.json"
}
```

### Teste de Atualização
```json
{
  "url": "https://sua-api.com/api/products/1",
  "method": "PUT",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer seu-token-aqui"
  },
  "body": {
    "name": "Produto Atualizado",
    "price": 149.99,
    "description": "Produto atualizado via load test"
  },
  "concurrency": 10,
  "durationSec": 30,
  "output": "results/atualizacao-test.json"
}
```

## Interpretando os Resultados

Após executar um teste, você verá algo assim:

```
=== RESULTADOS DO LOAD TEST ===
URL: https://jsonplaceholder.typicode.com/posts
Método: GET
Concorrência: 10
Duração total: 10.00s

📊 REQUISIÇÕES:
  Total: 150
  Sucesso: 150 (100.0%)
  Falhas: 0 (0.0%)
  RPS: 15.00

⏱️ LATÊNCIAS (ms):
  Média: 245.50
  P50: 200.00
  P90: 450.00
  P99: 800.00
  Min: 120.00
  Max: 1200.00
```

### O que significa cada métrica:

- **RPS (Requests Per Second)**: Quantas requisições por segundo seu sistema consegue processar
- **P50**: 50% das requisições foram mais rápidas que este valor
- **P90**: 90% das requisições foram mais rápidas que este valor  
- **P99**: 99% das requisições foram mais rápidas que este valor
- **Taxa de Sucesso**: Percentual de requisições que retornaram 2xx

## Dicas para Seus Testes

### 1. Comece Pequeno
```bash
# Teste básico primeiro
npm run generic -- --url "sua-api.com/health" --method GET --concurrency 1 --duration 5
```

### 2. Aumente Gradualmente
```bash
# Concorrência baixa
npm run generic -- --url "sua-api.com/endpoint" --method GET --concurrency 5 --duration 30

# Concorrência média  
npm run generic -- --url "sua-api.com/endpoint" --method GET --concurrency 20 --duration 30

# Concorrência alta
npm run generic -- --url "sua-api.com/endpoint" --method GET --concurrency 50 --duration 30
```

### 3. Teste Diferentes Cenários
- **GET**: Para endpoints de leitura
- **POST**: Para criação de recursos
- **PUT**: Para atualização completa
- **PATCH**: Para atualização parcial
- **DELETE**: Para remoção de recursos

### 4. Monitore Seu Servidor
Durante os testes, monitore:
- CPU do servidor
- Memória utilizada
- Logs de erro
- Conexões de rede

## Exemplo Completo: Teste de E-commerce

Vamos simular um teste completo de uma API de e-commerce:

### 1. Teste de Listagem de Produtos (GET)
```json
{
  "url": "https://sua-api.com/api/products",
  "method": "GET",
  "headers": {
    "Accept": "application/json"
  },
  "concurrency": 30,
  "durationSec": 60,
  "output": "results/produtos-lista.json"
}
```

### 2. Teste de Busca (GET com Query)
```json
{
  "url": "https://sua-api.com/api/products?search=notebook",
  "method": "GET",
  "headers": {
    "Accept": "application/json"
  },
  "concurrency": 20,
  "durationSec": 45,
  "output": "results/busca-produtos.json"
}
```

### 3. Teste de Criação de Pedido (POST)
```json
{
  "url": "https://sua-api.com/api/orders",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token-do-usuario"
  },
  "body": {
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 2, "quantity": 1}
    ],
    "shippingAddress": {
      "street": "Rua Teste, 123",
      "city": "São Paulo",
      "zipCode": "01234-567"
    }
  },
  "concurrency": 10,
  "totalRequests": 100,
  "output": "results/criacao-pedidos.json"
}
```

## Próximos Passos

1. **Teste seus endpoints** com os exemplos acima
2. **Ajuste a concorrência** baseado nos resultados
3. **Monitore seu servidor** durante os testes
4. **Documente os resultados** para comparações futuras
5. **Crie testes automatizados** para CI/CD

Agora você tem tudo que precisa para testar qualquer API! 🎉

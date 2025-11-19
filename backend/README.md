# Flow Ops Backend

Backend API para buscar dados da API do Flow.

## Como usar

1. Configure seu token no arquivo `.env`:
```
FLOW_TOKEN=seu_token_aqui
```

2. Execute com Docker:
```bash
docker compose up --build
```

3. Acesse:
- API: http://localhost:8000
- Health: http://localhost:8000/health
- Docs: http://localhost:8000/docs

## Endpoints

### GET /api/v1/raw-data
Busca dados brutos da API do Flow.

**Parâmetros:**
- `start_date`: Data inicial (YYYY-MM-DD)
- `end_date`: Data final (YYYY-MM-DD) 
- `page`: Página (padrão: 1)
- `items_per_page`: Itens por página (padrão: 10, máximo: 100)

**Exemplo:**
```bash
curl "http://localhost:8000/api/v1/raw-data?start_date=2025-08-18&end_date=2025-11-18&page=1&items_per_page=10"
```

### GET /health
Health check do serviço.
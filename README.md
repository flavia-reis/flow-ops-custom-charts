# Flow Ops Chart Builder

Sistema completo para criação de gráficos customizados a partir dos dados do Flow Ops.

## 🚀 Funcionalidades

- ✅ **Interface Drag & Drop** para criação de gráficos
- ✅ **Múltiplos tipos de gráfico** (Bar, Line, Area, Pie, Scatter)
- ✅ **Integração com API Flow** para dados em tempo real
- ✅ **Seletor de período** com presets
- ✅ **Preview em tempo real** dos gráficos
- ✅ **Configuração avançada** (cores, legendas, grid)
- ✅ **Exportação** (PNG, PDF)
- ✅ **Responsivo** para diferentes telas

## 🏗️ Arquitetura

```
flow-ops-web/
├── backend/          # FastAPI + Python
│   ├── main.py      # API principal
│   ├── Dockerfile   # Container backend
│   └── .env         # Configurações
├── frontend/         # React + TypeScript
│   ├── src/         # Código fonte
│   ├── Dockerfile   # Container frontend
│   └── .env         # Configurações
└── docker-compose.yml # Orquestração
```

## 🚦 Como Executar

### 1. Configuração Inicial

```bash
# Clone o repositório
git clone <repo-url>
cd flow-ops-web

# Configure o token do Flow no backend
cp backend/.env.example backend/.env
# Edite backend/.env e adicione seu FLOW_TOKEN
```

### 2. Executar com Docker (Recomendado)

```bash
# Subir todos os serviços
docker-compose up --build

# Acessar aplicações
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Docs da API: http://localhost:8000/docs
```

### 3. Executar Localmente (Desenvolvimento)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

### Backend (Port 8000)

- `GET /` - Health check
- `GET /health` - Status do serviço
- `GET /api/v1/raw-data` - Buscar dados brutos
  - Parâmetros: `start_date`, `end_date`, `page`, `items_per_page`
- `GET /docs` - Documentação Swagger

### Frontend (Port 5173)

- Interface web completa para criação de gráficos

## 🎯 Como Usar

1. **Conectar à API**: O sistema verifica automaticamente a conexão com o backend
2. **Selecionar Período**: Escolha as datas ou use presets (último mês, 3 meses, etc.)
3. **Carregar Dados**: Clique em "Refresh Data" para buscar dados do Flow
4. **Criar Gráfico**:
   - Escolha o tipo de gráfico (Bar, Line, Pie, etc.)
   - Arraste campos da lista para os eixos X/Y ou Values
   - Configure cores, legendas e outros parâmetros
5. **Visualizar**: O gráfico é atualizado em tempo real
6. **Exportar**: Salve como PNG ou PDF

## 🔧 Tecnologias

**Backend:**
- FastAPI (Python)
- HTTPX para chamadas HTTP
- Docker

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Recharts (gráficos)
- React Beautiful DnD (drag & drop)
- Axios (HTTP client)
- React Hot Toast (notificações)

## 🐛 Troubleshooting

### Backend não conecta
- Verifique se o `FLOW_TOKEN` está configurado no `backend/.env`
- Teste o token manualmente com curl
- Verifique se a API Flow está acessível

### Frontend não carrega dados
- Verifique se o backend está rodando na porta 8000
- Confirme se `VITE_API_BASE_URL` está correto no `frontend/.env`
- Verifique o console do navegador para erros

### Docker não funciona
- Certifique-se que Docker e Docker Compose estão instalados
- Execute `docker-compose down` e depois `docker-compose up --build`

## 📝 Logs

Os logs são exibidos no console e incluem:
- ✅ Sucessos (conexões, dados carregados)
- ❌ Erros (falhas de API, timeouts)
- 🔍 Debug (requests, responses)

## 🚀 Deploy

Para produção, ajuste as variáveis de ambiente:
- `VITE_API_BASE_URL` para a URL do backend em produção
- Configure CORS no backend para o domínio de produção
- Use builds otimizados (`npm run build`)

## 📄 Licença

Projeto interno CI&T - Flow Ops Team
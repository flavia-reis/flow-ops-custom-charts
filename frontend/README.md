# Flow Ops Frontend

Interface React para criação de gráficos customizados.

## 🚀 Funcionalidades

- ✅ **Drag & Drop** para configuração de gráficos
- ✅ **Múltiplos tipos** de gráfico (Bar, Line, Area, Pie, Scatter)
- ✅ **Seletor de datas** com presets
- ✅ **Preview em tempo real**
- ✅ **Exportação** (PNG, PDF)
- ✅ **Configuração avançada** (cores, legendas, grid)
- ✅ **Save/Load** de configurações

## 🛠️ Tecnologias

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Recharts (gráficos)
- React Beautiful DnD
- Axios (HTTP client)
- React Hot Toast

## 🚦 Como executar

### Com Docker (recomendado)
```bash
docker-compose up --build
```

### Localmente
```bash
npm install
npm run dev
```

## 📁 Estrutura

```
src/
├── components/          # Componentes React
│   ├── ApiStatus.tsx   # Status da API
│   ├── ChartBuilder.tsx # Construtor de gráficos
│   ├── ChartConfigPanel.tsx # Configurações
│   ├── ChartPreview.tsx # Preview dos gráficos
│   ├── DataFieldsPanel.tsx # Lista de campos
│   ├── DateRangeSelector.tsx # Seletor de datas
│   └── SaveLoadPanel.tsx # Salvar/carregar
├── hooks/              # Hooks customizados
│   └── useFlowData.ts  # Hook para dados da API
├── services/           # Serviços
│   └── api.ts         # Cliente da API
├── types/             # Tipos TypeScript
│   └── chart.ts       # Tipos dos gráficos
└── App.tsx           # Componente principal
```

## 🔧 Configuração

Variáveis de ambiente (`.env`):
```
VITE_API_BASE_URL=http://localhost:8000
```

## 📊 Como usar

1. **Conectar**: Verifica conexão com backend
2. **Selecionar período**: Escolha datas ou presets
3. **Carregar dados**: Clique "Refresh Data"
4. **Criar gráfico**: 
   - Escolha tipo de gráfico
   - Arraste campos para eixos
   - Configure aparência
5. **Exportar**: Salve como PNG/PDF
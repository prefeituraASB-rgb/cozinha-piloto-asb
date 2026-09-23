import express from 'express';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.static('public'));

// ==========================================================================
// CONNECT NO MONGO ATLAS (Substitua <password> pela sua senha real)
// ==========================================================================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin_cozinha:<SantaBarbara2026>@clustercozinha.0xhhtls.mongodb.net/?appName=ClusterCozinha?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔌 Conectado com sucesso ao MongoDB Atlas (HD na Nuvem)!"))
    .catch((err) => console.error("❌ Erro fatal de conexão no banco na nuvem:", err));

// ==========================================================================
// MODELAGEM DOS DADOS JSON (SCHEMAS OFICIAIS DO SEU ESCOPO)
// ==========================================================================

// 1. Tabela: Usuários
const UsuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    perfil: { type: String, enum: ['ADMINISTRADOR', 'OPERADOR'], required: true },
    senha: { type: String, required: true },
    ativo: { type: Boolean, default: true }
}, { timestamps: true });

// 2. Tabela: Entrada de Itens (Unificada Catálogo + Lote)
const EntradaSchema = new mongoose.Schema({
    nome_produto: { type: String, required: true },
    metrica: { type: String, enum: ['KG', 'UNIDADE', 'LITROS', 'OUTRAS'], required: true },
    quantidade_inicial: { type: Number, required: true },
    quantidade_atual: { type: Number, required: true }, // Saldo que diminui no consumo
    tipo_entrada: { type: String, enum: ['DOAÇÃO', 'NOTA FISCAL', 'DOCUMENTO INTERNO'], required: true },
    numero_documento: { type: String, required: true },
    estoque_minimo: { type: Number, required: true },
    validade: { type: Date, required: true },
    lote: { type: String, required: true },
    usuario_logado: { type: String, required: true }
}, { timestamps: true });

// 3. Tabela: Saída de Itens (Consumo)
const SaidaSchema = new mongoose.Schema({
    nome_produto: { type: String, required: true },
    quantidade: { type: Number, required: true },
    tipo_saida: { type: String, enum: ['RECEITA', 'ITEM A ITEM'], required: true },
    local_envio: { type: String, required: true }, // Escola / Destino
    lote: { type: String, required: true },
    usuario_logado: { type: String, required: true }
}, { timestamps: true });

// 4. Tabela: Avarias / Quebras
const QuebraSchema = new mongoose.Schema({
    produto: { type: String, required: true },
    lote: { type: String, required: true },
    quantidade: { type: Number, required: true },
    motivo_quebra: { type: String, required: true },
    usuario_logado: { type: String, required: true }
}, { timestamps: true });

// Criação dos Modelos de execução do MongoDB
const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Entrada = mongoose.model('Entrada', EntradaSchema);
const Saida = mongoose.model('Saida', SaidaSchema);
const Quebra = mongoose.model('Quebra', QuebraSchema);

// ==========================================================================
// ROTAS UNIVERSAIS DA API (ENDPOINTS PARA O FRONT-END CONSUMIR)
// ==========================================================================

// Rota genérica de busca (GET)
app.get('/api/:tabela', async (req, res) => {
    try {
        const { tabela } = req.params;
        let dados = [];
        if (tabela === 'usuarios') dados = await Usuario.find();
        if (tabela === 'entradas') dados = await Entrada.find();
        if (tabela === 'saidas') dados = await Saida.find();
        if (tabela === 'quebras') dados = await Quebra.find();
        res.json(dados);
    } catch (e) {
        res.status(500).json({ erro: `Erro ao buscar dados da tabela ${req.params.tabela}` });
    }
});

// Rota genérica de salvamento (POST)
app.post('/api/salvar/:tabela', async (req, res) => {
    try {
        const { tabela } = req.params;
        let resultado;
        
        if (tabela === 'usuarios') resultado = await new Usuario(req.body).save();
        if (tabela === 'entradas') resultado = await new Entrada(req.body).save();
        if (tabela === 'saidas') resultado = await new Saida(req.body).save();
        if (tabela === 'quebras') resultado = await new Quebra(req.body).save();
        
        res.json({ sucesso: true, id: resultado._id });
    } catch (e) {
        res.status(500).json({ erro: `Erro ao salvar dados na tabela ${req.params.tabela}` });
    }
});

app.listen(PORT, () => console.log(`🚀 Servidor e API operando on-line na porta ${PORT}`));

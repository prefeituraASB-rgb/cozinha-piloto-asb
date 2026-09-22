import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();

// Definição dinâmica de porta exigida por servidores de nuvem
const PORT = process.env.PORT || 8000; 

app.use(express.json());
app.use(express.static('public'));

// Define se o banco roda na pasta persistente da nuvem (/data) ou local (./data)
const PASTA_BANCO = process.env.RENDER ? '/data' : path.resolve('./data');

const obterCaminho = (tabela) => path.join(PASTA_BANCO, `${tabela}.json`);

// Leitura genérica e segura de arquivos JSON
const lerJson = (tabela) => {
    const caminho = obterCaminho(tabela);
    if (!fs.existsSync(caminho)) {
        fs.mkdirSync(path.dirname(caminho), { recursive: true });
        fs.writeFileSync(caminho, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
};

// Escrita genérica com rotina de cópia de segurança integrada
const salvarJson = (tabela, dados) => {
    fs.writeFileSync(obterCaminho(tabela), JSON.stringify(dados, null, 2));
    executarBackupAutomatico(tabela);
};

const executarBackupAutomatico = (tabela) => {
    const pastaBackup = path.join(PASTA_BANCO, 'backups');
    if (!fs.existsSync(pastaBackup)) fs.mkdirSync(pastaBackup, { recursive: true });
    
    const arquivoOrigem = obterCaminho(tabela);
    const dataPrefixo = new Date().toISOString().split('T')[0];
    const arquivoDestino = path.join(pastaBackup, `${dataPrefixo}_${tabela}.json`);
    
    if (fs.existsSync(arquivoOrigem)) {
        fs.copyFileSync(arquivoOrigem, arquivoDestino);
    }
};

// Endpoints Universais da API para o Front-End consumir
app.get('/api/:tabela', (req, res) => {
    try { res.json(lerJson(req.params.tabela)); }
    catch (e) { res.status(500).json({ erro: "Erro ao ler a tabela" }); }
});

app.post('/api/salvar/:tabela', (req, res) => {
    try {
        salvarJson(req.params.tabela, req.body);
        res.json({ sucesso: true });
    } catch (e) {
        res.status(500).json({ erro: `Erro ao salvar a tabela ${req.params.tabela}` });
    }
});

app.listen(PORT, () => console.log(`🚀 Servidor pronto e operando na porta ${PORT}`));

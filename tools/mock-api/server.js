const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5177;

app.use(cors());
app.use(express.json());

// Rota de exemplo
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Mock API está funcionando!' });
});

// Mock de API do Senado
app.get('/api/senado/votacoes', (req, res) => {
  res.json({
    votacoes: [
      { id: 1, titulo: 'Votação 1', resultado: 'Aprovado' },
      { id: 2, titulo: 'Votação 2', resultado: 'Rejeitado' }
    ]
  });
});

app.get('/api/senado/materias', (req, res) => {
  res.json({
    materias: [
      { id: 1, titulo: 'Matéria Legislativa 1', autor: 'Senador X' },
      { id: 2, titulo: 'Matéria Legislativa 2', autor: 'Senador Y' }
    ]
  });
});

app.get('/api/senado/senadores', (req, res) => {
  res.json({
    senadores: [
      { id: 1, nome: 'Senador X', partido: 'Partido A' },
      { id: 2, nome: 'Senador Y', partido: 'Partido B' }
    ]
  });
});

// Mock de perfil de usuário
app.get('/usuariosApi/perfil', (req, res) => {
  res.json({
    id: 1,
    nome: 'Usuário Mock',
    email: 'mock@usuario.com',
    estadoEleitoral: 'SP'
  });
});

// Mock de interesses do usuário
app.get('/usuariosApi/interesses', (req, res) => {
  res.json({
    interesses: [
      { id: 1, nome: 'Educação' },
      { id: 2, nome: 'Saúde' }
    ]
  });
});

app.listen(port, () => {
  console.log(`Mock API rodando na porta ${port}`);
});
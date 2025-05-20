/**
 * Dados de fallback para o senador 6331 (Sergio Moro)
 * Estes dados são usados quando não é possível carregar os dados do Firestore
 */
export const senadorMoroFallback = {
  codigo: "6331",
  nome: "Sergio Moro",
  nomeCompleto: "Sergio Fernando Moro",
  genero: "Masculino",
  partido: {
    sigla: "UNIÃO",
    nome: "União Brasil"
  },
  uf: "PR",
  foto: "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador6331.jpg",
  paginaOficial: "https://www25.senado.leg.br/web/senadores/senador/-/perfil/6331",
  email: "sen.sergiomoro@senado.leg.br",
  telefones: [
    { numero: "(61) 3303-6391", tipo: "Gabinete", ordem: 1 }
  ],
  situacao: {
    emExercicio: true,
    afastado: false,
    titular: true,
    suplente: false,
    cargoMesa: false,
    cargoLideranca: false
  },
  dadosPessoais: {
    dataNascimento: "1972-08-01",
    naturalidade: "Maringá",
    ufNaturalidade: "PR",
    enderecoParlamentar: "Senado Federal, Anexo 1, 14º Pavimento"
  }
};

export default senadorMoroFallback;

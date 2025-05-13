/**
 * @file Schemas relativos ao domínio do Senado Federal
 */
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Esquema base para timestamps
const timestampSchema = z.union([
  z.string(),
  z.instanceof(Timestamp),
  z.date()
]);

// Esquema de Rede Social
export const redeSocialSchema = z.object({
  nome: z.string(),
  url: z.string().url()
});

export type RedeSocial = z.infer<typeof redeSocialSchema>;

// Esquema de Afastamento
export const afastamentoSchema = z.object({
  inicio: z.string(),
  fim: z.string().optional(),
  causa: z.string(),
  descricao: z.string().optional()
});

export type Afastamento = z.infer<typeof afastamentoSchema>;

// Esquema de Mandato
export const mandatoSchema = z.object({
  inicio: z.string(),
  fim: z.string().optional(),
  tipo: z.string(),
  descricao: z.string(),
  afastamentos: z.array(afastamentoSchema).optional()
});

export type Mandato = z.infer<typeof mandatoSchema>;

// Esquema de Comissão
export const comissaoSchema = z.object({
  codigo: z.string(),
  sigla: z.string(),
  nome: z.string(),
  cargo: z.string(),
  dataInicio: z.string(),
  dataFim: z.string().optional(),
  ativa: z.boolean(),
  membros: z.record(z.object({
    cargo: z.string(),
    dataInicio: z.string(),
    dataFim: z.string().optional()
  }))
});

export type Comissao = z.infer<typeof comissaoSchema>;
export type ComissaoDetalhada = Comissao;

// Esquema de Presença
export const presencaSchema = z.object({
  data: z.string(),
  tipo: z.enum(['PRESENTE', 'AUSENTE', 'AUSENTE_JUSTIFICADO']),
  justificativa: z.string().optional()
});

export type Presenca = z.infer<typeof presencaSchema>;

// Esquema de Voto
export const votoSchema = z.object({
  senadorId: z.number(),
  voto: z.string(),
  data: z.string()
});

export type Voto = z.infer<typeof votoSchema>;

// Esquema de Votação
export const votacaoSchema = z.object({
  id: z.number(),
  data: z.string(),
  descricao: z.string(),
  resultado: z.string(),
  votos: z.array(votoSchema),
  materia: z.object({
    codigo: z.number(),
    descricao: z.string(),
    ementa: z.string().optional()
  }).optional()
});

export type Votacao = z.infer<typeof votacaoSchema>;

// Esquema de Tramitação
export const tramitacaoSchema = z.object({
  data: z.string(),
  local: z.string(),
  status: z.string(),
  descricao: z.string()
});

export type Tramitacao = z.infer<typeof tramitacaoSchema>;

// Esquema de Texto da Matéria
export const textoMateriaSchema = z.object({
  tipo: z.string(),
  url: z.string().url(),
  data: z.string()
});

export type TextoMateria = z.infer<typeof textoMateriaSchema>;

// Esquema de Emenda da Matéria
export const emendaMateriaSchema = z.object({
  numero: z.number(),
  autor: z.string(),
  data: z.string(),
  descricao: z.string()
});

export type EmendaMateria = z.infer<typeof emendaMateriaSchema>;

// Esquema de Relação entre Matérias
export const relacaoMateriaSchema = z.object({
  tipo: z.string(),
  materiaRelacionada: z.object({
    codigo: z.number(),
    tipo: z.string(),
    numero: z.number(),
    ano: z.number()
  })
});

export type RelacaoMateria = z.infer<typeof relacaoMateriaSchema>;

// Esquema de Matéria
export const materiaSchema = z.object({
  codigo: z.number(),
  tipo: z.string(),
  numero: z.number(),
  ano: z.number(),
  ementa: z.string(),
  explicacao: z.string().optional(),
  autor: z.string().optional(),
  dataApresentacao: timestampSchema,
  ultimaAtualizacao: timestampSchema,
  situacao: z.string().optional(),
  tramitacoes: z.array(tramitacaoSchema).optional(),
  textos: z.array(textoMateriaSchema).optional(),
  emendas: z.array(emendaMateriaSchema).optional(),
  relacoes: z.array(relacaoMateriaSchema).optional()
});

export type Materia = z.infer<typeof materiaSchema>;

// Esquema de Proposição (alias para Matéria para compatibilidade)
export const proposicaoSchema = materiaSchema;
export type Proposicao = Materia;

// Esquema de Despesa
export const despesaSchema = z.object({
  id: z.number(),
  tipo: z.string(),
  data: z.string(),
  valor: z.number(),
  fornecedor: z.string().optional(),
  cnpj: z.string().optional(),
  descricao: z.string().optional(),
  mes: z.number(),
  ano: z.number()
});

export type Despesa = z.infer<typeof despesaSchema>;

// Esquema de perfil de parlamentar
export const perfilParlamentarSchema = z.object({
  profissao: z.string().optional(),
  escolaridade: z.string().optional(),
  redeSocial: z.array(redeSocialSchema).optional()
});

export type PerfilParlamentar = z.infer<typeof perfilParlamentarSchema>;

// Esquema de identificação parlamentar (formato da API)
export const identificacaoParlamentarSchema = z.object({
  CodigoParlamentar: z.string(),
  NomeParlamentar: z.string(),
  NomeCompletoParlamentar: z.string(),
  SexoParlamentar: z.string(),
  FormaTratamento: z.string(),
  UrlFotoParlamentar: z.string(),
  UrlPaginaParlamentar: z.string(),
  EmailParlamentar: z.string(),
  SiglaPartidoParlamentar: z.string(),
  UfParlamentar: z.string()
});

export type IdentificacaoParlamentar = z.infer<typeof identificacaoParlamentarSchema>;

// Esquema de Senador
export const senadorDetalhadoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  nomeCivil: z.string(),
  sexo: z.string(),
  dataNascimento: z.string(),
  naturalidade: z.string(),
  ufNascimento: z.string(),
  siglaPartido: z.string(),
  siglaUf: z.string(),
  urlFoto: z.string().url().optional(),
  email: z.string().email().optional(),
  biografia: z.string().optional(),
  telefone: z.string(),
  mandatos: z.array(mandatoSchema),
  perfil: perfilParlamentarSchema.optional(),
  comissoes: z.array(comissaoSchema),
  comissoesDetalhadas: z.array(comissaoSchema),
  presencas: z.array(presencaSchema),
  votacoes: z.array(votacaoSchema),
  materias: z.array(materiaSchema),
  ultimaAtualizacao: z.instanceof(Timestamp),
  IdentificacaoParlamentar: identificacaoParlamentarSchema
});

export type SenadorDetalhado = z.infer<typeof senadorDetalhadoSchema>;

// Esquema base de senador (campos essenciais)
export const senadorBaseSchema = senadorDetalhadoSchema.pick({
  id: true,
  nome: true,
  nomeCivil: true,
  sexo: true,
  dataNascimento: true,
  naturalidade: true,
  ufNascimento: true,
  siglaPartido: true,
  siglaUf: true,
  urlFoto: true,
  email: true,
  biografia: true,
  mandatos: true,
  perfil: true
});

export type SenadorBase = z.infer<typeof senadorBaseSchema>;

// Tipo Senador é um alias para SenadorDetalhado para compatibilidade
export type Senador = SenadorDetalhado;
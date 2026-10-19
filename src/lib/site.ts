/* Dados do negócio num arquivo só. Tudo que está em CONFIRMAR é hipótese do protótipo:
 * sai da tela ou vira fato depois da reunião com os donos. */

export const EMPRESA = {
  nome: "Segmento Comercial",
  nomeLoja: "Segmento Virtual",
  legalName: "Segmento Comercial LTDA",
  cnpj: "54.557.218/0001-70",
  telefone: "(11) 3965-0409",
  telefoneE164: "+551139650409",
  whatsappDigits: "551139650409", // CONFIRMAR: o fixo tem WhatsApp?
  email: "contato@segmentocomercial.com",
  instagram: "https://instagram.com/segmentocomercial",
  youtube: "https://youtube.com/@segmentocomercial",
  endereco: {
    rua: "Av. Eng. Caetano Álvares, 2025",
    bairro: "Casa Verde Alta",
    cidade: "São Paulo",
    uf: "SP",
    cep: "02545-007",
  },
  horario: "Seg a sex, 8h às 18h · Sáb, 8h às 12h", // CONFIRMAR
  googleNota: "4,8",
  googleAvaliacoes: 30,
  anos: "20+", // CONFIRMAR (o CNPJ do rodapé é de 2024; o "EPP" do widget deve ser o antigo)
} as const;

/* Afirmações de confiança do topo. `confirmar: true` = hipótese, pedir na reunião. */
export const TRUST = [
  { texto: "Entrega D+1 na Grande SP", confirmar: true },
  { texto: "Faturamento para CNPJ", confirmar: true },
  { texto: "Retirada na loja em Casa Verde", confirmar: false },
  { texto: "Fabricação própria de placas", confirmar: false },
  { texto: "Nota 4,8 no Google", confirmar: false },
] as const;

export const CONFIRMAR = [
  "O fixo (11) 3965-0409 tem WhatsApp Business? Se não, qual número?",
  "Prazo real de entrega na Grande SP (motoboy? Correios? retirada?)",
  "Faturamento para CNPJ existe hoje? Prazo (28/42 dias)? Pedido mínimo?",
  "Horário de funcionamento",
  "Há quantos anos a empresa opera (os dois CNPJs)",
  "Materiais, medidas e prazos padrão das placas sob medida",
] as const;

export type FaqItem = { q: string; a: string };

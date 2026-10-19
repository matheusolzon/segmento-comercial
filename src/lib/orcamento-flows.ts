/* Config DECLARATIVA dos dois configuradores (fabricação e empresas). Adicionar tipo = mexer só aqui.
 * Molde do quote-flows.ts da Celebra com 3 extensões: number (unit/min/max), multi em chips, showIf. */
export type Question = {
  id: string; label: string; type: "chips" | "text" | "number" | "cep";
  options?: string[]; multi?: boolean; unit?: string; min?: number; max?: number;
  placeholder?: string; optional?: boolean; showIf?: { id: string; equals: string };
};
export type Flow = { id: string; label: string; destaque?: boolean; resumo?: string; questions: Question[] };
export type OrcamentoConfig = { id: "fabricacao" | "empresas"; titulo: string; subtitulo: string; passoLabel: string; flows: Flow[]; leadPrefixo: string };

const quantidade: Question = { id: "quantidade", label: "Quantas unidades?", type: "chips", options: ["1", "2 a 10", "11 a 50", "51 a 200", "Mais de 200"] };
const instalacao: Question = { id: "instalacao", label: "Precisa de instalação?", type: "chips", options: ["Com instalação", "Só a peça", "Não sei ainda"] };
const prazo: Question = { id: "prazo", label: "Pra quando você precisa?", type: "chips", options: ["Esta semana", "Em até 15 dias", "Em até 30 dias", "Sem data definida"] };
const arte: Question = { id: "arte", label: "E a arte?", type: "chips", options: ["Tenho a arte pronta", "Tenho o logo e preciso da arte", "Modelo padrão da norma", "Preciso de criação"] };
const medidaLivre: Question[] = [
  { id: "largura", label: "Largura", type: "number", unit: "cm", min: 1, max: 2000, placeholder: "ex.: 120" },
  { id: "altura", label: "Altura", type: "number", unit: "cm", min: 1, max: 2000, placeholder: "ex.: 80" },
];
const outraMedida = (id: string): Question[] => [
  { id: "largura", label: "Largura", type: "number", unit: "cm", min: 1, max: 2000, placeholder: "ex.: 60", showIf: { id, equals: "Outra medida" } },
  { id: "altura", label: "Altura", type: "number", unit: "cm", min: 1, max: 2000, placeholder: "ex.: 40", showIf: { id, equals: "Outra medida" } },
];

export const ORCAMENTO_FABRICACAO: OrcamentoConfig = {
  id: "fabricacao", leadPrefixo: "F",
  titulo: "Orçamento de fabricação",
  subtitulo: "Responde em chips, sem digitar quase nada. O resumo abre no seu WhatsApp e a fábrica responde em horário comercial.",
  passoLabel: "O que vamos fabricar?",
  flows: [
    { id: "transito", label: "Placa de trânsito", destaque: true, resumo: "Regulamentação, advertência e indicação, padrão CONTRAN", questions: [
      { id: "material", label: "Qual material?", type: "chips", options: ["Chapa de aço com película refletiva", "Alumínio com película refletiva", "Quero indicação"] },
      { id: "medida", label: "Qual a medida?", type: "chips", options: ["40 cm", "50 cm", "60 cm", "75 cm", "Outra medida"] }, ...outraMedida("medida"),
      quantidade, prazo, arte,
      { id: "referencia", label: "Qual placa? (ex.: R-1 Pare, A-18 Lombada)", type: "text", optional: true, placeholder: "Código ou descrição" },
    ]},
    { id: "veicular", label: "Veicular e frota", destaque: true, resumo: "Faixa refletiva, rótulo de risco, painel ONU, adesivo de frota", questions: [
      { id: "material", label: "O que você precisa?", type: "chips", options: ["Faixa refletiva", "Rótulo de risco e painel ONU", "Adesivo de frota com logo", "Placa de identificação"] },
      { id: "veiculos", label: "Quantos veículos?", type: "chips", options: ["1", "2 a 5", "6 a 20", "Mais de 20"] },
      prazo, arte,
    ]},
    { id: "seguranca", label: "Segurança e identificação", destaque: true, resumo: "NR-26, rota de fuga, extintor, áreas da empresa", questions: [
      { id: "material", label: "Qual material?", type: "chips", options: ["PS", "Alumínio", "Fotoluminescente", "Adesivo vinil", "Quero indicação"] },
      { id: "medida", label: "Qual a medida?", type: "chips", options: ["15x20 cm", "20x30 cm", "30x40 cm", "40x60 cm", "Outra medida"] }, ...outraMedida("medida"),
      quantidade, prazo, arte,
    ]},
    { id: "acm", label: "Fachada em ACM", destaque: true, resumo: "Revestimento, com ou sem letra caixa e iluminação", questions: [
      { id: "material", label: "Como é a fachada?", type: "chips", options: ["Só revestimento", "ACM com letra caixa", "ACM com iluminação"] },
      ...medidaLivre, { id: "medicao", label: "Medida", type: "chips", options: ["Já tenho as medidas", "Preciso de medição no local"], optional: true },
      instalacao, prazo, arte,
    ]},
    { id: "letra", label: "Letra caixa", resumo: "Inox, aço, acrílico ou PVC", questions: [
      { id: "material", label: "Qual material?", type: "chips", options: ["Inox", "Aço pintado", "Acrílico", "PVC expandido"] },
      { id: "altura", label: "Altura da letra", type: "number", unit: "cm", min: 2, max: 500, placeholder: "ex.: 40" },
      { id: "texto", label: "Qual o texto?", type: "text", placeholder: "ex.: SEGMENTO" },
      instalacao, prazo, arte,
    ]},
    { id: "luminoso", label: "Luminoso", resumo: "Caixa com lona, acrílico com LED ou LED flex", questions: [
      { id: "material", label: "Qual tipo?", type: "chips", options: ["Caixa com lona", "Acrílico com LED", "LED flex", "Quero indicação"] },
      ...medidaLivre, instalacao, prazo, arte,
    ]},
    { id: "cnc", label: "Corte e gravação CNC e laser", resumo: "Acrílico, MDF, ACM, aço ou inox", questions: [
      { id: "material", label: "Qual material?", type: "chips", options: ["Acrílico", "MDF", "ACM", "Aço ou inox", "Outro"] },
      ...medidaLivre, quantidade, prazo,
      { id: "arte", label: "E o arquivo?", type: "chips", options: ["Tenho o vetor (DXF, AI, CDR)", "Tenho uma imagem", "Preciso de criação"] },
    ]},
    { id: "lona", label: "Lona e adesivo", resumo: "Banner, lona com ilhós, adesivo vinil ou perfurado", questions: [
      { id: "material", label: "Qual tipo?", type: "chips", options: ["Lona com ilhós", "Adesivo vinil", "Adesivo perfurado", "Quero indicação"] },
      ...medidaLivre, quantidade, prazo, arte,
    ]},
  ],
};

const contatoEmpresa: Question[] = [
  { id: "cargo", label: "Você é...", type: "chips", options: ["Compras", "Segurança do trabalho", "Engenharia e obra", "Gestão de frota", "Síndico ou administradora", "Dono ou gerente"] },
];
const porte: Question = { id: "porte", label: "Quantas pessoas vão usar?", type: "chips", options: ["Até 10", "11 a 50", "51 a 200", "Mais de 200"] };
const frequencia: Question = { id: "frequencia", label: "Como é essa compra?", type: "chips", options: ["Compra pontual", "Reposição mensal", "Obra ou projeto com prazo", "Licitação ou órgão público"] };
const necessidade: Question = { id: "necessidade", label: "O que você precisa?", type: "chips", multi: true, options: ["Kit de EPI do segmento", "EPI avulso", "Placas e sinalização prontas", "Placa sob medida", "Ferramentas e ferragens", "Material de frota"] };
const itens: Question = { id: "itens", label: "Outros itens ou detalhes (opcional)", type: "text", optional: true, placeholder: "ex.: 30 botinas 40 a 44, 60 luvas, 10 capacetes" };

export const ORCAMENTO_EMPRESAS: OrcamentoConfig = {
  id: "empresas", leadPrefixo: "E",
  titulo: "Cotação para empresa",
  subtitulo: "Quatro passos. A cotação sai formal, com nota fiscal e faturamento para CNPJ.",
  passoLabel: "Qual o tipo de operação?",
  flows: [
    { id: "obra", label: "Obra e construção", destaque: true, resumo: "NR-6, NR-18 e NR-35: capacete, botina, luva, altura, sinalização de canteiro", questions: [necessidade, porte, frequencia, itens, ...contatoEmpresa] },
    { id: "galpao", label: "Galpão e logística", destaque: true, resumo: "Botina, luva, colete, demarcação de piso, carga suspensa, cinta", questions: [necessidade, porte, frequencia, itens, ...contatoEmpresa] },
    { id: "frota", label: "Frota e transporte", destaque: true, resumo: "Kit caminhão NBR 9735, faixa refletiva, rótulos ONU, adesivo de frota", questions: [{ id: "veiculos", label: "Quantos veículos?", type: "chips", options: ["1 a 5", "6 a 20", "21 a 100", "Mais de 100"] }, necessidade, frequencia, itens, ...contatoEmpresa] },
    { id: "industria", label: "Indústria", destaque: true, resumo: "Óculos, auricular, respirador, luvas, bloqueio, placas NR-26", questions: [necessidade, porte, frequencia, itens, ...contatoEmpresa] },
    { id: "condominio", label: "Condomínio", destaque: true, resumo: "Fotoluminescentes de saída e extintor, placa de garagem, antiderrapante, cones", questions: [{ id: "unidades", label: "Quantas unidades tem o condomínio?", type: "chips", options: ["Até 20", "21 a 50", "51 a 150", "Mais de 150"] }, necessidade, frequencia, itens, ...contatoEmpresa] },
    { id: "outro", label: "Outro", questions: [{ id: "segmento", label: "Qual o segmento?", type: "text", placeholder: "ex.: hospital, escola, agro" }, necessidade, porte, frequencia, itens, ...contatoEmpresa] },
  ],
};

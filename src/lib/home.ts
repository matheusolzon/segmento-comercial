/* Dados da home v2 (varejo). Preço "a partir de" e contagem saem do catálogo no build: nada digitado à mão.
 * Recortes em /img/recortes (foto real do catálogo, fundo tirado no rembg); fotos de ambiente em /img/banco
 * (Pexels, créditos em clientes/segmento-comercial/web/home-v2/CREDITOS.md). */
import { porCaminho, porN1, ordenar, formatarPreco, PRODUTOS } from "./catalogo";
import { paraCard } from "./para-card";

const lista = (caminho: string) => (caminho.includes("/") ? porCaminho.get(caminho) : porN1.get(caminho)) || [];

/* `so` restringe pelo nome (ex.: /^bot/i pra não pegar a palmilha de R$ 2 como "botina a partir de"). */
export const aPartirDe = (caminho: string, so?: RegExp) => {
  const v = lista(caminho).filter((p) => p.em_estoque && (!so || so.test(p.nome))).map((p) => p.preco_min ?? p.preco).filter((x) => x > 0);
  return v.length ? formatarPreco(Math.min(...v)) : null;
};
export const totalDe = (caminho: string) => lista(caminho).length;
export const emEstoque = () => PRODUTOS.filter((p) => p.em_estoque).length;

/* Prateleira: em estoque e com foto, ordem do catálogo. `ids` fixa os primeiros quando a vitrine pede destaque. */
export const vitrine = (caminho: string, n = 8, ids: number[] = []) => {
  const base = ordenar(lista(caminho).filter((p) => p.em_estoque && p.imagem));
  const fixos = ids.map((id) => base.find((p) => p.id === id)).filter((p) => p !== undefined);
  return [...fixos, ...base.filter((p) => !ids.includes(p.id))].slice(0, n).map(paraCard);
};

export const recorte = (nome: string, w?: 320) => `/img/recortes/${nome}${w ? `-${w}` : ""}.webp`;
export const banco = (nome: string, w: 960 | 1600 = 960) => `/img/banco/${nome}-${w}.webp`;

/* Categorias com foto (fileira estilo Super EPI). A foto é o produto mais reconhecível da folha. */
export const CATEGORIAS_FOTO = [
  { nome: "Calçados de segurança", curto: "Botinas e calçados", caminho: "epi/calcados-de-seguranca", img: "botina-miura" },
  { nome: "Luvas", curto: "Luvas", caminho: "epi/luvas", img: "luva-kalipso" },
  { nome: "Proteção da cabeça", curto: "Capacetes", caminho: "epi/protecao-da-cabeca", img: "capacete-acoplado" },
  { nome: "Olhos e face", curto: "Óculos e face", caminho: "epi/olhos-e-face", img: "oculos-vancouver" },
  { nome: "Proteção auditiva", curto: "Auditiva", caminho: "epi/protecao-auditiva", img: "abafador" },
  { nome: "Proteção respiratória", curto: "Respiratória", caminho: "epi/protecao-respiratoria", img: "mascara-panoramica" },
  { nome: "Trabalho em altura", curto: "Trabalho em altura", caminho: "epi/trabalho-em-altura", img: "cinturao" },
  { nome: "Vestuário e impermeáveis", curto: "Vestuário e chuva", caminho: "epi/vestuario-e-impermeaveis", img: "conjunto-pvc" },
  { nome: "Placas de sinalização", curto: "Placas", caminho: "sinalizacao-e-seguranca/placas", img: "placa-piso-molhado" },
  { nome: "Cones e bandeirolas", curto: "Cones", caminho: "sinalizacao-e-seguranca/cones-e-bandeirolas", img: "cone-72" },
  { nome: "Fitas de sinalização", curto: "Fita zebrada", caminho: "sinalizacao-e-seguranca/fitas-de-sinalizacao", img: "fita-zebrada" },
  { nome: "Coletes refletivos", curto: "Coletes", caminho: "sinalizacao-e-seguranca/coletes-refletivos", img: "colete-laranja" },
  { nome: "Ferramentas manuais", curto: "Ferramentas", caminho: "ferramentas-e-ferragens/ferramentas-manuais", img: "chave-grifo" },
  { nome: "Discos, brocas e acessórios", curto: "Discos e brocas", caminho: "ferramentas-e-ferragens/discos-brocas-e-acessorios", img: "disco-corte" },
  { nome: "Fixação e ferragens", curto: "Fixação", caminho: "ferramentas-e-ferragens/fixacao-e-ferragens", img: "cadeado" },
  { nome: "Cordas e amarração", curto: "Cintas e cordas", caminho: "ferramentas-e-ferragens/cordas-e-amarracao", img: "cinta-catraca" },
  { nome: "Químicos e lubrificantes", curto: "Lubrificantes", caminho: "ferramentas-e-ferragens/quimicos-e-lubrificantes", img: "wd40" },
  { nome: "Fitas adesivas", curto: "Fitas adesivas", caminho: "fitas-colas-e-adesivos/fitas-adesivas", img: "fita-isolante" },
  { nome: "Pilhas e elétrica", curto: "Elétrica", caminho: "ferramentas-e-ferragens/pilhas-e-eletrica", img: "extensao" },
  { nome: "Jardinagem", curto: "Jardinagem", caminho: "ferramentas-e-ferragens/jardinagem", img: "mangueira" },
  { nome: "Kit caminhão e sinalização veicular", curto: "Kit caminhão", caminho: "veicular-e-frota/kit-caminhao-e-sinalizacao-veicular", img: "faixa-refletiva" },
].map((c) => ({ ...c, total: totalDe(c.caminho) }));

/* Compre por segmento: mesma lista do configurador de /empresas (ids iguais aos fluxos). */
export const SEGMENTOS_FOTO = [
  { id: "obra", nome: "Obra e construção", foto: "seg-obra", pos: "50% 35%", resumo: "Capacete, botina, luva, altura e canteiro" },
  { id: "galpao", nome: "Galpão e logística", foto: "seg-galpao", pos: "45% 50%", resumo: "Botina, luva, colete, demarcação e cinta" },
  { id: "frota", nome: "Frota e transporte", foto: "seg-frota", pos: "50% 40%", resumo: "Kit caminhão, faixa refletiva e rótulo ONU" },
  { id: "industria", nome: "Indústria", foto: "seg-industria", pos: "62% 40%", resumo: "Óculos, auricular, respirador e NR-26" },
  { id: "condominio", nome: "Condomínio", foto: "seg-condominio", pos: "70% 50%", resumo: "Fotoluminescente, garagem e antiderrapante" },
];

/* Foto por tipo do configurador de /fabricacao. `ia` marca a única imagem gerada (fachada). */
export const FABRICA_FOTO: Record<string, { foto: string; pos: string; ia?: boolean }> = {
  transito: { foto: "fab-transito", pos: "50% 30%" },
  veicular: { foto: "fab-veicular", pos: "50% 70%" },
  seguranca: { foto: "fab-seguranca", pos: "50% 45%" },
  acm: { foto: "fab-acm-ia", pos: "50% 30%", ia: true },
  letra: { foto: "fab-letra", pos: "45% 50%" },
  luminoso: { foto: "fab-luminoso", pos: "40% 40%" },
  cnc: { foto: "fabrica-laser", pos: "50% 55%" },
  lona: { foto: "fab-lona", pos: "50% 55%" },
};

/* Marcas com mais itens no catálogo (índice tipográfico; logo oficial entra com a migração). */
export const MARCAS = (() => {
  const m = new Map<string, number>();
  for (const p of PRODUTOS) if (p.marca) m.set(p.marca, (m.get(p.marca) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([nome, total]) => ({ nome, total }));
})();

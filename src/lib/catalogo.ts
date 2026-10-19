/* Catálogo normalizado (src/data/produtos.json, gerado em ../../catalogo) e índices
 * derivados no build. Tudo síncrono e estático: 828 produtos cabem em memória. */
import produtosJson from "../data/produtos.json";
import taxonomiaJson from "../data/taxonomia-nova.json";

export type Variacao = {
  id: number; sku: string | null; atributos: Record<string, string>;
  preco: number; em_estoque: boolean; estoque: number | null;
  imagem: Imagem | null;
};
export type Imagem = { id: number; w800: string; w320: string; src_original: string };
export type CA = { numero: string; fonte: "nome" | "descricao"; validade: null; status: string };
export type Produto = {
  id: number; slug: string; sku: string | null; tipo: "simple" | "variable";
  nome: string; nome_original: string; marca: string | null;
  categoria_antiga: string[];
  categoria_nova: { n1: string; n2: string; nome_n1: string; nome_n2: string; caminho: string; metodo: string; pendente: boolean };
  preco: number; preco_min: number | null; preco_max: number | null;
  em_estoque: boolean; estoque: number | null;
  imagem: Imagem | null; descricao_html: string | null; descricao_texto: string | null;
  normas: string[]; ca: CA | null; eh_epi: boolean;
  peso_bruto: number | null; dimensoes_brutas: Record<string, string> | null; gtin: null;
  url_original: string; variacoes: Variacao[];
  atributos: { nome: string; valores: string[] }[];
};
export type N2 = { slug: string; nome: string; total: number };
export type N1 = { slug: string; nome: string; descricao: string; total: number; n2: N2[] };

export const PRODUTOS = produtosJson as unknown as Produto[];
export const TAXONOMIA = (taxonomiaJson as unknown as { n1: N1[]; menu_extra: { slug: string; nome: string; rota: string }[] });

export const porSlug = new Map(PRODUTOS.map((p) => [p.slug, p]));
export const porCaminho = new Map<string, Produto[]>();
export const porN1 = new Map<string, Produto[]>();
for (const p of PRODUTOS) {
  const c = p.categoria_nova.caminho;
  if (!porCaminho.has(c)) porCaminho.set(c, []);
  porCaminho.get(c)!.push(p);
  if (!porN1.has(p.categoria_nova.n1)) porN1.set(p.categoria_nova.n1, []);
  porN1.get(p.categoria_nova.n1)!.push(p);
}

export const n1Por = (slug: string) => TAXONOMIA.n1.find((x) => x.slug === slug);
export const n2Por = (n1: string, n2: string) => n1Por(n1)?.n2.find((x) => x.slug === n2);

/* Em estoque primeiro, com foto primeiro, depois nome. */
export const ordenar = (lista: Produto[]) =>
  [...lista].sort((a, b) =>
    Number(b.em_estoque) - Number(a.em_estoque) ||
    Number(!!b.imagem) - Number(!!a.imagem) ||
    a.nome.localeCompare(b.nome, "pt-BR"));

export const marcasDe = (lista: Produto[]) => {
  const m = new Map<string, number>();
  for (const p of lista) if (p.marca) m.set(p.marca, (m.get(p.marca) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};
export const tamanhosDe = (lista: Produto[]) => {
  const s = new Set<string>();
  for (const p of lista) for (const a of p.atributos) if (/tamanho|tam\b/i.test(a.nome)) a.valores.forEach((v) => s.add(v));
  return [...s].sort((a, b) => (Number(a) || 0) - (Number(b) || 0) || a.localeCompare(b));
};

export const relacionados = (p: Produto, n = 4) =>
  ordenar((porCaminho.get(p.categoria_nova.caminho) || []).filter((x) => x.id !== p.id)).slice(0, n);

export const formatarPreco = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const precoExibido = (p: Produto) =>
  p.preco_min !== null && p.preco_max !== null && p.preco_min !== p.preco_max
    ? `${formatarPreco(p.preco_min)} a ${formatarPreco(p.preco_max)}`
    : formatarPreco(p.preco_min ?? p.preco);

/* Índice compacto da busca (vai pra /busca.json). */
export const indiceBusca = () => PRODUTOS.map((p) => ({
  id: p.id, s: p.slug, n: p.nome, m: p.marca, k: p.sku, ca: p.ca?.numero ?? null,
  c: p.categoria_nova.caminho, cn: `${p.categoria_nova.nome_n1} › ${p.categoria_nova.nome_n2}`,
  pr: p.preco_min ?? p.preco, e: p.em_estoque ? 1 : 0, i: p.imagem?.w320 ?? null,
}));
export type ItemBusca = ReturnType<typeof indiceBusca>[number];

/* Resumo pra mensagem de WhatsApp. */
export const resumoWhatsapp = (p: Produto, v?: Variacao | null, qtd = 1) => {
  const linhas = [`Olá! Quero pedir pelo site:`, `• ${p.nome}`, `• REF ${v?.sku ?? p.sku}`];
  if (v && Object.keys(v.atributos).length) linhas.push(`• ${Object.entries(v.atributos).map(([k, x]) => `${k}: ${x}`).join(", ")}`);
  if (p.ca) linhas.push(`• CA ${p.ca.numero}`);
  linhas.push(`• Quantidade: ${qtd}`);
  return linhas.join("\n");
};

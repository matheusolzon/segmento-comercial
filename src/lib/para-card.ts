import type { Produto } from "./catalogo";
import { precoExibido } from "./catalogo";
import type { ItemCard } from "./tipos-cliente";
export const paraCard = (p: Produto): ItemCard => ({
  id: p.id, slug: p.slug, nome: p.nome, marca: p.marca, sku: p.sku,
  ca: p.ca?.numero ?? null, ehEpi: p.eh_epi, preco: precoExibido(p), precoNum: p.preco_min ?? p.preco,
  emEstoque: p.em_estoque, img320: p.imagem?.w320 ?? null, img800: p.imagem?.w800 ?? null,
  n2: p.categoria_nova.nome_n2,
  tamanhos: p.atributos.filter((a) => /tamanho|tam\b/i.test(a.nome)).flatMap((a) => a.valores),
});

/* Forma compacta do produto que viaja pras ilhas (props serializadas no HTML). */
export type ItemCard = {
  id: number; slug: string; nome: string; marca: string | null; sku: string | null;
  ca: string | null; ehEpi: boolean; preco: string; precoNum: number; emEstoque: boolean;
  img320: string | null; img800: string | null; n2: string; tamanhos: string[];
};
export const fmtPreco = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

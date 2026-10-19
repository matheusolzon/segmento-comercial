/* Pedido com vários itens (localStorage) que termina no WhatsApp. Sem checkout: é lista, não carrinho. */
export type ItemPedido = { id: number; slug: string; nome: string; sku: string | null; preco: number; qtd: number; variacao?: string; ca?: string | null };
const CHAVE = "segmento_pedido";
const ler = (): ItemPedido[] => { try { return JSON.parse(localStorage.getItem(CHAVE) || "[]"); } catch { return []; } };
const gravar = (itens: ItemPedido[]) => { try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch { /* sem storage, segue na memória */ } window.dispatchEvent(new CustomEvent("pedido:change", { detail: itens })); };
export const pedidoItens = ler;
export const pedidoQtd = (chave: string) => ler().find((i) => chaveDe(i) === chave)?.qtd ?? 0;
export const chaveDe = (i: { id: number; variacao?: string }) => `${i.id}${i.variacao ? ":" + i.variacao : ""}`;
export const pedidoSetQtd = (item: Omit<ItemPedido, "qtd">, qtd: number) => {
  const itens = ler(); const k = chaveDe(item); const idx = itens.findIndex((i) => chaveDe(i) === k);
  if (qtd <= 0) { if (idx >= 0) itens.splice(idx, 1); }
  else if (idx >= 0) itens[idx].qtd = qtd; else itens.push({ ...item, qtd });
  gravar(itens); return qtd;
};
export const pedidoLimpar = () => gravar([]);
export const pedidoTotal = (itens = ler()) => itens.reduce((a, i) => a + i.preco * i.qtd, 0);
export const pedidoMensagem = (itens = ler()) => {
  const l = ["Olá! Quero fazer este pedido pelo site:"];
  for (const i of itens) l.push(`• ${i.qtd}x ${i.nome}${i.variacao ? ` (${i.variacao})` : ""} · REF ${i.sku}${i.ca ? ` · CA ${i.ca}` : ""}`);
  l.push(`Total estimado: ${pedidoTotal(itens).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
  return l.join("\n");
};

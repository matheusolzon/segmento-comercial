/* Delegação global: qualquer [data-pedido-ctl] (card estático ou dentro de ilha) vira "Adicionar ao pedido" / [− n +].
 * Um script só pra página inteira; a barra (PedidoBar) escuta pedido:change. */
import { chaveDe, pedidoQtd, pedidoSetQtd } from "../lib/pedido";
import { pushToDataLayer } from "../lib/gtm";
const render = (ctl: HTMLElement) => {
  const item = JSON.parse(ctl.dataset.item || "{}"); const qtd = pedidoQtd(chaveDe(item));
  if (ctl.dataset.estado === String(qtd)) return; // nada mudou: não reescreve (senão o observer entra em loop)
  ctl.dataset.estado = String(qtd);
  ctl.innerHTML = qtd > 0
    ? `<div class="flex h-10 items-stretch border border-vinho bg-vinho text-white" role="group" aria-label="Quantidade no pedido"><button type="button" data-delta="-1" class="w-10 cursor-pointer hover:bg-vinho-deep" aria-label="Menos um">−</button><span class="flex flex-1 items-center justify-center text-sm font-semibold" data-qtd>${qtd} no pedido</span><button type="button" data-delta="1" class="w-10 cursor-pointer hover:bg-vinho-deep" aria-label="Mais um">+</button></div>`
    : `<button type="button" data-delta="1" class="btn-outline w-full">Adicionar ao pedido</button>`;
};
const sincronizar = () => document.querySelectorAll<HTMLElement>("[data-pedido-ctl]").forEach(render);
document.addEventListener("click", (e) => {
  const b = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-pedido-ctl] [data-delta]") : null; if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const ctl = b.closest<HTMLElement>("[data-pedido-ctl]")!; const item = JSON.parse(ctl.dataset.item || "{}");
  const nova = pedidoSetQtd(item, pedidoQtd(chaveDe(item)) + Number(b.dataset.delta));
  render(ctl); if (Number(b.dataset.delta) > 0) pushToDataLayer({ event: "add_to_cart", currency: "BRL", value: item.preco, items: [{ item_id: item.sku, item_name: item.nome, quantity: 1, price: item.preco }] });
  void nova;
});
window.addEventListener("pedido:change", sincronizar);
let agendado = false;
const obs = new MutationObserver((muts) => { if (agendado || !muts.some((m) => [...m.addedNodes].some((n) => n instanceof Element && (n.matches("[data-pedido-ctl]") || n.querySelector("[data-pedido-ctl]"))))) return; agendado = true; queueMicrotask(() => { agendado = false; sincronizar(); }); });
obs.observe(document.body, { childList: true, subtree: true });
sincronizar();

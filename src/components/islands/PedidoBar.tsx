/* Barra fixa de pedido: "3 itens | R$ 412,70 | Pedir pelo WhatsApp", com lista expansível. */
import { useEffect, useState } from "react";
import { ChevronUp, MessageCircle, Trash2 } from "lucide-react";
import { pedidoItens, pedidoLimpar, pedidoMensagem, pedidoSetQtd, pedidoTotal, type ItemPedido } from "../../lib/pedido";
import { buildWhatsappUrl, pushToDataLayer } from "../../lib/gtm";
import { fmtPreco } from "../../lib/tipos-cliente";
export default function PedidoBar() {
  const [itens, setItens] = useState<ItemPedido[]>([]); const [aberto, setAberto] = useState(false); const [pulso, setPulso] = useState(0);
  useEffect(() => { setItens(pedidoItens()); const h = (e: Event) => { setItens((e as CustomEvent<ItemPedido[]>).detail); setPulso((p) => p + 1); }; window.addEventListener("pedido:change", h); return () => window.removeEventListener("pedido:change", h); }, []);
  const n = itens.reduce((a, i) => a + i.qtd, 0); if (!n) return null;
  const enviar = () => { pushToDataLayer({ event: "whatsapp_order_click", wa_location: "barra-pedido", currency: "BRL", value: pedidoTotal(itens), items: itens.map((i) => ({ item_id: i.sku, item_name: i.nome, quantity: i.qtd, price: i.preco })) }); window.open(buildWhatsappUrl(pedidoMensagem(itens)), "_blank", "noopener"); };
  return (
    <div className="barra-entra fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-surface" role="region" aria-label="Seu pedido">
      {aberto && (
        <ul className="container-x max-h-[50vh] divide-y divide-line overflow-y-auto py-2 text-sm">
          {itens.map((i) => (
            <li key={`${i.id}${i.variacao || ""}`} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1"><a href={`/p/${i.slug}/`} className="block truncate font-medium hover:underline">{i.nome}</a><span className="block text-xs text-ink-muted">REF {i.sku}{i.variacao ? ` · ${i.variacao}` : ""}{i.ca ? ` · CA ${i.ca}` : ""}</span></span>
              <span className="flex items-center border border-line-strong"><button type="button" onClick={() => pedidoSetQtd(i, i.qtd - 1)} className="h-9 w-9 cursor-pointer hover:bg-zinco" aria-label="Menos um">−</button><span className="w-8 text-center font-semibold">{i.qtd}</span><button type="button" onClick={() => pedidoSetQtd(i, i.qtd + 1)} className="h-9 w-9 cursor-pointer hover:bg-zinco" aria-label="Mais um">+</button></span>
              <span className="w-24 text-right font-semibold">{fmtPreco(i.preco * i.qtd)}</span>
              <button type="button" onClick={() => pedidoSetQtd(i, 0)} className="flex h-9 w-9 cursor-pointer items-center justify-center text-ink-muted hover:text-erro" aria-label={`Remover ${i.nome}`}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          <li className="flex justify-end py-2"><button type="button" onClick={() => pedidoLimpar()} className="text-xs text-ink-muted underline">Limpar pedido</button></li>
        </ul>
      )}
      <div className="container-x flex min-h-14 items-center gap-3 py-2 sm:gap-6">
        <button type="button" onClick={() => setAberto((a) => !a)} className="etiqueta cursor-pointer" aria-expanded={aberto}>
          <span key={pulso} className="contou"><span className="rot">Pedido</span><span className="val">{n} {n === 1 ? "item" : "itens"}</span></span>
          <span><span className="rot">Total</span><span className="val">{fmtPreco(pedidoTotal(itens))}</span></span>
          <span className="hidden sm:flex"><ChevronUp className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden="true" /></span>
        </button>
        <button type="button" onClick={enviar} className="btn-primary ml-auto min-h-11 px-4 text-sm sm:px-6 sm:text-base" data-wa="barra-pedido"><MessageCircle className="h-5 w-5" aria-hidden="true" />Pedir pelo WhatsApp</button>
      </div>
    </div>
  );
}

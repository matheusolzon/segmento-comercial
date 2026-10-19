/* Bloco de compra da página de produto: variação → preço, REF, estoque e foto; quantidade; WhatsApp com resumo. */
import { useMemo, useState } from "react";
import { MessageCircle, Building2, Minus, Plus, ListPlus } from "lucide-react";
import { buildWhatsappUrl, pushToDataLayer } from "../../lib/gtm";
import { pedidoQtd, pedidoSetQtd, chaveDe } from "../../lib/pedido";
import { fmtPreco } from "../../lib/tipos-cliente";

type Var = { id: number; sku: string | null; atributos: Record<string, string>; preco: number; em_estoque: boolean; estoque: number | null; img800: string | null };
type Props = { id: number; slug: string; nome: string; sku: string | null; ca: string | null; ehEpi: boolean; preco: number; precoMin: number | null; precoMax: number | null; emEstoque: boolean; estoque: number | null; atributos: { nome: string; valores: string[] }[]; variacoes: Var[]; categoria: string };

export default function SeletorVariacao(p: Props) {
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qtd, setQtd] = useState(1);
  const completo = p.atributos.every((a) => sel[a.nome]);
  const v = useMemo(() => p.variacoes.find((x) => p.atributos.every((a) => (x.atributos[a.nome] ?? "") === sel[a.nome])) ?? null, [sel, p]);
  const preco = v ? v.preco : p.precoMin !== null && p.precoMax !== null && p.precoMin !== p.precoMax ? null : (p.precoMin ?? p.preco);
  const emEstoque = v ? v.em_estoque : p.emEstoque;
  const escolher = (attr: string, val: string) => {
    const novo = { ...sel, [attr]: val }; setSel(novo);
    const vv = p.variacoes.find((x) => p.atributos.every((a) => (x.atributos[a.nome] ?? "") === novo[a.nome]));
    if (vv?.img800) { const img = document.querySelector<HTMLImageElement>("[data-foto-produto]"); if (img) { img.src = vv.img800; img.srcset = ""; } }
    pushToDataLayer({ event: "select_item", item_id: vv?.sku ?? p.sku, item_name: p.nome, item_variant: Object.values(novo).join("/") });
  };
  const disponivel = (attr: string, val: string) => p.variacoes.some((x) => x.atributos[attr] === val && p.atributos.every((a) => a.nome === attr || !sel[a.nome] || x.atributos[a.nome] === sel[a.nome]));
  const variacaoTxt = v ? Object.entries(v.atributos).map(([k, x]) => `${k} ${x}`).join(" · ") : "";
  const url = typeof window !== "undefined" ? window.location.href : `/p/${p.slug}/`;
  const msg = emEstoque
    ? [`Olá, Segmento! Quero pedir este item:`, p.nome, [`REF ${v?.sku ?? p.sku}`, variacaoTxt, `Quantidade ${qtd}`].filter(Boolean).join(" · "), preco !== null ? `Preço no site: ${fmtPreco(preco)} cada` : "", p.ca ? `CA ${p.ca}` : p.ehEpi ? "CA: me informem o número, por favor" : "", url, "Pode confirmar disponibilidade e prazo de entrega?", `(pedido pelo site · P${p.sku})`].filter(Boolean).join("\n")
    : [`Olá, Segmento! Este item está sob consulta no site. Tem previsão ou um similar?`, p.nome, [`REF ${v?.sku ?? p.sku}`, variacaoTxt, `Quantidade ${qtd}`].filter(Boolean).join(" · "), url, `(consulta pelo site · P${p.sku})`].join("\n");
  const [noPedido, setNoPedido] = useState(0);
  const itemPedido = { id: p.id, slug: p.slug, nome: p.nome, sku: v?.sku ?? p.sku, preco: preco ?? p.preco, variacao: variacaoTxt || undefined, ca: p.ca };
  const adicionar = () => { if (faltaVariacao) return; const n = pedidoSetQtd(itemPedido, pedidoQtd(chaveDe(itemPedido)) + qtd); setNoPedido(n); pushToDataLayer({ event: "add_to_cart", currency: "BRL", value: (preco ?? p.preco) * qtd, items: [{ item_id: itemPedido.sku, item_name: p.nome, quantity: qtd, price: preco ?? p.preco }] }); };
  const faltaVariacao = p.atributos.length > 0 && !completo;
  const pedir = () => {
    if (faltaVariacao) return;
    pushToDataLayer({ event: "whatsapp_order_click", origin: "pdp", lead_code: `P${p.sku}`, currency: "BRL", value: preco ? preco * qtd : undefined, items: [{ item_id: v?.sku ?? p.sku, item_name: p.nome, item_category: p.categoria, item_variant: variacaoTxt || undefined, quantity: qtd, price: preco ?? undefined }] });
    window.open(buildWhatsappUrl(msg), "_blank", "noopener");
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-[28px] font-semibold leading-9 sm:text-[32px]"><span className="text-[0.6em] font-medium">R$ </span>{(preco !== null ? fmtPreco(preco) : `${fmtPreco(p.precoMin!)} a ${fmtPreco(p.precoMax!)}`).replace(/^R\$\s?/, "")}</p>
        {emEstoque ? <span className="estoque estoque-ok text-[14px]">Em estoque</span> : <span className="estoque estoque-enc text-[14px]">Sob consulta</span>}
      </div>
      <p className="-mt-3 text-xs text-ink-muted">Preço por unidade. Para volume, peça cotação para empresa.</p>
      {p.atributos.map((a) => (
        <fieldset key={a.nome}>
          <legend className="mb-2 text-sm font-semibold">{a.nome}{sel[a.nome] ? <span className="font-normal text-faint">: {sel[a.nome]}</span> : <span className="font-normal text-faint"> (escolha)</span>}</legend>
          <div className="flex flex-wrap gap-2">
            {a.valores.map((val) => { const ok = disponivel(a.nome, val); return (
              <button key={val} type="button" aria-pressed={sel[a.nome] === val} disabled={!ok} onClick={() => escolher(a.nome, val)} className={`chip ${sel[a.nome] === val ? "chip-on" : ""} ${!ok ? "chip-off" : ""}`}>{val}</button>); })}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-line-strong">
          <button type="button" onClick={() => setQtd((q) => Math.max(1, q - 1))} className="flex h-12 w-12 cursor-pointer items-center justify-center hover:bg-zinco" aria-label="Diminuir quantidade"><Minus className="h-4 w-4" /></button>
          <input type="number" min={1} value={qtd} onChange={(e) => setQtd(Math.max(1, Number(e.target.value) || 1))} className="h-12 w-14 border-x border-line-strong text-center text-base outline-none" aria-label="Quantidade" />
          <button type="button" onClick={() => setQtd((q) => q + 1)} className="flex h-12 w-12 cursor-pointer items-center justify-center hover:bg-zinco" aria-label="Aumentar quantidade"><Plus className="h-4 w-4" /></button>
        </div>
        <button type="button" onClick={pedir} disabled={faltaVariacao} className="btn-primary min-h-12 flex-1" data-wa="produto"><MessageCircle className="h-5 w-5" aria-hidden="true" />{emEstoque ? "Pedir pelo WhatsApp" : "Consultar disponibilidade"}</button>
      </div>
      <div className="grid gap-2 xl:grid-cols-2">
        <button type="button" onClick={adicionar} disabled={faltaVariacao} className="btn-secondary min-h-12 whitespace-nowrap"><ListPlus className="h-5 w-5" aria-hidden="true" />{noPedido ? `No pedido (${noPedido})` : "Adicionar ao pedido"}</button>
        <a href={`/empresas/?produto=${encodeURIComponent(p.sku ?? p.slug)}`} className="btn-secondary min-h-12 whitespace-nowrap"><Building2 className="h-5 w-5" aria-hidden="true" />Cotação para empresa <span className="text-xs font-normal text-ink-muted">CNPJ</span></a>
      </div>
      <p className="text-xs text-ink-muted">Resposta em horário comercial pelo WhatsApp ou pelo (11) 3965-0409.</p>
      {faltaVariacao && <p className="text-xs text-faint">Escolha {p.atributos.map((a) => a.nome.toLowerCase()).join(" e ")} para pedir.</p>}
    </div>
  );
}

/* Listagem de categoria com facetas no cliente. Estado na URL (?marca=&tam=&estoque=1&ca=1&preco=).
 * Recebe o subconjunto da categoria já serializado; nada é buscado na rede. */
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import ProdutoCardR from "./ProdutoCardR";
import type { ItemCard } from "../../lib/tipos-cliente";

type Props = { itens: ItemCard[]; marcas: [string, number][]; tamanhos: string[]; titulo: string };
const FAIXAS: [string, number, number][] = [["Até R$ 20", 0, 20], ["R$ 20 a 50", 20, 50], ["R$ 50 a 100", 50, 100], ["Acima de R$ 100", 100, Infinity]];
const LOTE = 24;

const lerUrl = () => {
  if (typeof window === "undefined") return { marca: [] as string[], tam: [] as string[], estoque: false, ca: false, preco: "", ord: "rel" };
  const p = new URLSearchParams(window.location.search);
  return { marca: p.getAll("marca"), tam: p.getAll("tam"), estoque: p.get("estoque") === "1", ca: p.get("ca") === "1", preco: p.get("preco") || "", ord: p.get("ord") || "rel" };
};

export default function FiltrosCategoria({ itens, marcas, tamanhos, titulo }: Props) {
  const [f, setF] = useState(lerUrl);
  const [aberto, setAberto] = useState(false);
  const [limite, setLimite] = useState(LOTE);
  useEffect(() => { setF(lerUrl()); }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    f.marca.forEach((m) => p.append("marca", m)); f.tam.forEach((t) => p.append("tam", t));
    if (f.estoque) p.set("estoque", "1"); if (f.ca) p.set("ca", "1"); if (f.preco) p.set("preco", f.preco); if (f.ord !== "rel") p.set("ord", f.ord);
    const q = p.toString(); const url = window.location.pathname + (q ? `?${q}` : "");
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url);
    setLimite(LOTE);
  }, [f]);

  const lista = useMemo(() => {
    let l = itens;
    if (f.marca.length) l = l.filter((p) => p.marca && f.marca.includes(p.marca));
    if (f.tam.length) l = l.filter((p) => p.tamanhos.some((t) => f.tam.includes(t)));
    if (f.estoque) l = l.filter((p) => p.emEstoque);
    if (f.ca) l = l.filter((p) => !!p.ca);
    if (f.preco) { const fx = FAIXAS.find((x) => x[0] === f.preco); if (fx) l = l.filter((p) => p.precoNum >= fx[1] && p.precoNum < fx[2]); }
    if (f.ord === "menor") l = [...l].sort((a, b) => a.precoNum - b.precoNum);
    else if (f.ord === "maior") l = [...l].sort((a, b) => b.precoNum - a.precoNum);
    else if (f.ord === "nome") l = [...l].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return l;
  }, [itens, f]);

  const toggle = (chave: "marca" | "tam", v: string) => setF((s) => ({ ...s, [chave]: s[chave].includes(v) ? s[chave].filter((x) => x !== v) : [...s[chave], v] }));
  const ativos = f.marca.length + f.tam.length + (f.estoque ? 1 : 0) + (f.ca ? 1 : 0) + (f.preco ? 1 : 0);
  const limpar = () => setF({ marca: [], tam: [], estoque: false, ca: false, preco: "", ord: f.ord });
  const temEpi = itens.some((p) => p.ehEpi);

  const painel = (
    <div className="space-y-6 text-sm">
      <fieldset>
        <legend className="kicker mb-2">Disponibilidade</legend>
        <label className="flex cursor-pointer items-center gap-2 py-1"><input type="checkbox" checked={f.estoque} onChange={(e) => setF((s) => ({ ...s, estoque: e.target.checked }))} className="h-4 w-4 accent-[var(--color-vinho)]" />Só em estoque</label>
        {temEpi && <label className="flex cursor-pointer items-center gap-2 py-1"><input type="checkbox" checked={f.ca} onChange={(e) => setF((s) => ({ ...s, ca: e.target.checked }))} className="h-4 w-4 accent-[var(--color-vinho)]" />Com número de CA</label>}
      </fieldset>
      {marcas.length > 1 && (
        <fieldset>
          <legend className="kicker mb-2">Marca</legend>
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1">
            {marcas.map(([m, n]) => (
              <label key={m} className="flex cursor-pointer items-center justify-between gap-2 py-1"><span className="flex items-center gap-2"><input type="checkbox" checked={f.marca.includes(m)} onChange={() => toggle("marca", m)} className="h-4 w-4 accent-[var(--color-vinho)]" />{m}</span><span className="t-num text-xs text-faint">{n}</span></label>
            ))}
          </div>
        </fieldset>
      )}
      {tamanhos.length > 1 && (
        <fieldset>
          <legend className="kicker mb-2">Tamanho</legend>
          <div className="flex flex-wrap gap-1.5">
            {tamanhos.map((t) => (<button key={t} type="button" aria-pressed={f.tam.includes(t)} onClick={() => toggle("tam", t)} className={`chip min-h-9 min-w-9 px-2.5 text-xs ${f.tam.includes(t) ? "chip-on" : ""}`}>{t}</button>))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="kicker mb-2">Preço</legend>
        <div className="flex flex-col gap-0.5">
          {FAIXAS.map(([r]) => (<label key={r} className="flex cursor-pointer items-center gap-2 py-1"><input type="radio" name="preco" checked={f.preco === r} onChange={() => setF((s) => ({ ...s, preco: s.preco === r ? "" : r }))} onClick={() => f.preco === r && setF((s) => ({ ...s, preco: "" }))} className="h-4 w-4 accent-[var(--color-vinho)]" />{r}</label>))}
        </div>
      </fieldset>
      {ativos > 0 && <button type="button" onClick={limpar} className="text-sm font-semibold text-vinho-deep underline-offset-4 hover:underline">Limpar filtros ({ativos})</button>}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
      <aside className="hidden lg:block"><div className="sticky top-4 bg-zinco p-4">{painel}</div></aside>
      <div>
        <h2 className="sr-only">Produtos</h2>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-muted" aria-live="polite">Mostrando <span className="font-semibold text-ink">{Math.min(limite, lista.length)}</span> de <span className="font-semibold text-ink">{lista.length}</span>{ativos > 0 && <> com filtro</>}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAberto(true)} className="btn-secondary min-h-9 px-3 text-xs lg:hidden"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />Filtrar{ativos > 0 ? ` (${ativos})` : ""}</button>
            <label className="flex items-center gap-2 text-xs text-faint">Ordenar
              <select value={f.ord} onChange={(e) => setF((s) => ({ ...s, ord: e.target.value }))} className="input min-h-9 w-auto py-1 text-sm">
                <option value="rel">Relevância</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="nome">Nome A-Z</option>
              </select>
            </label>
          </div>
        </div>
        {lista.length === 0 ? (
          <div className="border border-line bg-zinco p-8 text-center">
            <p className="font-medium">Nenhum produto com esses filtros em {titulo}.</p>
            <p className="mt-1 text-sm text-ink-muted">A loja física tem mais itens do que o site. Pergunte o que precisa.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" onClick={limpar} className="btn-secondary">Limpar filtros</button><a href={`https://api.whatsapp.com/send?phone=551139650409&text=${encodeURIComponent(`Olá, Segmento! Procuro em ${titulo}: ${[...f.marca, ...f.tam.map((t) => "tam. " + t), f.estoque ? "em estoque" : "", f.ca ? "com CA" : "", f.preco].filter(Boolean).join(", ")}. Vocês têm?`)}`} target="_blank" rel="noopener" data-wa="empty_state" className="btn-primary">Perguntar no WhatsApp</a></div>
          </div>
        ) : (
          <>
            <div className="grade grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
              {lista.slice(0, limite).map((p, i) => <ProdutoCardR key={p.id} p={p} eager={i < 4} />)}
            </div>
            {lista.length > limite && (
              <div className="mt-8 text-center"><button type="button" onClick={() => setLimite((l) => l + LOTE)} className="btn-secondary">Ver mais {Math.min(LOTE, lista.length - limite)} produtos</button></div>
            )}
          </>
        )}
      </div>
      {aberto && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setAberto(false)}>
          <div className="gaveta-entra absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-surface p-5" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Filtros">
            <div className="mb-4 flex items-center justify-between"><h2 className="!text-lg">Filtros</h2><button type="button" onClick={() => setAberto(false)} className="btn-secondary min-h-9 px-2" aria-label="Fechar filtros"><X className="h-4 w-4" /></button></div>
            {painel}
            <button type="button" onClick={() => setAberto(false)} className="btn-primary mt-6 w-full">Ver {lista.length} produtos</button>
          </div>
        </div>
      )}
    </div>
  );
}

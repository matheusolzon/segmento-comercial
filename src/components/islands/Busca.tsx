/* Caixa de busca do header: resultados ao digitar, Enter leva pra /busca/?q=. */
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { buscar, carregarIndice, type ItemBusca } from "../../lib/busca-cliente";
import { pushToDataLayer } from "../../lib/gtm";
import { fmtPreco } from "../../lib/tipos-cliente";

export default function Busca({ grande = false }: { grande?: boolean }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<ItemBusca[]>([]);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = setTimeout(async () => { if (q.trim().length >= 2) { setRes(await buscar(q, 7)); setAberto(true); } else { setRes([]); setAberto(false); } }, 120);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);
  return (
    <form ref={ref} role="search" action="/busca/" method="get" className="relative" onSubmit={() => pushToDataLayer({ event: "search", search_term: q })}>
      <label htmlFor="busca-q" className="sr-only">Buscar produto, REF ou CA</label>
      <div className="flex">
        <input id="busca-q" name="q" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => { carregarIndice(); if (res.length) setAberto(true); }} autoComplete="off" placeholder={grande ? "Busque por nome, REF ou número do CA" : "Buscar por produto, marca, REF ou CA"} className={`input border-r-0 ${grande ? "min-h-14 text-lg" : "min-h-11"}`} />
        <button type="submit" className={`btn-primary px-4 ${grande ? "min-h-14" : "min-h-11"}`} aria-label="Buscar"><Search className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      {aberto && res.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[70vh] overflow-y-auto rounded-[var(--radius-md)] border border-line-strong bg-surface shadow-lg" role="listbox">
          {res.map((p) => (
            <li key={p.id}><a href={`/p/${p.s}/`} className="flex items-center gap-3 px-3 py-2 hover:bg-zinco" onClick={() => pushToDataLayer({ event: "select_item", item_id: p.k, item_name: p.n, item_list_name: "busca" })}>
              {p.i ? <img src={p.i} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" loading="lazy" /> : <span className="h-10 w-10 shrink-0 bg-zinco" />}
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.n}</span><span className="t-ref block text-xs text-faint">{p.m ? `${p.m} · ` : ""}REF {p.k}{p.ca ? ` · CA ${p.ca}` : ""} · {p.cn}</span></span>
              <span className="t-preco shrink-0 text-sm font-semibold">{fmtPreco(p.pr)}</span>
            </a></li>
          ))}
          <li className="border-t border-line"><button type="submit" className="block w-full px-3 py-2 text-left text-sm font-semibold text-vinho-deep hover:bg-zinco">Ver todos os resultados para "{q}"</button></li>
        </ul>
      )}
    </form>
  );
}

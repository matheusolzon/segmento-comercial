/* Página /busca: lê ?q=, carrega o índice e renderiza os cards. */
import { useEffect, useState } from "react";
import { buscar, type ItemBusca } from "../../lib/busca-cliente";
import ProdutoCardR from "./ProdutoCardR";
import { fmtPreco } from "../../lib/tipos-cliente";
import { pushToDataLayer } from "../../lib/gtm";
export default function BuscaPagina() {
  const [q, setQ] = useState(""); const [res, setRes] = useState<ItemBusca[] | null>(null);
  useEffect(() => { const t = new URLSearchParams(window.location.search).get("q") || ""; setQ(t); buscar(t, 120).then((r) => { setRes(r); pushToDataLayer({ event: "view_search_results", search_term: t, results: r.length }); }); }, []);
  if (res === null) return <p className="text-sm text-faint">Buscando…</p>;
  return (
    <>
      <h1 className="mb-1 text-2xl sm:text-3xl">{res.length ? `${res.length} resultado${res.length > 1 ? "s" : ""} para "${q}"` : `Nada encontrado para "${q}"`}</h1>
      {!res.length && <p className="mt-3 max-w-prose text-ink-muted">Tente a REF, o nome da marca ou o número do CA. Se precisar, <a href="/contato/" className="font-semibold text-vinho-deep underline">fale com a loja</a>: boa parte do estoque ainda não está no site.</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {res.map((p, i) => <ProdutoCardR key={p.id} eager={i < 4} p={{ id: p.id, slug: p.s, nome: p.n, marca: p.m, sku: p.k, ca: p.ca, ehEpi: p.c.startsWith("epi/"), preco: fmtPreco(p.pr), precoNum: p.pr, emEstoque: !!p.e, img320: p.i, img800: p.i ? p.i.replace("-320", "-800") : null, n2: p.cn.split(" › ")[1] || "", tamanhos: [] }} />)}
      </div>
    </>
  );
}

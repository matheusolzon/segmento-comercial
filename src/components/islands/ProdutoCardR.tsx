/* Card de produto (React; estático nas páginas, vivo nos filtros). Anatomia no design-guide §Componentes 1. */
import type { ItemCard } from "../../lib/tipos-cliente";
export default function ProdutoCardR({ p, eager = false }: { p: ItemCard; eager?: boolean }) {
  const item = JSON.stringify({ id: p.id, slug: p.slug, nome: p.nome, sku: p.sku, preco: p.precoNum, ca: p.ca });
  const temVar = p.tamanhos.length > 0;
  return (
    <div className="card p-2.5 sm:p-3" data-produto={p.id}>
      <a href={`/p/${p.slug}/`} className="group block">
        <div className="relative aspect-square overflow-hidden bg-surface">
          {p.img320 ? (
            <img src={p.img320} srcSet={`${p.img320} 320w, ${p.img800} 800w`} sizes="(min-width:1024px) 248px, (min-width:640px) 33vw, 50vw" alt="" width={320} height={320} loading={eager ? "eager" : "lazy"} decoding="async" className="h-full w-full object-contain p-[8%]" />
          ) : (<div className="flex h-full items-center justify-center bg-zinco-2 text-xs text-ink-muted">Foto a cadastrar</div>)}
        </div>
        <p className="rotulo mt-3 min-h-[14px] truncate">{p.marca ?? p.n2}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-[15px] font-medium leading-5 text-ink group-hover:underline">{p.nome}</h3>
      </a>
      <div className="etiqueta mt-2 w-full text-[11px]">
        <span className="hidden sm:flex"><span className="rot">REF</span><span className="val">{p.sku}</span></span>
        {p.ca ? <span className="ca"><span className="rot">CA</span><span className="val">{p.ca}</span></span> : p.ehEpi ? <span><span className="rot">CA</span><span className="val text-ink-muted">consultar</span></span> : <span className="sm:hidden"><span className="rot">REF</span><span className="val">{p.sku}</span></span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="text-[20px] font-semibold leading-6"><span className="text-[0.6em] font-medium">R$ </span>{p.preco.replace(/^R\$\s?/, "")}</p>
        <span className={`estoque ${p.emEstoque ? "estoque-ok" : "estoque-nao"}`}>{p.emEstoque ? "Em estoque" : "Esgotado"}</span>
      </div>
      <div className="mt-3">
        {temVar
          ? <a href={`/p/${p.slug}/`} className="btn-outline w-full">Escolher tamanho</a>
          : <div data-pedido-ctl data-item={item}><button type="button" data-delta="1" className="btn-outline w-full">Adicionar ao pedido</button></div>}
      </div>
    </div>
  );
}

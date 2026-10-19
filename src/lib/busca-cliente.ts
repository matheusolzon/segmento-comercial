/* Busca no cliente: REF/SKU exato primeiro, depois Fuse.js sobre o índice /busca.json. */
import Fuse from "fuse.js";
export type ItemBusca = { id: number; s: string; n: string; m: string | null; k: string | null; ca: string | null; c: string; cn: string; pr: number; e: number; i: string | null };
let cache: Promise<ItemBusca[]> | null = null;
let fuse: Fuse<ItemBusca> | null = null;
export const carregarIndice = () => {
  if (!cache) cache = fetch("/busca.json").then((r) => r.json()).then((lista: ItemBusca[]) => { fuse = new Fuse(lista, { keys: [{ name: "n", weight: 0.6 }, { name: "m", weight: 0.2 }, { name: "cn", weight: 0.15 }, { name: "ca", weight: 0.3 }, { name: "k", weight: 0.3 }], threshold: 0.32, ignoreLocation: true, minMatchCharLength: 2 }); return lista; });
  return cache;
};
const SINONIMOS: Record<string, string> = { bota: "botina", botas: "botina", abafador: "protetor auricular", zebrada: "fita zebrada", oculos: "óculos", mascara: "máscara", capacete: "capacete", epi: "", luvas: "luva", placas: "placa" };
const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const buscar = async (q: string, limite = 50): Promise<ItemBusca[]> => {
  const lista = await carregarIndice();
  let t = q.trim(); if (t.length < 2) return [];
  t = t.split(/\s+/).map((w) => SINONIMOS[semAcento(w)] ?? w).filter(Boolean).join(" ");
  const dig = t.replace(/\D/g, "");
  const exatos = lista.filter((p) => (p.k && p.k.toLowerCase() === t.toLowerCase()) || (dig.length === 4 && p.k === dig) || (dig.length === 5 && p.ca === dig));
  const fuzzy = (fuse?.search(t, { limit: limite }) ?? []).map((r) => r.item).filter((p) => !exatos.includes(p));
  return [...exatos, ...fuzzy].slice(0, limite);
};

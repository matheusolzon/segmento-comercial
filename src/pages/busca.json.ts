import type { APIRoute } from "astro";
import { indiceBusca } from "../lib/catalogo";
export const GET: APIRoute = () => new Response(JSON.stringify(indiceBusca()), { headers: { "Content-Type": "application/json; charset=utf-8" } });

/* Configurador de orçamento (fabricação e empresas). Adaptado do QuoteWizard da Celebra:
 * máquina de etapas, zod, deep-link ?tipo=/?segmento=/?produto=, CustomEvent orcamento:select.
 * Saída única: resumo no WhatsApp (ou e-mail, copiar, ligar). Webhook do CRM entra em submitLead(). */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Copy, Mail, MessageCircle, Phone } from "lucide-react";
import type { Flow, OrcamentoConfig, Question } from "../../lib/orcamento-flows";
import { buildWhatsappUrl, genEventId, getUtms, pushToDataLayer, trackMeta } from "../../lib/gtm";

type Props = { config: OrcamentoConfig; entrada?: string };
type Resposta = string | string[];
const contatoSchema = z.object({ nome: z.string().trim().min(2, "Me conta seu nome"), empresa: z.string().trim().optional(), cnpj: z.string().trim().optional() });
const formatCep = (raw: string) => { const d = raw.replace(/\D/g, "").slice(0, 8); return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`; };
const formatCnpj = (raw: string) => { const d = raw.replace(/\D/g, "").slice(0, 14); return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2"); };

export default function OrcamentoWizard({ config, entrada = "pagina" }: Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [r, setR] = useState<Record<string, Resposta>>({});
  const [nome, setNome] = useState(""); const [empresa, setEmpresa] = useState(""); const [cnpj, setCnpj] = useState(""); const [cep, setCep] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const [resumo, setResumo] = useState(""); const [waLink, setWaLink] = useState(""); const [copiado, setCopiado] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null); const montado = useRef(false);
  const flow: Flow | undefined = useMemo(() => config.flows.find((f) => f.id === flowId), [config.flows, flowId]);
  const destaques = config.flows.filter((f) => f.destaque); const demais = config.flows.filter((f) => !f.destaque);

  const selecionar = useCallback((id: string, origem = entrada) => {
    if (!config.flows.some((f) => f.id === id)) return;
    setFlowId(id); setR({}); setErro(null); setStep(1);
    pushToDataLayer({ event: "quote_start", form_id: config.id, flow_id: id, entry_point: origem });
  }, [config, entrada]);

  useEffect(() => {
    const onSel = (e: Event) => { const d = (e as CustomEvent<{ flowId?: string }>).detail; if (d?.flowId) selecionar(d.flowId, "tile"); };
    window.addEventListener("orcamento:select", onSel);
    if (!montado.current) {
      montado.current = true;
      const q = new URLSearchParams(window.location.search);
      const pre = q.get("tipo") || q.get("segmento");
      const produto = q.get("produto");
      if (produto) setR((a) => ({ ...a, itens: `REF ${produto}` }));
      if (pre && config.flows.some((f) => f.id === pre)) selecionar(pre, "deep_link");
    }
    return () => window.removeEventListener("orcamento:select", onSel);
  }, [config.flows, selecionar]);

  const prevStep = useRef(step);
  useEffect(() => { if (prevStep.current !== step) headingRef.current?.focus(); prevStep.current = step; }, [step]);

  const visiveis = (f: Flow) => f.questions.filter((q) => !q.showIf || r[q.showIf.id] === q.showIf.equals);
  const respondido = (q: Question) => { const v = r[q.id]; return Array.isArray(v) ? v.length > 0 : (v || "").toString().trim().length > 0; };
  const completo = !!flow && visiveis(flow).every((q) => q.optional || respondido(q));

  const irContato = () => {
    if (!completo) { setErro("Responde o que falta pra gente orçar certo."); return; }
    setErro(null); setStep(2);
    pushToDataLayer({ event: "quote_step_complete", form_id: config.id, flow_id: flowId, step_id: "perguntas", ...Object.fromEntries(Object.entries(r).filter(([, v]) => Array.isArray(v) || v.length < 40)) });
  };

  const montarResumo = (f: Flow, dados: { nome: string; empresa?: string; cnpj?: string }) => {
    const linhas = visiveis(f).filter(respondido).map((q) => `• ${q.label.replace(/\?$/, "").replace(/\s*\(.*\)$/, "")}: ${Array.isArray(r[q.id]) ? (r[q.id] as string[]).join(", ") : r[q.id]}${q.unit && !Array.isArray(r[q.id]) ? ` ${q.unit}` : ""}`);
    const cab = config.id === "fabricacao" ? `Olá, Segmento! Quero um orçamento de fabricação: *${f.label}*.` : `Olá, Segmento! Quero uma cotação para empresa: *${f.label}*.`;
    const quem = [`Nome: ${dados.nome}`, dados.empresa ? `Empresa: ${dados.empresa}` : "", dados.cnpj ? `CNPJ: ${dados.cnpj}` : "", cep ? `CEP: ${cep}` : ""].filter(Boolean).join(" · ");
    return `${cab}\n${linhas.join("\n")}\n${quem}\n(${config.id === "fabricacao" ? "orçamento" : "cotação"} pelo site · ${config.leadPrefixo}-${f.id})`;
  };

  /** Ponto único de saída do lead. Webhook do CRM (n8n → Kommo) entra aqui. */
  const enviar = (canal: "whatsapp" | "email" | "copy") => {
    if (!flow) return;
    const parsed = contatoSchema.safeParse({ nome, empresa, cnpj });
    if (!parsed.success) { setErro(parsed.error.issues[0]?.message || "Confere seus dados."); return; }
    setErro(null);
    const eventId = genEventId();
    const txt = montarResumo(flow, parsed.data);
    pushToDataLayer({ event: "quote_submit", form_id: config.id, flow_id: flow.id, channel: canal, lead_code: `${config.leadPrefixo}-${flow.id}`, eventId, ...getUtms() });
    trackMeta("Lead", { content_name: flow.label, content_category: config.id }, eventId);
    const url = buildWhatsappUrl(txt);
    setResumo(txt); setWaLink(url); setStep(3);
    if (canal === "whatsapp") window.open(url, "_blank", "noopener");
    if (canal === "email") window.location.href = `mailto:contato@segmentocomercial.com?subject=${encodeURIComponent(`${config.titulo}: ${flow.label}`)}&body=${encodeURIComponent(txt.replace(/\*/g, ""))}`;
    if (canal === "copy") navigator.clipboard?.writeText(txt.replace(/\*/g, "")).then(() => setCopiado(true));
  };

  const totalPassos = 3; const passo = step === 3 ? 3 : step + 1;
  const chip = (on: boolean) => `chip ${on ? "chip-on" : ""}`;
  const setResp = (q: Question, v: string) => setR((a) => {
    if (q.multi) { const atual = Array.isArray(a[q.id]) ? (a[q.id] as string[]) : []; return { ...a, [q.id]: atual.includes(v) ? atual.filter((x) => x !== v) : [...atual, v] }; }
    return { ...a, [q.id]: v };
  });
  const etiqueta = flow && step > 0 && step < 3 ? visiveis(flow).filter(respondido).slice(0, 3).map((q) => `${Array.isArray(r[q.id]) ? (r[q.id] as string[]).join(", ") : r[q.id]}${q.unit ? " " + q.unit : ""}`) : [];

  return (
    <div className="border border-ink bg-surface" data-orcamento>
      <div className="flex items-center justify-between gap-3 border-b border-ink bg-zinco px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="rotulo">{step === 3 ? "Enviado" : config.titulo}</p>
          {flow && step > 0 && <p className="truncate text-sm font-semibold">{flow.label}</p>}
        </div>
        <span className="shrink-0 text-sm text-ink-muted">Passo {passo} de {totalPassos}</span>
      </div>
      {etiqueta.length > 0 && (
        <div className="overflow-x-auto border-b border-line px-4 py-2 sm:px-6"><span className="etiqueta"><span><span className="rot">{flow!.label}</span></span>{etiqueta.map((t, i) => <span key={i}><span className="val">{t}</span></span>)}</span></div>
      )}
      <div className="p-4 sm:p-6">
        {step === 0 && (
          <div>
            <h3 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">{config.passoLabel}</h3>
            <p className="mb-4 text-sm text-ink-muted">{config.subtitulo}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {destaques.map((f) => (
                <button key={f.id} type="button" onClick={() => selecionar(f.id)} className="group flex min-h-16 cursor-pointer items-start justify-between gap-3 border border-line-strong bg-surface px-4 py-3 text-left hover:border-ink">
                  <span><span className="block font-semibold">{f.label}</span>{f.resumo && <span className="mt-0.5 block text-xs text-ink-muted">{f.resumo}</span>}</span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-muted group-hover:text-vinho" aria-hidden="true" />
                </button>
              ))}
            </div>
            {demais.length > 0 && (verTodos
              ? <div className="mt-3 flex flex-wrap gap-2">{demais.map((f) => <button key={f.id} type="button" onClick={() => selecionar(f.id)} className={chip(false)}>{f.label}</button>)}</div>
              : <button type="button" onClick={() => setVerTodos(true)} className="mt-3 text-sm font-semibold text-vinho-deep underline-offset-4 hover:underline">Ver todas as opções</button>)}
          </div>
        )}
        {step === 1 && flow && (
          <div>
            <h3 ref={headingRef} tabIndex={-1} className="mb-4 text-xl outline-none">Sobre {flow.label.toLowerCase()}</h3>
            <div className="flex flex-col gap-5">
              {visiveis(flow).map((q) => (
                <div key={q.id}>
                  <label className="mb-2 block text-sm font-semibold" htmlFor={`q-${q.id}`}>{q.label}{q.optional && <span className="font-normal text-ink-muted"> (opcional)</span>}</label>
                  {q.type === "chips" ? (
                    <div className="flex flex-wrap gap-2" role="group" aria-label={q.label} id={`q-${q.id}`}>
                      {(q.options || []).map((opt) => { const on = Array.isArray(r[q.id]) ? (r[q.id] as string[]).includes(opt) : r[q.id] === opt; return <button key={opt} type="button" aria-pressed={on} onClick={() => setResp(q, opt)} className={chip(on)}>{on && q.multi && <Check className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}{opt}</button>; })}
                    </div>
                  ) : q.type === "number" ? (
                    <div className="flex max-w-[220px] items-center"><input id={`q-${q.id}`} type="number" inputMode="decimal" min={q.min} max={q.max} value={(r[q.id] as string) || ""} placeholder={q.placeholder} onChange={(e) => setR((a) => ({ ...a, [q.id]: e.target.value }))} className="input" /><span className="border border-l-0 border-line-strong bg-zinco px-3 py-2.5 text-sm text-ink-muted">{q.unit}</span></div>
                  ) : (
                    <input id={`q-${q.id}`} type="text" inputMode={q.type === "cep" ? "numeric" : "text"} value={(r[q.id] as string) || ""} placeholder={q.placeholder} onChange={(e) => setR((a) => ({ ...a, [q.id]: q.type === "cep" ? formatCep(e.target.value) : e.target.value }))} className="input" />
                  )}
                </div>
              ))}
            </div>
            {erro && <p className="mt-4 text-sm font-medium text-erro" role="alert">{erro}</p>}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" onClick={() => { setStep(0); setErro(null); }} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar</button>
              <button type="button" onClick={irContato} className="btn-primary" disabled={!completo}>Continuar <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        )}
        {step === 2 && flow && (
          <div>
            <h3 ref={headingRef} tabIndex={-1} className="mb-1 text-xl outline-none">Pra quem enviamos o {config.id === "fabricacao" ? "orçamento" : "a cotação"}?</h3>
            <p className="mb-4 text-sm text-ink-muted">O resumo abre no seu WhatsApp. Se preferir, vai por e-mail.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-2 block text-sm font-semibold" htmlFor="oz-nome">Seu nome</label><input id="oz-nome" type="text" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className="input" /></div>
              <div><label className="mb-2 block text-sm font-semibold" htmlFor="oz-empresa">Empresa <span className="font-normal text-ink-muted">(opcional)</span></label><input id="oz-empresa" type="text" autoComplete="organization" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="input" /></div>
              {config.id === "empresas"
                ? <div><label className="mb-2 block text-sm font-semibold" htmlFor="oz-cnpj">CNPJ <span className="font-normal text-ink-muted">(opcional, agiliza a proposta)</span></label><input id="oz-cnpj" type="text" inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="input" /></div>
                : <div><label className="mb-2 block text-sm font-semibold" htmlFor="oz-cep">CEP de entrega <span className="font-normal text-ink-muted">(opcional)</span></label><input id="oz-cep" type="text" inputMode="numeric" value={cep} onChange={(e) => setCep(formatCep(e.target.value))} placeholder="00000-000" className="input" /></div>}
            </div>
            {erro && <p className="mt-4 text-sm font-medium text-erro" role="alert">{erro}</p>}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => { setStep(1); setErro(null); }} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar</button>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => enviar("email")} className="btn-secondary"><Mail className="h-4 w-4" aria-hidden="true" />Enviar por e-mail</button>
                <button type="button" onClick={() => enviar("whatsapp")} className="btn-primary" data-wa={`wizard-${config.id}`}><MessageCircle className="h-5 w-5" aria-hidden="true" />Enviar pelo WhatsApp</button>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-muted">Seus dados servem só pra este {config.id === "fabricacao" ? "orçamento" : "pedido de cotação"}.</p>
          </div>
        )}
        {step === 3 && (
          <div>
            <h3 ref={headingRef} tabIndex={-1} className="mb-2 text-xl outline-none">Pronto, o resumo está montado</h3>
            <p className="mb-4 text-sm text-ink-muted">Se o WhatsApp não abriu, use um dos botões. A resposta vem em horário comercial.</p>
            <pre className="mb-4 max-h-56 overflow-auto whitespace-pre-wrap border border-line bg-zinco p-3 text-[13px] leading-5">{resumo.replace(/\*/g, "")}</pre>
            <div className="flex flex-wrap gap-2">
              <a href={waLink} target="_blank" rel="noopener" data-wa={`wizard-${config.id}-final`} className="btn-primary"><MessageCircle className="h-5 w-5" aria-hidden="true" />Abrir no WhatsApp</a>
              <button type="button" onClick={() => enviar("email")} className="btn-secondary"><Mail className="h-4 w-4" aria-hidden="true" />Enviar por e-mail</button>
              <button type="button" onClick={() => enviar("copy")} className="btn-secondary"><Copy className="h-4 w-4" aria-hidden="true" />{copiado ? "Copiado" : "Copiar resumo"}</button>
              <a href="tel:+551139650409" className="btn-secondary"><Phone className="h-4 w-4" aria-hidden="true" />Prefiro ligar: (11) 3965-0409</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

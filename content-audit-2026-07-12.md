# MJM Solutions — Full Content, Tone & SEO Audit
**Date:** 2026-07-12 · **Scope:** all 6 public pages + 404, PT source + EN translation (`public/i18n/en.json`), schema, sitemap, robots, llms.txt

---

## 1. Content map — what exists, page by page

### 1.1 Homepage `/` (index.html)
| # | Section | PT content | EN status |
|---|---------|-----------|-----------|
| 01 | Hero | "O software **molda-se** ao seu problema. Não o contrário." + intro (não vendemos pacotes, ouvimos, construímos) + CTA "Marcar conversa gratuita" | ⚠️ Diverges (see §2.1) |
| — | Marquee | Soluções caso a caso · Código 100% do cliente · Acompanhamento próximo · Garantia após entrega | ✅ Matches |
| 02 | Stats ledger | 1º Ouvir primeiro · 100% Código seu · 30 min Diagnóstico gratuito | ✅ Matches |
| 03 | Serviços index | 4 rows: Plataformas de raiz / Menos trabalho manual / Ligar o que já usa / IA em tarefas reais | ✅ Matches — **but links to /servicos are commented out (TODO)** |
| 04 | Prova ("Prova, não promessas") | **Entirely commented out** (waiting for photos) | translated, unused |
| 05 | Casos preview | **Entirely commented out** | translated, unused |
| 06 | Método | 3 cards: Diagnóstico Grátis / Desenho & Proposta / Desenvolvimento & Entrega | ⚠️ Diverges (§2.2–2.4) |
| 07 | Sobre teaser | Quote + 3 team photos + "Quem está do outro lado" | ⚠️ Diverges heavily (§2.5) |
| 08 | CTA rust | "Se o processo cabe numa folha de papel ou de cálculo, nós otimizamo-lo." | ⚠️ EN adds "in 30 minutes" |
| — | Footer | brand blurb, nav, suporte, contactos | ⚠️ PT inconsistent between pages (§4.1) |

### 1.2 `/servicos`
Hero ("O que construímos.") → 4 service blocks, each with: O que é / Sinais de que precisa / Exemplos concretos / O que entregamos + tech note → "Para quem trabalhamos" (PMEs de serviços; hotelaria, restauração, propriedades, serviços profissionais) → CTA "Não sabe em qual encaixa o seu problema?"
**EN status: ✅ faithful, high quality.** Only flag: image alt says "diagrama de fluxo" while the caption says "screenshot real — plataforma" (§3.6).

### 1.3 `/casos`
Hero ("O que construímos, setor a setor.") → 5 examples (Indústria, Saúde, Transportes, Comércio, Serviços profissionais), each: A oportunidade / A solução (4 steps) / O impacto → "Mais casos a caminho" → CTA "Tem um problema parecido?"
**EN status: ✅ faithful.** Tone problems on this page are the most serious on the site (§3.1–3.3).

### 1.4 `/como-trabalhamos`
Hero (filosofia consultiva) → Método em 4 fases (each with "O que recebe") → Como se compra (Diagnóstico / Projeto por fases / Avença) → Garantias por escrito (4) → FAQ (5 Q&A, with FAQPage schema ✅) → CTA.
**EN status: ✅ faithful, the best-translated page.**

### 1.5 `/sobre`
Hero ("Quem está do outro lado.") → História (quote + 2 paragraphs) + "Porquê boutique" + 3 values → Equipa (3 founders with photos, roles, credentials Nova SBE / Nova FCT) → CTA.
**EN status: ❌ major divergence — the EN "story" is a completely different, much richer text (§2.6). Biggest integrity issue on the site.**

### 1.6 `/contactos`
Hero → message form (nome, email, empresa, problema) → direct channels (call, email, WhatsApp, LinkedIn).
**EN status: ✅ mostly matches, but EN has a `direct.note` string ("we reply within 1 business day") with no PT element on the page — content that exists only in translation (§2.7).**

### 1.7 Other
- **404**: fine, `noindex` ✅.
- **apresentacao.html**: JS-bundled deck, `noindex` ✅, not in sitemap ✅.
- **llms.txt / robots.txt / sitemap.xml**: present and coherent ✅.

---

## 2. PT ↔ EN integrity — where the two languages say different things

The EN file is not a translation drift problem in general — most of it is excellent. But in ~8 places the two languages carry **different facts or different positioning**, which means an EN visitor and a PT visitor meet two different companies:

1. **Hero intro (index)** — EN adds content PT doesn't have: *"cross-referencing data, or reading invoices with AI. **We're three pragmatists** building what your company actually needs."* PT never says "three" in the hero. Decide once whether team size belongs in the hero, then align both.
2. **Método card i (index)** — PT: "Grátis"; EN: "Free **/ 30 min**". PT: "Para entender a sua operação em detalhe…"; EN: "So we can understand **where it hurts**…". Different copy, same card.
3. **Método card ii (index)** — PT opens "Cada projeto é diferente."; EN opens "**We don't have rigid price lists.**" Different argument.
4. **CTA note (index)** — EN: "Tell us your problem **in 30 minutes**"; PT has no time anchor.
5. **Sobre teaser (index)** — PT: two short sentences. EN: adds *"complementary backgrounds… (Nova SBE · Nova FCT). We've lived the operation from the inside"*. Also PT value "Verdade antes de venda" vs EN "Scope honesty" (a different value than the PT one).
6. **`/sobre` história — the big one.** PT `historia.a_p`/`b_p` are the short generic paragraphs. EN tells the real story: *"We lived real operations from the inside (hospitality, asset management, P&L, USALI)… The first system was born to solve a problem of our own, not to sell."* and *"Many software teams have never had to close a GOP or reconcile a USALI — we've been there."* **The EN version is far stronger and perfectly on-message ("we live your operation") — my recommendation is to port the EN story back into PT**, not the other way around.
7. **`/contactos`** — EN `direct.note` ("Prefer to write? … we reply within 1 business day") has no PT counterpart on the page; PT eyebrow "(03) — Diretos" vs EN "Direct". Add the note to PT (a response-time promise is trust-building) and change PT to "Contactos diretos".
8. **`/sobre` equipa heading** — PT "Áreas complementares, **uma só equipa**" vs EN "Complementary areas, **the same table**". The EN reads as a literal translation of a phrase PT doesn't use.

**Orphan translation keys** (exist in EN, no element in PT pages — harmless but signal drift): `sobre.chip1–3` (index), `historia.chip1–3` (sobre), `prova.*` and `casos.*` (index sections commented out).

---

## 3. Tone review — measured against your positioning

Your stated positioning: *confident boutique; "everything is possible — we look at your operation and mold the software to it"; do not signal that the company is just starting.* The site's honest, anti-hype voice ("se não fizer sentido, dizemos"; "prova antes de promessa") is genuinely strong and differentiating — **keep it**. But five spots leak "we're new" or talk shop to the visitor:

### 3.1 🔴 `/casos` hero — the single worst line on the site
> "**Ainda não temos um caso âncora com números.** Por agora, cinco exemplos… Os casos reais, com resultados medidos, chegam a seguir."
> EN: "We don't have a flagship case with numbers yet."

This opens your proof page with an apology and confirms exactly what you don't want a prospect to conclude. You can stay honest without self-undermining — lead with capability, not absence:
> *"Cada setor tem os seus gargalos. Cinco exemplos, um por setor, do que sabemos construir — da leitura automática de faturas à previsão de procura."*

### 3.2 🔴 `/casos` meta description (what Google shows)
> "Sem métricas — só a ideia e o resultado."
"No metrics" in the SERP snippet is an anti-ad. Rewrite: *"Cinco exemplos do que construímos, um por setor: leitura de faturas por IA, triagem de mensagens, previsão de procura e mais."*

### 3.3 🔴 `/casos` "Mais casos a caminho"
> "Cada projeto novo entra aqui no prazo de um mês após ir para produção. **É o nosso ativo comercial nº 1 — tratamo-lo como tal.**"
This is internal strategy language addressed at a client. The visitor doesn't care what your commercial asset is. Suggest: *"Esta página cresce projeto a projeto. Os próximos casos, com resultados medidos, entram aqui assim que estiverem em produção."*

### 3.4 🟠 Case studies: tense vs framing contradiction
The hero calls them "exemplos do que sabemos construir", but every case is narrated in the past tense as delivered work ("Uma empresa industrial lançava… **Construímos** um fluxo…"). If a prospect asks for the reference behind one of these, the framing collapses. Safest fix that also solves §3.1: keep the sector scenarios but shift the solution text to capability present tense — *"Um fluxo que lê, valida e regista tudo sozinho"* — under the existing honest banner "O que sabemos construir". No apology, no implied fake clients.

### 3.5 🟠 `/sobre` hero breaks the fourth wall
> "Numa boutique, **o comprador** quer saber quem é a pessoa do outro lado antes de ligar. Aqui está."
It describes the reader's psychology to the reader (and "Aqui está" should be "Aqui estamos" — you're three people). Suggest: *"Antes de nos ligar, é justo saber quem somos. Aqui estamos."*

### 3.6 🟡 "screenshot real" captions
`/servicos` s1's image alt says "diagrama de fluxo" but the caption promises "screenshot real — plataforma"; s2/s3 have caption text with no image at all (hidden). Don't label anything "real" that isn't a product screenshot — it's the kind of small inconsistency a careful buyer notices. Use "exemplo de plataforma" / drop "real" until true screenshots exist.

### 3.7 🟡 Repetition of the honesty close
"Se não for para nós, dizemos também" (and variants) appears in ~4 of the 6 CTA notes. It's your best line — used once or twice it lands, four times it becomes a tic. Keep it on the homepage and contactos; vary the others (e.g. casos: *"Trinta minutos e sai a saber o que faria sentido construir."*).

### 3.8 🟠 Hospitality over-concentration — the examples narrow the "everything is possible" message
Hospitality is fine as proof, but on `/servicos` it dominates the concrete examples and makes the boutique read like a hotel-software shop:
- s1 exemplos: "**Plataforma de back-office hoteleiro**: captura de faturas…" (the lead example)
- s3 sinais: "O seu ERP ou **PMS** faz 80%…" · s3 exemplos: "Integração com **PMS hoteleiro**…" (the lead example)
- para_quem.p opens the list with "**hotelaria e alojamento, restauração, gestão de propriedades**…"

`/casos` already demonstrates breadth (indústria, saúde, transportes, comércio, serviços profissionais) — the fix is to bring `/servicos` in line with it:
- **Diversify the example pool.** Keep ONE hotel example (it's real production software) but rotate the rest across sectors, e.g.: plataforma de gestão de obras com autos de medição (construção); agendamento e faturação a seguradoras (clínicas); ordens de reparação e orçamentos (oficinas); recolha automática de documentos de clientes (contabilistas); gestão de rendas e contratos (imobiliário); timesheets → faturação (agências/consultoras).
- **Reorder so hotel examples never lead a list** — lead with the broadest, most relatable one.
- **para_quem.p**: flip the structure — lead with "qualquer operação com processos manuais" and mention sectors as *examples of* range, not as the definition of the target: *"Trabalhamos com PMEs de serviços de todos os tipos — de clínicas a construtoras, de operadores logísticos a escritórios. Temos software em produção em hotelaria e gestão de propriedades, e o método aplica-se a qualquer operação…"*
- **The right home for the hospitality depth is `/sobre`** (the EN story's USALI/GOP credentials — see §2.6): there it's biography and credibility; on the services pages it reads as a niche.
- **Restore the commented-out casos preview on the homepage** (§1.1) — it's the cheapest way to put five different sectors in front of every visitor.

**What's working (don't touch):** the guarantees section, "código 100% do cliente / sem fidelizações", the FAQ that names the fears out loud ("E se o programador desaparece?"), the consultative método page, the sector breadth of `/casos`, and the confident index meta ("Plataformas em produção, propostas caso a caso").

---

## 4. Grammar & language fixes

### Portuguese
1. **"Percebemos o/do negócio" — inconsistent AND mixed construction.** Index footer + quote: "Percebemos **o** negócio do cliente, não só **de** código" (mixes "perceber algo" with "perceber de algo"). All other pages' footers: "Percebemos **do** negócio do cliente". Pick one and use it everywhere. Cleanest: **"Percebemos do negócio do cliente, não só de código."** (or "…o negócio do cliente, não só o código"). Same fix in `en.json` is already fine ("our clients' business, not just the code").
2. **"co-fundador(es)" → "cofundador(es)"** (Acordo Ortográfico — no hyphen). Appears on index, /sobre (headings, roles) and in the JSON-LD is fine ("founder").
3. **`/sobre` hero: "Aqui está." → "Aqui estamos."** (see §3.5).
4. **`/casos` c5:** "…cláusulas, prazos e valores**, um** trabalho manual…" — comma splice; use travessão: "…valores — um trabalho manual, repetido e…".
5. **`/contactos`: "(03) — Diretos"** → "Contactos diretos" ("Diretos" alone doesn't stand as a noun).
6. **"Índice de quatro"** (index, serviços eyebrow) — reads odd in PT and the EN "Index of four" odder still. Suggest "Quatro frentes" / EN "Four fronts", or simply "(03) — Serviços" alone.
7. Stylistic, not errors: "dizemo-lho" and "otimizamo-lo" are correct (nicely formal — fits the voice).

### English
1. **Mixed US/UK spelling:** "specializing", "optimize", "organization" (US) alongside "catalogue" ×2 (UK). Pick one variety — US is the safer default — so "catalogue" → "catalog", or go UK throughout ("specialising", "optimise").
2. **"Complementary areas, the same table"** → "Complementary skills, one team" (match PT).
3. **"Fix-it warranty"** (prova.d_h3, currently unused) — too casual next to the rest; "Post-delivery warranty".
4. `en.json` `marquee` ends with a trailing "·&nbsp;&nbsp;" the PT doesn't have — harmless, but trim for parity.

---

## 5. SEO map — what to add or change to "pop out"

### 5.1 Structural (do these first)
1. **The English site is invisible to Google.** EN exists only as a JS toggle on the same URL; canonicals and `og:locale` are PT; there is no `hreflang`. Search engines index only PT. If EN visibility matters (foreign-owned hotels/property managers in Portugal are exactly your niche), generate **static `/en/…` pages** from `en.json` at build time + `hreflang="pt-PT"` / `"en"` / `x-default` pairs on every page + EN entries in the sitemap. If EN is deliberately UX-only, that's a valid choice — but make it consciously.
2. **Restore the homepage service-row links** (currently commented out with the TODO). You're losing your best internal links: keyword-rich anchors from the homepage to `/servicos#…`. Same for the commented-out casos preview — right now the homepage body never links to `/casos`.
3. **LinkedIn links are `href="#"` sitewide.** Dead links in footer + contactos. Create the LinkedIn company page (already on your to-do list), wire the real URL, and add it as `sameAs` in the ProfessionalService schema — this is also your main entity-disambiguation signal.
4. **Still pending off-site (from previous session):** verify domain in **Google Search Console** + submit sitemap; create **Google Business Profile** (service-area business, no address shown) — it's the fastest way to appear for "software à medida + [cidade]" searches; keep NAP identical everywhere.

### 5.2 Content / keywords (the real growth lever)
5. **Sector landing pages — biggest gap.** No page targets "software para [setor]" queries, which is how your buyer actually searches. Important: this is an SEO play, **not** a repositioning — the core site should stay broad (§3.8); dedicated landing pages are where sector-specificity belongs, because each one only meets the visitor who searched for that sector. Launch 2–3 in parallel so the set itself signals range, e.g. `/solucoes/hotelaria` (your strongest raw material: back-office platform, invoice capture, PMS→P&L), `/solucoes/clinicas` (message triage, scheduling, insurer billing) and `/solucoes/construcao` or `/solucoes/logistica` (drawing on the casos scenarios). Each page: the sector's 3 pain points, the matching services, one worked example, CTA.
6. **H1s carry zero keywords.** "O que construímos." / "Fale connosco." are great brand voice — keep them — but pair each with a keyword-bearing subhead or first paragraph. E.g. `/servicos` intro already says "software à medida… automação… integrações" ✅; `/casos` and `/sobre` don't. Cheap wins.
7. **A small FAQ/insights section.** Your FAQ answers are already search queries: "Quanto custa software à medida?" is a real query with weak Portuguese results. 3–5 articles ("Quanto custa desenvolver software à medida em Portugal", "Excel vs software à medida: quando mudar", "Automação de processos para PMEs: por onde começar") would target the top of the funnel you currently don't touch. The como-trabalhamos FAQ schema ✅ already proves the pattern.
8. **Rewrite the `/casos` meta description** (see §3.2 — it's simultaneously the worst tone line and the worst SERP line).
9. **Add "Portugal"/geo modifiers** to more titles & descriptions ("…| MJM Solutions" → consider "…em Portugal | MJM Solutions" on servicos/casos). You currently only say Portugal on the homepage.

### 5.3 Schema & technical polish (small)
10. ProfessionalService: add `sameAs` (LinkedIn), consider `address.addressLocality` if you're willing to name a city, and `knowsLanguage`. Consider `Service` JSON-LD on `/servicos` (one per service, mirroring the OfferCatalog).
11. Person schema for the three founders on `/sobre` with `sameAs` → personal LinkedIn profiles (E-E-A-T + disambiguation).
12. Fix the alt/caption mismatch on `/servicos` images (§3.6) — alts are otherwise good.
13. Already done and healthy (no action): canonical URLs, OG/Twitter cards, BreadcrumbList, FAQPage, robots + sitemap, 404/apresentacao noindex, font preloads, GA4 behind consent, llms.txt.

---

## 6. Priority order

| Priority | Action | Sections |
|---|---|---|
| 1 | Rewrite the 3 `/casos` "we're new" leaks (hero, meta description, "ativo comercial") | §3.1–3.3 |
| 2 | Port the EN "história" back into PT `/sobre` (it's your best copy) + align the 8 PT/EN divergences | §2 |
| 3 | Restore homepage internal links; fix LinkedIn `#` links | §5.1 |
| 4 | Grammar pass: percebemos o/do, cofundadores, Aqui estamos, Diretos, EN spelling variety | §4 |
| 5 | Search Console + Google Business Profile + LinkedIn page (off-site) | §5.1 |
| 6 | Broaden `/servicos` examples + para_quem beyond hospitality; restore homepage casos preview | §3.8 |
| 7 | 2–3 sector landing pages in parallel (hotelaria, clínicas, construção/logística) | §5.2 |
| 8 | Decide EN strategy: static `/en/` + hreflang, or UX-only | §5.1 |
| 9 | Case-study tense reframe; vary CTA closes; schema polish | §3.4, §3.7, §5.3 |

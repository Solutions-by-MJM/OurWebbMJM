# Website MJM Solutions

Site institucional da MJM Solutions — software à medida, automação e IA aplicada para PMEs de serviços.

Homepage estática em HTML/CSS, servida por um servidor Node mínimo (sem dependências) para deploy fácil no **Railway**.

## Estrutura

```
.
├── public/                    # tudo o que é servido ao browser
│   ├── index.html             # homepage
│   ├── servicos.html          # /servicos
│   ├── casos.html             # /casos
│   ├── como-trabalhamos.html  # /como-trabalhamos
│   ├── sobre.html             # /sobre
│   ├── contactos.html         # /contactos
│   ├── styles.css             # design system partilhado por todas as páginas
│   ├── favicon.svg
│   └── assets/                # logo e fotos da equipa
├── server.js                  # servidor estático (URLs limpos + $PORT)
├── package.json               # scripts: npm start → node server.js
└── plano-website-mjm-solutions.md   # o plano estratégico completo
```

O `server.js` resolve URLs limpos (`/servicos` → `servicos.html`) e devolve 404 para rotas desconhecidas.

## Correr localmente

```bash
npm start          # arranca em http://localhost:3000
# ou com outra porta:
PORT=4000 npm start
```

Não há passo de build nem `npm install` obrigatório (o servidor não tem dependências).

## Deploy no Railway

1. `railway init` (ou cria o projeto no dashboard e liga este repositório).
2. O Railway deteta Node automaticamente e corre `npm start`.
3. A porta é injetada em `process.env.PORT` — o `server.js` já a usa.
4. Adiciona o teu domínio (ex.: `mjmsolutions.pt`) em Settings → Domains.

Não é preciso configurar mais nada; se preferires, `Start Command` = `node server.js`.

## O que falta preencher (antes do lançamento)

Ver também a PARTE 10 do plano. Marcadores atuais no `index.html`:

- [ ] **Confirmar fotos Júlio/Marcos** — o par team-2 (barba) / team-3 (fato azul) foi atribuído por tentativa
- [ ] **Screenshots reais do produto** — substituir os mockups SVG (hero, serviços, casos)
- [ ] **Links reais** de WhatsApp (`wa.me/...`), LinkedIn e telefone (procurar `href="#"` e `id="wa-link"`/`id="li-link"` em `contactos.html`)
- [ ] **Agendamento** (Cal.com/Calendly) — ligar aos botões "Marcar diagnóstico"
- [ ] **Backend do formulário** (Resend) — atualmente o `contactos.html` abre o email pré-preenchido via `mailto`
- [ ] **Página de Política de privacidade** (o link no formulário e no footer aponta para "em breve")
- [ ] **SEO técnico**: sitemap.xml, schema.org (Organization/LocalBusiness), Search Console

Feito: as 6 páginas (Homepage, Serviços, Casos, Como trabalhamos, Sobre, Contactos), design system partilhado, equipa preenchida.

## Design system (para manter consistência)

Estética editorial/agência (substituiu a versão anterior em cartões arredondados):

- Tipografia: **Archivo** (títulos grandes, maiúsculas) + **Public Sans** (corpo) + **IBM Plex Mono** (rótulos "(01) — Secção", números de índice)
- Cores: fundo escuro `#20211A`, painel `#26281F`, claro `#F4F2EF`, primária terracota `#B26530`, acento `#D98A4E`
- Layout full-bleed (sem `.wrap`/cartões), secções alternam `theme-dark`/`theme-light`/`theme-panel`/`theme-rust`, linhas finas (`border-top`) separam blocos tipo "ledger"
- Componentes reutilizáveis em `styles.css`: `.idx-row` (índice de serviços/casos com hover invertido), `.ledger-row` (stats/fases gigantes), `.lrow` (blocos lettered a./b./c.), `.shot` (placeholder com padrão diagonal para screenshots reais)
- **Importante:** nunca sobrepor `grid-template-columns` via `style=""` inline num elemento `.split-*` — isso vence a media query mobile (que faz `grid-template-columns:1fr` em ecrãs estreitos) por especificidade CSS. Usar antes uma classe dedicada (`.split-7-5`, `.split-5-6`, `.split-8-4`) ou criar uma nova.

# Casos Reais (Real Cases) — English translation draft

Source: public/casos.html
Status: staging draft only, not wired into the live site.

## Meta

- **Title:** Real Cases: Software in Production | MJM Solutions
- **Meta description:** Software case studies in production, with measured results. Anchor case: a hotel back-office platform with AI invoice reading and automatic P&L in USALI format.

## Nav

- Serviços → Services
- Casos → Cases (active)
- Como trabalhamos → How we work
- Sobre → About
- Marcar diagnóstico ↗ → Book a diagnostic ↗

## HERO

- Breadcrumb: Home / Cases
- Highlight label: Software in production
- H1: Software in production,<br>with measured results.
- Index: (01) — Cases
- Intro copy: No lab demos. One well-told anchor case is worth more than five vague ones — and every new project lands here within a month of going into production.

## CASO ÂNCORA (Anchor Case)

- Eyebrow: (02) — Hospitality
- H2: Hotel back-office

### Ficha (spec block)

- Sector: Hospitality
- Client: Independent hotel · Aveiro
- Problem: Manual invoices and monthly close
- Status: In production since 2025

### a. O contexto (The context)

An independent hotel processed dozens of supplier invoices a month by hand. Checking was manual, there was a risk of duplicates, and the monthly P&L was pieced together by hand in spreadsheets using data from the PMS. A slow month-end close, with information scattered and always arriving late.

### b. O problema em detalhe (The problem in detail)

Every paper invoice was entered manually. Someone had to check whether it had already been logged, classify the supplier, and only then transfer the figures to the cost sheet. At month-end, putting together the P&L meant cross-checking all of this against PMS revenue — days of work for a number that was already coming in late.

### c. A solução (The solution)

We built a back-office platform where the team photographs the invoice and the system does the rest: it reads the data (AI), detects duplicates — the system recognizes if the same invoice has already come in, even through a different channel —, automatically classifies the supplier by NIF (Portuguese tax ID), and feeds directly into the monthly P&L, in USALI format (the international standard for hotel operating statements), integrated with PMS revenue.

### Sub-panel (screenshot + steps)

- Screenshot caption: real screenshot — AI invoice reading

- **i. Captura por fotografia (Capture by photo):** The team takes a photo. The AI reads the NIF, amounts and dates — no manual entry.
- **ii. Deteção de duplicados (Duplicate detection):** The system recognizes repeated invoices before payment, even when submitted through different channels.
- **iii. P&L em formato USALI (P&L in USALI format):** Generated in minutes, integrated with PMS revenue. The right number, on time.

### d. Como foi o processo (How the process went)

Built side by side, in short phases. The hotel's team used test versions from early on, and we adjusted based on real usage, not assumptions. The system went into production and has been in daily use since 2025.

## Resultados (Results)

- **Daily** — In use by the team: Running every day since launch in 2025.
- **Minutes** — Monthly close: The P&L is now generated in minutes, when it used to take days.
- **Auto** — Invoices processed: Capture, reading and classification with no manual entry.

Note: Final figures (close time before/after, invoices per month, duplicates detected) are still being measured for publication.

**Tech stack:** web application (TypeScript), AI for document reading, PMS integration, European cloud infrastructure (GDPR-compliant).

## PRÓXIMOS CASOS (Upcoming Cases)

- Eyebrow: (03) — Growing
- H2: More cases on the way
- Copy: Every new project lands here within a month of going into production. It's our #1 commercial asset — we treat it that way.

## CTA

- Eyebrow: (04) — Start here
- H2: Have a similar problem?
- Button: Book a free diagnostic ↗
- Note: Tell us about your process in 30 minutes. If we can help, we'll tell you how. If we can't, we'll tell you that too.

## Footer

- Tagline: Tailored software, automation, and applied AI for service SMEs. We understand the client's business, not just the code.
- Link: Book a diagnostic ↗
- Navigation: Services, Cases, How we work, About
- Support: FAQ, Contacts, Guarantees & GDPR
- Contact: ola@mjmsolutions.pt, WhatsApp, LinkedIn
- Fine print: © 2026 MJM Solutions. All rights reserved. / Tailored software · Portugal

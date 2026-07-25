# MJM Solutions — landing page versions

Open any `v*/index.html` directly in a browser — no build step, no external
requests. Each folder is self-contained: `index.html`, `styles.css`, `main.js`,
`assets/`.

## Round 1 — four art directions

```
v1/  Iso-Blueprint    technical blueprint x civic infographic
v2/  Bio-Gradient     organic-tech x clinical calm
v3/  Editorial Brut   fashion-editorial x data-inlay
v4/  Quiet Greige     quiet luxury x gallery print
```

No direction is blended with another. All image slots in these four are
reserved `<img>` placements filled with flat CSS stand-ins — see "Image slots"
below.

## Round 2 — three variations on Quiet Greige

Same visual world as `v4`, three different ways of opening it. These ship with
**real photography**, generated with Higgsfield (`soul_2`).

```
v4a/  Full Plate     full-viewport photograph bled to all four edges,
                     wordmark laid across its lower third (the v3 landing
                     screen, rebuilt in Quiet Greige)
v4b/  Column         wordmark holds the left, one tall photograph runs the
                     height of the right and bleeds off the right edge
v4c/  Matted Print   every image is a mounted print inside generous matting,
                     captioned like a museum plate (Plate I / II / III)
```

Each varies its label grammar rather than repeating one system: `v4a` uses named
kickers, `v4b` a running numeral index down the left, `v4c` catalogue plate
numbers.

## Shared rules

- **Logo top-left** on every page. The supplied mark is light-on-dark, so on
  light grounds it sits in a dark chip styled to that page's language.
- **Palette** is dark gray + orange throughout (`#b96a3a` family), from the
  existing assets. Each reference's own hues were retuned to it — the reference
  navy/electric-blue, teal/mint and dusty-blue become charcoal, near-black and
  rust — so all seven pages read as one brand.
- **Scrolling background.** A fixed two-layer stage sits behind the page
  (`.bg-stage` → `.bg-a`, `.bg-b`). `main.js` drifts it on scroll and crossfades
  image 1 → image 2 across the middle third. Every page has at least one
  full-bleed window where the ground steps aside and the background is visible:
  the dark bands in `v2`, a dedicated reveal band elsewhere.
- Avoided throughout: 3D blobs, untextured stock photography, blanket rounded
  corners, icon-feature rows, evenly distributed colourful palettes.

## Generated imagery (v4a / v4b / v4c only)

| File | Used as |
|---|---|
| `hero-full.jpg` | `v4a` full-bleed hero · `v4c` mounted Plate I |
| `still-a.jpg` | `v4b` hero column |
| `still-b.jpg` | `v4b` case still |
| `bg-1.jpg` | scrolling background, layer 1 |
| `bg-2.jpg` | scrolling background, layer 2 |

All five are muted earth-tone still lifes — raw concrete, terracotta, dried
botanicals, dark olive — in hard raking light. Two were cropped to remove
artefacts the model invented (a print border, and margin lettering) and all were
re-encoded to JPEG; the originals are not kept. `v4a` applies a warm CSS grade
to pull the capture toward the greige ground.

## Image slots (v1–v4)

Every future image is a reserved slot marked with an `<img>` placement comment
and a `data-slot` attribute, filled with a flat CSS stand-in. Type and negative
space are sized as if the final image were there, so it drops in with no layout
shift.

| Slot | Where |
|---|---|
| `background-1`, `background-2` | all four — the scrolling background pair |
| `hero` | `v1` isometric line-art · `v3` full-bleed portrait |
| `hero-photo-1`, `hero-photo-2` | `v4` — the two offset photographs |

To fill one, set a `background-image` (or place an `<img>`) on that element and
delete its `.slot-tag`.

Real assets used where relevant: `logo-mark.png`, `build-shot-ia.png` and
`shot-plataforma.jpg` (real product screenshots), and `team-1/2/3.jpg` mapped to
Martim / Júlio / Marcos as on the live site.

## Copy

Rewritten from `i18n-en/` for tighter phrasing; every fact unchanged — three
co-founders and their backgrounds, the four service lines, the free 30-minute
diagnostic, case-by-case pricing with the right to stop per phase, client code
ownership, the fix warranty, European hosting and GDPR, and the Aveiro hotel
back-office case in production since 2025.

Two deliberate departures from the references, to avoid inventing facts:

- `v3`'s reference uses star-rated customer reviews. Those boxes carry MJM's own
  written guarantees instead — no fabricated testimonials or ratings.
- No client logos, counts or metrics beyond what `i18n-en/` states, and no
  caption claims a generated still life depicts a real place.

#!/usr/bin/env python3
"""Gera a imagem Open Graph (public/assets/og-image.png), 1200x630.

Ferramenta de desenvolvimento (não faz parte do runtime nem do deploy — o
servidor continua sem dependências). Regenera a imagem de partilha social
sempre que a marca ou a mensagem mudarem.

Requer, apenas para correr este script:
    pip3 install --user pillow fonttools brotli
Corre a partir da raiz do repositório:
    python3 assets-src/make-og-image.py

Usa as fontes auto-alojadas em public/fonts/ (woff2 → TTF em memória) e o logótipo
original em assets-src/originals/logo-full.png, para fidelidade total à marca.
"""
import os
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "public", "fonts")
LOGO = os.path.join(ROOT, "assets-src", "originals", "logo-full.png")
OUT = os.path.join(ROOT, "public", "assets", "og-image.png")

# Paleta da marca (deck corporativo / tema do site)
INK = (32, 33, 26)        # #20211A  fundo escuro
LIGHT = (244, 242, 239)   # #F4F2EF
MUTED = (207, 203, 196)   # #CFCBC4
RUST = (178, 101, 48)     # #B26530
RUST_LT = (217, 138, 78)  # #D98A4E
LINE = (51, 53, 47)       # #33352F


def load_font(woff2_name, size):
    """Carrega uma fonte woff2 como TTF em memória (Pillow não lê woff2)."""
    tmp = os.path.join("/tmp", woff2_name.replace(".woff2", ".ttf"))
    f = TTFont(os.path.join(FONTS, woff2_name))
    f.flavor = None
    f.save(tmp)
    return ImageFont.truetype(tmp, size)


W, H, PAD = 1200, 630, 80
img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)

head_font = load_font("archivo-800-latin.woff2", 76)
sub_font = load_font("archivo-700-latin.woff2", 28)
mono_sm = load_font("ibm-plex-mono-500-latin.woff2", 22)
chip_font = load_font("ibm-plex-mono-500-latin.woff2", 20)

# Linha superior: eyebrow (esq.) + URL (dir.), com régua fina por baixo
d.text((PAD, PAD), "BOUTIQUE DE SOFTWARE — PORTUGAL", font=mono_sm, fill=RUST_LT)
rlabel = "SOLUTIONSBYMJM.PT"
d.text((W - PAD - d.textlength(rlabel, font=mono_sm), PAD), rlabel, font=mono_sm, fill=MUTED)
d.line([(PAD, PAD + 40), (W - PAD, PAD + 40)], fill=LINE, width=1)


def arrow(dx, dy, size, color, width=3):
    """Seta ↗ com a cauda em baixo-esquerda (dx, dy+size)."""
    d.line([(dx, dy + size), (dx + size, dy)], fill=color, width=width)
    hl = size * 0.5
    d.line([(dx + size, dy), (dx + size - hl, dy)], fill=color, width=width)
    d.line([(dx + size, dy), (dx + size, dy + hl)], fill=color, width=width)


# Título (Archivo 800), com palavra em rust
lines = [
    [("O software ", LIGHT)],
    [("molda-se", RUST), (" ao seu", LIGHT)],
    [("problema.", LIGHT)],
]
y, lh = 178, 84
for line in lines:
    x = PAD
    for text, color in line:
        d.text((x, y), text, font=head_font, fill=color)
        x += d.textlength(text, font=head_font)
    y += lh

d.text((PAD, y + 14), "Software à medida · Automação · IA aplicada", font=sub_font, fill=MUTED)

# Rodapé: logótipo (esq.) + chip rust (dir.)
logo = Image.open(LOGO).convert("RGBA")
target_h = 48
logo = logo.resize((round(logo.width * target_h / logo.height), target_h), Image.LANCZOS)
by = H - PAD - target_h
img.paste(logo, (PAD, by), logo)

chip_text = "DIAGNÓSTICO GRATUITO"
ctw = d.textlength(chip_text, font=chip_font)
chip_pad_x, chip_pad_y, arrow_gap, arrow_size = 22, 15, 14, 15
chip_w = ctw + arrow_gap + arrow_size + chip_pad_x * 2
chip_h = 20 + chip_pad_y * 2
cx0 = W - PAD - chip_w
cy0 = by + target_h // 2 - chip_h // 2
d.rectangle([(cx0, cy0), (cx0 + chip_w, cy0 + chip_h)], fill=RUST)
tx = cx0 + chip_pad_x
d.text((tx, cy0 + chip_pad_y - 2), chip_text, font=chip_font, fill=LIGHT)
arrow(tx + ctw + arrow_gap, cy0 + chip_pad_y - 1, arrow_size, LIGHT, width=3)

img.save(OUT, "PNG", optimize=True)
print("wrote", OUT, img.size, os.path.getsize(OUT), "bytes")

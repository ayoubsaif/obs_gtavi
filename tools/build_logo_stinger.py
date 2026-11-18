"""
Renders the GTA VI logo stinger transition used by OBS (transparent WebM, no sound).

    0.00-0.30 s  a sunset-striped dark panel sweeps in from the right and covers the screen
    0.18-0.42 s  the GTA VI logo pops in on the panel
    0.40 s       OBS cuts to the new scene here (TRANSITION_POINT_MS)
    0.62-0.95 s  the panel sweeps out to the left, revealing the new scene

Needs Pillow + an ffmpeg with libvpx-vp9 (imageio-ffmpeg ships one):
    pip install pillow imageio-ffmpeg
    python tools/build_logo_stinger.py
Then run tools/build_obs_scene_collection.py so the collection points at the new file.
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "assets" / "GTAVI_logo.png"
OUT = ROOT / "assets" / "transitions" / "gtavi_logo_stinger.webm"

W, H, FPS = 1920, 1080, 60
DUR = 0.95
SKEW = 320                       # px the panel edge leans (bottom is further left than top)
STRIPE = 46                      # width of each sunset stripe on the panel edges
ORANGE, PINK, PURPLE = (255, 177, 94), (255, 79, 163), (107, 79, 224)
INK = (18, 8, 31)
LOGO_H = 560


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        exe = shutil.which("ffmpeg")
        assert exe, "ffmpeg not found: pip install imageio-ffmpeg"
        return exe


# ---------- easing ----------
clamp = lambda v, a=0.0, b=1.0: min(b, max(a, v))
seg = lambda t, a, b: clamp((t - a) / (b - a))
ease_out = lambda x: 1 - (1 - x) ** 3
ease_in = lambda x: x ** 3
def ease_out_back(x, s=1.9):
    x -= 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def load_logo():
    """The PNG has a white background: flood-fill it from the edges to transparency (the dark outline
    keeps the white letters safe) and soften the cut so the outline stays anti-aliased."""
    rgb = Image.open(LOGO).convert("RGB")
    probe = rgb.copy()
    MARK = (0, 255, 0)
    w, h = rgb.size
    edge = [(x, y) for x in range(0, w, 8) for y in (0, h - 1)] + [(x, y) for y in range(0, h, 8) for x in (0, w - 1)]
    for x, y in edge:   # seed every light pixel on the border (the notches between the V's arms touch only the top)
        p = probe.getpixel((x, y))
        if p != MARK and sum(p) > 3 * 215:
            ImageDraw.floodfill(probe, (x, y), MARK, thresh=60)
    bg = probe.point(lambda v: 255 if v == 255 else 0).getchannel("G")
    bg = Image.composite(bg, Image.new("L", rgb.size, 0),
                         Image.eval(probe.getchannel("R"), lambda v: 255 if v == 0 else 0))
    bg = Image.composite(bg, Image.new("L", rgb.size, 0),
                         Image.eval(probe.getchannel("B"), lambda v: 255 if v == 0 else 0))
    # anti-aliased edge: in a thin band around the background, alpha follows how dark the pixel is
    # and the colour becomes the outline's ink, so no white fringe shows on the dark panel
    band = bg.filter(ImageFilter.MaxFilter(5))
    soft = rgb.convert("L").point(lambda v: int(clamp((255 - v) / 200) * 255))
    alpha = Image.composite(soft, Image.new("L", rgb.size, 255), band)
    alpha.paste(0, mask=bg)
    rgb.paste((26, 0, 48), mask=band)
    logo = rgb.convert("RGBA")
    logo.putalpha(alpha)
    return logo.crop(alpha.getbbox())


def panel_base():
    """Dark ink panel with a soft sunset glow behind the logo and faint scanlines."""
    img = Image.new("RGBA", (W, H), INK + (255,))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    for r, col, a in [(620, PURPLE, 120), (430, PINK, 110), (250, ORANGE, 70)]:
        d.ellipse([W / 2 - r * 1.5, H / 2 - r, W / 2 + r * 1.5, H / 2 + r], fill=col + (a,))
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    img = Image.alpha_composite(img, glow)
    lines = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lines)
    for y in range(0, H, 4):
        d.line([(0, y), (W, y)], fill=(0, 0, 0, 38))
    return Image.alpha_composite(img, lines)


def slanted(draw, x0, x1, fill):
    """Fill the band between two slanted edges whose top points are x0 and x1."""
    if x1 <= x0:
        return
    draw.polygon([(x0, 0), (x1, 0), (x1 - SKEW, H), (x0 - SKEW, H)], fill=fill)


def frame(t, base, logo):
    # a / b = top x of the panel's left (leading) and right (trailing) edges; each edge leans SKEW px.
    # a: off-screen right -> past the left side so the stripes clear the screen (fully covered)
    # b: far enough right that the trailing stripes are off-screen -> 0 (panel gone to the left)
    a0, a1 = W + SKEW, -3 * STRIPE
    b0, b1 = W + SKEW + 3 * STRIPE, 0
    a = a0 + (a1 - a0) * ease_out(seg(t, 0.0, 0.30))
    b = b0 + (b1 - b0) * ease_in(seg(t, 0.62, 0.95))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    ink_mask = Image.new("L", (W, H), 0)
    slanted(ImageDraw.Draw(ink_mask), a + 3 * STRIPE, b - 3 * STRIPE, 255)
    out.paste(base, (0, 0), ink_mask)

    # logo: pops in, drifts, grows a little as it leaves; only visible on the ink panel
    pop = seg(t, 0.18, 0.42)
    if pop > 0:
        s = (0.55 + 0.45 * ease_out_back(pop)) * (1 + 0.04 * seg(t, 0.42, 0.62)) * (1 + 0.18 * ease_in(seg(t, 0.62, 0.9)))
        h = int(LOGO_H * s); w = int(logo.width * h / logo.height)
        lg = logo.resize((w, h), Image.LANCZOS)
        fade = clamp(pop * 2.5) * (1 - ease_in(seg(t, 0.66, 0.9)))
        la = lg.getchannel("A").point(lambda v: int(v * fade))
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        pos = ((W - w) // 2, (H - h) // 2)
        lg.putalpha(la)
        # pink glow under the logo
        sh = Image.new("RGBA", lg.size, PINK + (0,))
        sh.putalpha(la.point(lambda v: v * 0.55))
        layer.paste(sh, pos, sh)
        layer = layer.filter(ImageFilter.GaussianBlur(26))
        layer.alpha_composite(lg, pos)
        clip = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        clip.paste(layer, (0, 0), ink_mask)
        out = Image.alpha_composite(out, clip)

    d = ImageDraw.Draw(out)
    for i, col in enumerate([ORANGE, PINK, PURPLE]):           # leading edge stripes
        slanted(d, a + i * STRIPE, a + (i + 1) * STRIPE, col + (255,))
    for i, col in enumerate([PURPLE, PINK, ORANGE]):           # trailing edge stripes
        slanted(d, b - (3 - i) * STRIPE, b - (2 - i) * STRIPE, col + (255,))
    return out


def main(preview_dir=None):
    logo, base = load_logo(), panel_base()
    n = round(DUR * FPS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(n + 1):
            f = frame(i / FPS, base, logo)
            f.save(Path(tmp) / f"f{i:03d}.png")
            if preview_dir and i % 6 == 0:
                f.save(Path(preview_dir) / f"f{i:03d}.png")
        subprocess.run([ffmpeg_exe(), "-y", "-hide_banner", "-loglevel", "error",
                        "-framerate", str(FPS), "-i", str(Path(tmp) / "f%03d.png"),
                        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "26",
                        "-row-mt", "1", "-auto-alt-ref", "0", "-an", str(OUT)], check=True)
    print(f"OK -> {OUT} ({n + 1} frames, {DUR}s)")


if __name__ == "__main__":
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else None)

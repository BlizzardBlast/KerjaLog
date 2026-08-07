from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets" / "images"
ICON_PACKAGE = ROOT / "assets" / "kerjalog.icon"
ICON_ASSETS = ICON_PACKAGE / "Assets"

SIZE = 1024
PURPLE = "#7138F2"
DARK = "#151218"
WHITE = "#FFFFFF"
BLACK = "#000000"


def ensure_dirs() -> None:
    IMAGES.mkdir(parents=True, exist_ok=True)
    ICON_ASSETS.mkdir(parents=True, exist_ok=True)


def mark_mask(size: int = SIZE) -> Image.Image:
    # Render at 4x and downsample so the simple geometric mark remains crisp.
    scale = 4
    canvas = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(canvas)

    def p(value: float) -> int:
        return round(value * scale * size / SIZE)

    # K stem and branches.
    draw.rounded_rectangle(
        (p(318), p(252), p(408), p(772)),
        radius=p(45),
        fill=255,
    )
    draw.line(
        (p(383), p(512), p(704), p(274)),
        fill=255,
        width=p(92),
    )
    draw.line(
        (p(383), p(512), p(704), p(750)),
        fill=255,
        width=p(92),
    )

    # Evidence Thread nodes are cut through the K stem.
    for y in (350, 512, 674):
        r = p(17)
        cx, cy = p(363), p(y)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)

    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def colorized_mark(color: str, scale: float = 1.0) -> Image.Image:
    base_mask = mark_mask()
    mark = Image.new("RGBA", (SIZE, SIZE), color)
    mark.putalpha(base_mask)
    if scale == 1:
        return mark

    target = round(SIZE * scale)
    scaled = mark.resize((target, target), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    offset = (SIZE - target) // 2
    result.alpha_composite(scaled, (offset, offset))
    return result


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, "PNG", optimize=True)


def build_png_assets() -> None:
    # Standard PNG icon: opaque square, suitable as Expo's generic icon fallback.
    icon = Image.new("RGBA", (SIZE, SIZE), PURPLE)
    icon.alpha_composite(colorized_mark(WHITE))
    icon = icon.convert("RGB")
    save_png(icon, IMAGES / "icon.png")
    save_png(icon, IMAGES / "ios-icon.png")

    # Android adaptive icon layers.
    save_png(colorized_mark(WHITE, 0.82), IMAGES / "android-icon-foreground.png")
    save_png(Image.new("RGB", (SIZE, SIZE), PURPLE), IMAGES / "android-icon-background.png")
    save_png(colorized_mark(BLACK, 0.82), IMAGES / "android-icon-monochrome.png")

    # Splash art stays transparent; app.json supplies the light/dark backgrounds.
    save_png(colorized_mark(WHITE, 0.64), IMAGES / "splash-icon.png")

    # Browser favicon with transparent outer corners.
    favicon = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    rounded = Image.new("RGBA", (56, 56), PURPLE)
    rounded_mask = Image.new("L", (56, 56), 0)
    ImageDraw.Draw(rounded_mask).rounded_rectangle((0, 0, 55, 55), radius=14, fill=255)
    rounded.putalpha(rounded_mask)
    favicon.alpha_composite(rounded, (4, 4))
    tiny_mark = colorized_mark(WHITE, 0.82).resize((56, 56), Image.Resampling.LANCZOS)
    favicon.alpha_composite(tiny_mark, (4, 4))
    save_png(favicon, IMAGES / "favicon.png")


def build_icon_composer_package() -> None:
    svg = """<svg width=\"1024\" height=\"1024\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <defs>\n    <mask id=\"markMask\">\n      <rect width=\"1024\" height=\"1024\" fill=\"black\"/>\n      <rect x=\"318\" y=\"252\" width=\"90\" height=\"520\" rx=\"45\" fill=\"white\"/>\n      <path d=\"M383 512 L704 274\" stroke=\"white\" stroke-width=\"92\" stroke-linecap=\"round\"/>\n      <path d=\"M383 512 L704 750\" stroke=\"white\" stroke-width=\"92\" stroke-linecap=\"round\"/>\n      <circle cx=\"363\" cy=\"350\" r=\"17\" fill=\"black\"/>\n      <circle cx=\"363\" cy=\"512\" r=\"17\" fill=\"black\"/>\n      <circle cx=\"363\" cy=\"674\" r=\"17\" fill=\"black\"/>\n    </mask>\n  </defs>\n  <rect width=\"1024\" height=\"1024\" fill=\"white\" mask=\"url(#markMask)\"/>\n</svg>\n"""
    (ICON_ASSETS / "kerjalog-mark.svg").write_text(svg, encoding="utf-8")

    icon_json = {
        "fill": {"solid": "srgb:0.44314,0.21961,0.94902,1.00000"},
        "groups": [
            {
                "layers": [
                    {
                        "image-name": "kerjalog-mark.svg",
                        "name": "KerjaLog mark",
                        "position": {
                            "scale": 0.82,
                            "translation-in-points": [0, 0],
                        },
                    }
                ],
                "shadow": {"kind": "neutral", "opacity": 0.28},
                "specular": True,
                "translucency": {"enabled": True, "value": 0.18},
            }
        ],
        "supported-platforms": {"circles": ["watchOS"], "squares": "shared"},
    }
    (ICON_PACKAGE / "icon.json").write_text(
        json.dumps(icon_json, indent=2) + "\n",
        encoding="utf-8",
    )


def update_app_json() -> None:
    path = ROOT / "app.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    expo = data["expo"]

    expo["icon"] = "./assets/images/icon.png"
    expo.setdefault("ios", {})["icon"] = "./assets/kerjalog.icon"

    android = expo.setdefault("android", {})
    android["icon"] = "./assets/images/icon.png"
    android["adaptiveIcon"] = {
        "backgroundColor": PURPLE,
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png",
    }

    expo.setdefault("web", {})["favicon"] = "./assets/images/favicon.png"

    plugins = expo.setdefault("plugins", [])
    splash = [
        "expo-splash-screen",
        {
            "backgroundColor": PURPLE,
            "image": "./assets/images/splash-icon.png",
            "imageWidth": 180,
            "resizeMode": "contain",
            "dark": {
                "image": "./assets/images/splash-icon.png",
                "backgroundColor": DARK,
            },
        },
    ]
    replaced = False
    for index, plugin in enumerate(plugins):
        if plugin == "expo-splash-screen" or (
            isinstance(plugin, list) and plugin and plugin[0] == "expo-splash-screen"
        ):
            plugins[index] = splash
            replaced = True
            break
    if not replaced:
        plugins.append(splash)

    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    ensure_dirs()
    build_png_assets()
    build_icon_composer_package()
    update_app_json()

    # The CI workflow is only a transport mechanism for binary assets. Remove it
    # from the generated commit so the repository is not left with a one-off job.
    if os.environ.get("KERJALOG_CI_GENERATE") == "1":
        workflow = ROOT / ".github" / "workflows" / "generate-brand-assets.yml"
        if workflow.exists():
            workflow.unlink()


if __name__ == "__main__":
    main()

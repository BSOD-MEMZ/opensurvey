"""把 docs/brand/out 下的品牌 PNG 转成站点使用的 webp / jpg / ico。

用法（在仓库根目录）:
    python docs/brand/pack-assets.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "brand" / "out"
IMGS = ROOT / "web" / "public" / "imgs"


def fit(src: Image.Image, size) -> Image.Image:
    """等比缩放到指定画布（保持纵横比，居中），返回 RGBA。"""
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    im = src.convert("RGBA")
    im.thumbnail(size, Image.LANCZOS)
    canvas.paste(im, ((size[0] - im.width) // 2, (size[1] - im.height) // 2), im)
    return canvas


def main() -> None:
    mark = Image.open(OUT / "mark@2x.png")
    wordmark = Image.open(OUT / "wordmark@2x.png")
    login_bg = Image.open(OUT / "login-bg@1x.png")
    avatar = Image.open(OUT / "avatar@3x.png")

    # 用户头像占位（通用图形，非任何角色 IP）
    fit(avatar, (400, 400)).save(IMGS / "avatar.webp", lossless=True, method=6)

    # 侧栏小标（透明底）
    fit(mark, (320, 320)).save(IMGS / "s-logo.webp", lossless=True, method=6)

    # 字标：透明 webp + 白底 jpg
    wm = fit(wordmark, (780, 320))
    wm.save(IMGS / "Logo.webp", lossless=True, method=6)
    flat = Image.new("RGB", (780, 320), (255, 255, 255))
    flat.paste(wm, (0, 0), wm)
    flat.save(IMGS / "Logo.jpg", quality=94, optimize=True)

    # favicon：多尺寸 ico
    ico = fit(mark, (256, 256))
    ico.save(IMGS / "favicon.ico", format="ICO",
             sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    # 登录背景
    bg = fit(login_bg, (2884, 1800)).convert("RGB")
    bg.save(IMGS / "create" / "background.webp", quality=88, method=6)
    bg.save(IMGS / "background.webp", quality=88, method=6)

    for name in ["s-logo.webp", "Logo.webp", "Logo.jpg", "favicon.ico", "avatar.webp",
                 "create/background.webp", "background.webp"]:
        p = IMGS / name
        print(f"{name:28s} {p.stat().st_size:>9,} bytes")


if __name__ == "__main__":
    main()

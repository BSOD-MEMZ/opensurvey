"""把上游插画里的橙金配色整体转成 OpenSurvey 的青绿配色。

原理：转 HSV 后只重映射「橙/金」色相带（10°~62°）到「青绿/青」带（158°~190°），
明度与饱和度保持不变，因此插画的立体与明暗关系不变，只有品牌色被换掉。
红色（错误态）、绿色（成功态）、灰白（中性）落在色相带之外，自动不受影响。

用法（仓库根目录）:
    python docs/brand/retint-teal.py
"""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
IMGS = ROOT / "web" / "public" / "imgs"

# 色相重映射：橙金 10°~62° -> 青绿 158°~190°（线性拉伸，保留层次）
HUE_IN_LO, HUE_IN_HI = 10.0, 62.0
HUE_OUT_LO = 158.0
HUE_OUT_SPAN = 0.62


def build_hue_lut() -> list[int]:
    lut = []
    for i in range(256):
        deg = i * 360.0 / 256.0
        if HUE_IN_LO <= deg <= HUE_IN_HI:
            deg = HUE_OUT_LO + (deg - HUE_IN_LO) * HUE_OUT_SPAN
        lut.append(round(deg * 256.0 / 360.0) % 256)
    return lut


HUE_LUT = build_hue_lut()

# 色相落进青绿带之后，顺带压一点饱和度，避免原文的橘色高饱和直接变成刺眼的荧光青
SAT_SCALE = 0.86
SAT_LUT = [min(255, round(i * SAT_SCALE)) for i in range(256)]

TARGETS = [
    "nodata.webp",
    "preview-phone.png",
    "phone-bg.webp",
    "sdk-1.png",
    "sdk-2.png",
    "sdk-3.png",
    "icons/analysis-empty.webp",
    "icons/error.webp",
    "icons/list-empty.webp",
    "icons/overtime.webp",
    "icons/success.webp",
    "icons/unpublished.webp",
    "icons/unselected.webp",
    "create/normal-icon.webp",
    "create/nps-icon.webp",
    "create/register-icon.webp",
    "create/vote-icon.webp",
]


def retint(src: Path) -> tuple[tuple[int, int], int]:
    """返回 (尺寸, 被改动的像素数)"""
    im = Image.open(src)
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    rgba = im.convert("RGBA")
    r, g, b, a = rgba.split()

    hsv = Image.merge("RGB", (r, g, b)).convert("HSV")
    h, s, v = hsv.split()
    h2 = h.point(HUE_LUT)

    # 用「色相是否被改写」当蒙版：只有橘金像素才降饱和，中性/红/绿保持原样
    mask = ImageChops.difference(h, h2).point(lambda x: 255 if x else 0)
    s2 = Image.composite(s.point(SAT_LUT), s, mask)
    changed = sum(1 for p, q in zip(h.getdata(), h2.getdata()) if p != q)

    # 注意：必须 merge 成 HSV 模式再 convert('RGB')，否则 H/S/V 会被当成 R/G/B
    out = Image.merge("HSV", (h2, s2, v)).convert("RGB").convert("RGBA")
    if has_alpha:
        out.putalpha(a)
    out.save(src, optimize=True)
    return im.size, changed


def restore_from_git() -> None:
    """把目标插画还原成仓库 HEAD 里的原始版本，保证重着色可反复重跑而不叠加。"""
    import subprocess

    for rel in TARGETS:
        p = IMGS / rel
        git_path = f"web/public/imgs/{rel}"
        out = subprocess.run(
            ["git", "show", f"HEAD:{git_path}"],
            cwd=ROOT, capture_output=True, check=True,
        ).stdout
        p.write_bytes(out)
        print(f"{rel:34s} 已从 HEAD 还原 {len(out):>9,} bytes")


def main() -> None:
    import sys

    if "--restore" in sys.argv:
        restore_from_git()
        return

    for rel in TARGETS:
        p = IMGS / rel
        if not p.exists():
            print(f"{rel:34s} 跳过（不存在）")
            continue
        size, n = retint(p)
        print(f"{rel:34s} {size[0]:>4}x{size[1]:<4} 重着色 {n:>8,} 像素  {p.stat().st_size:>9,} bytes")


if __name__ == "__main__":
    main()

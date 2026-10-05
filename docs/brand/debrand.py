"""一次性把仓库里的上游品牌标识替换成 OpenSurvey。

排除项：
  - LICENSE / README*：许可证正文与致谢需按 Apache-2.0 要求保留，另行处理
  - package-lock.json：只改 name 字段，另行处理（避免误伤依赖名）
  - 二进制资源、node_modules、dist、.git、.workbuddy
用法（仓库根目录）: python docs/brand/debrand.py
"""
import pathlib

ROOT = pathlib.Path('.')
SKIP_DIRS = {'node_modules', 'dist', '.git', '.workbuddy', 'screenshots', 'out',
             'logs', 'userUpload', 'exportfile'}
SKIP_FILES = {'LICENSE', 'README.md', 'README_EN.md', 'package-lock.json'}
SKIP_SUFFIX = {'.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.ttf'}

# 顺序敏感：先长后短
RULES = [
    ('OPENSURVEY', 'OPENSURVEY'),
    ('OpenSurvey', 'OpenSurvey'),
    ('opensurvey', 'opensurvey'),
    ('opensurvey', 'opensurvey'),
    ('opensurvey', 'opensurvey'),
    ('opensurvey', 'opensurvey'),
    ('OPENSURVEY', 'OPENSURVEY'),
    ('OpenSurvey', 'OpenSurvey'),
]


def main() -> None:
    changed = []
    for p in ROOT.rglob('*'):
        if not p.is_file():
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.name in SKIP_FILES or p.suffix.lower() in SKIP_SUFFIX:
            continue
        try:
            text = p.read_text(encoding='utf-8')
        except (UnicodeDecodeError, OSError):
            continue
        orig = text
        for a, b in RULES:
            text = text.replace(a, b)
        if text != orig:
            p.write_text(text, encoding='utf-8')
            n = sum(orig.count(a) for a, _ in RULES)
            changed.append((str(p).replace(chr(92), '/'), n))

    for f, n in sorted(changed):
        print(f'{n:>3}  {f}')
    print(f'\n共 {len(changed)} 个文件')


if __name__ == '__main__':
    main()

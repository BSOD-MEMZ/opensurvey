"""把源码里硬编码的旧品牌橙换成 OpenSurvey 青绿。

只处理明确的颜色字面量，其他颜色（错误红、成功绿、警示黄）保持不变。
用法（仓库根目录）: python docs/brand/fix-hardcoded-colors.py
"""
import pathlib

REPL = [
    ('rgb(255, 166, 0)', 'rgb(63, 208, 189)'),
    ('#faa600', '#3fd0bd'),
    ('#FAA600', '#3FD0BD'),
    ('#ffa600', '#3fd0bd'),
    ('#FFA600', '#3FD0BD'),
    ('#fef6e6', '#eafcf9'),
    ('#FEF6E6', '#EAFCF9'),
    ('#fbb733', '#5fdccb'),
    ('#d48d00', '#2fa596'),
    ('#fffcf0', '#eafcf9'),
    ('#ff7f0e', '#3fd0bd'),   # 逻辑编排画布的连线色
]

# 这两个文件自身是主题定义，里面的旧色值出现在注释里，跳过
SKIP_SUFFIX = ('styles/sekai.scss', 'styles/variable.scss')
SUFFIXES = {'.vue', '.scss', '.js', '.ts', '.jsx'}


def main() -> None:
    changed = []
    for p in pathlib.Path('web/src').rglob('*'):
        if not p.is_file() or p.suffix not in SUFFIXES:
            continue
        rel = str(p).replace(chr(92), '/')
        if any(rel.endswith(s) for s in SKIP_SUFFIX):
            continue
        t0 = p.read_text(encoding='utf-8')
        t = t0
        for a, b in REPL:
            t = t.replace(a, b)
        if t != t0:
            p.write_text(t, encoding='utf-8')
            changed.append((rel, sum(t0.count(a) for a, _ in REPL)))

    for f, n in sorted(changed):
        print(f'{n:>3}  {f}')
    print(f'\n共 {len(changed)} 个文件')


if __name__ == '__main__':
    main()

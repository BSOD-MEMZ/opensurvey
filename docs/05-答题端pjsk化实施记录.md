# 答题端 pjsk 化：实施记录

> 承接 `04-前端pjsk化评估与样式抽取.md` 的方案 B。
> 字体按需求使用**系统默认字体**，不引入任何外部字体文件。
> 对比图：`docs/screenshots/pjsk-before-after.png`

---

## 一、做法：主题隔离，不碰编辑器

新增**一个**文件 `web/src/render/styles/sekai.scss`（约 470 行），所有规则都挂在 `.sk-theme` 下：

| 挂载点 | 文件 | 说明 |
|---|---|---|
| `<body class="sk-theme">` | `web/src/render/index.html` | 放在 body 上是为了覆盖被 teleport 到 body 的 Element Plus 弹窗 |
| `@import './styles/sekai.scss'` | `web/src/render/App.vue` | 全局样式，非 scoped |

这样做的收益：

- **编辑器零影响**（实测：管理端页面里 `.sk-theme` 规则数 = **0**，body 上也没有该类）。
  题型组件本身是编辑器和答题端共用的，所以**不能**直接改它们的 `style.scss` ——
  用一层主题类包住，等于给答题端单独穿衣服。
- **可一键回滚**：摘掉 `body` 上的类就恢复原样，不用改几十个文件。

覆盖到的组件：进度条、题干卡片、单选/多选、文本/多行输入、评分、NPS、矩阵、排序、滑块、投票、
提交按钮、Element Plus 弹窗、完成页。

---

## 二、关键换算：1rem = 50px

答题端是 750 设计稿 + rem 布局，`render/index.html` 里的 `resetRemUnit()` 按视口宽度算根字号：

```
f = min(min(视口宽, 750) / 7.5, 50)      // 视口 ≤750 时 f = 50
```

实测 `document.documentElement` 的 `font-size` = **50px**，所以：

| 设计值 | rem |
|---|---|
| 10px | 0.2rem |
| 20px | 0.4rem |
| 30px | 0.6rem |
| 40px | 0.8rem |
| 60px | 1.2rem |

写主题时所有尺寸都按这个换算，不要直接写 px。

---

## 三、pjsk 化具体做了什么

### 3.1 布局：改成卡片式

原样式是「白底 + 题目之间一条 5px 灰分割线」。pjsk 是**浅灰底 + 白色圆角卡**：

```scss
#app        { background-color: #f4f6fb; }   /* 页面浅灰 */
.content    { background: #f4f6fb; padding: 0.2rem 0.24rem 0; }
.question-wrapper {
  background: #fff;  border-radius: 0.32rem;  box-shadow: 0 0 0.08rem rgba(68,68,102,.5);
  padding: 0.36rem 0;  margin: 0 0 0.28rem;
  &.spliter { border-bottom: none; }        /* 干掉老分割线 */
}
```

标题/简介（`.main-title-warp .titlePanel`）也做成同款白卡。
注意它原本是 `width: 100%` + padding，加 margin 会右侧溢出，主题里改成了 `width: auto`。

### 3.2 单选 / 多选：换成 pjsk 的方块与圆点

**这里顺手修了一个隐藏问题。** 原实现选中时是这样：

```scss
&.is-checked .qicon.qicon-gouxuan { background-color: $primary-color; border: none; }
```

它靠 `qicon` 图标字体的 `::before` 画勾 —— 但 **`<input>` 是替换元素，不支持伪元素**，
那个勾从来没渲染出来过；真正让人看出"选中"的只是整块被填成主色。
而且图标字体走 `//at.alicdn.com` 远程 URL，离线必挂。

主题改成了 pjsk 的做法 —— 白底 + 图形，全部用 `background-image`：

```scss
.item-input {                       /* 未选中：0.6rem 白色圆角块 + 柔和阴影，无边框 */
  width: 0.6rem; height: 0.6rem; border: none; border-radius: 0.2rem;
  background-color: #fff; box-shadow: 0 0 0.08rem rgba(68,68,102,.5);
  &[type='radio'] { border-radius: 50%; }
}
&.is-checked .item-input[type='checkbox'] {
  background-image: url("data:image/svg+xml,...");   /* pjsk 的粉色勾 #ff77ac */
  background-size: 62%;
}
&.is-checked .item-input[type='radio'] {
  background-image: radial-gradient(circle at 50% 50%, var(--sk-primary) 0 33%, transparent 35%);
}
```

选中项的文案也一起加粗并跟随主题色。

### 3.3 提交按钮：pjsk pushbutton

源站规格直接搬过来：胶囊圆角、统一柔和投影、**按下反馈是换色而不是位移/缩放**。

```scss
.submit-btn {
  min-height: 1.1rem;  border-radius: 0.6rem;
  box-shadow: 0 0 0.16rem rgba(68,68,102,.5);
  background: var(--sk-primary);  color: #444466;
  &:active { background: #e3fcf8; }
}
```

### 3.4 其它

- 题型标签（单选/多选…）：原来的 1px 描边小方框 → 灰色胶囊
- 文本输入：白底圆角 + 柔和阴影，placeholder 用浅灰
- 矩阵：列头加粗、分隔线换成 `#eef1f6`、刻度点用主题色圆点
- 排序：白色卡片行 + 圆形序号徽标
- 滑块：胶囊轨道 + 白色圆形滑块
- 弹窗：白色圆角卡 + 胶囊按钮

---

## 四、主题色仍然跟随问卷设置（没有写死）

pjsk 的青绿不是一个硬编码值，而是**默认值**：

```scss
--sk-primary: var(--primary-color, #77eedd);
```

`--primary-color` 由每份问卷的 `skinConf.themeConf.color` 注入，
所以**问卷作者改主题色，答题页依然跟着变**，只是形状语言固定为 pjsk。

同时把默认值改成 pjsk 青绿，让新建问卷开箱即 pjsk：

| 位置 | 改动 |
|---|---|
| `server/src/modules/survey/template/surveyTemplate/templateBase.json` | `skinConf.themeConf.color`: `#ffa600` → `#77eedd` |
| `web/src/management/config/skinPresets.js` | 新增 3 个预设：`sekai-teal` / `sekai-pink` / `sekai-night` |

实测新建问卷的答题页 `--primary-color` 已为 `#77eedd`。

（已存在的问卷保留它们自己保存的颜色，不会被改。）

---

## 五、验证

| 项 | 结果 |
|---|---|
| `npm run build-only` | 通过 |
| 根字号 | `font-size = 50px` ✔ 与换算一致 |
| 横向溢出 | `documentElement.scrollWidth === clientWidth`（390 = 390），**无溢出** ✔ |
| 卡片几何 | `.question-wrapper` = `left 12 / right 448 / width 436`，与 `.content` 的 12px 内边距吻合 ✔ |
| 编辑器隔离 | 管理端 `.sk-theme` 规则数 = **0**，`body.className` 为空 ✔ |
| 新问卷默认主题色 | `#77eedd` ✔ |
| 视觉 | `docs/screenshots/pjsk-before-after.png`（同页面左原版 / 右 pjsk 主题） |

---

## 六、还没做的

- **管理端（编辑器）没有 pjsk 化**。它有 258 处 Element Plus、20,459 行，
  按方案评估应该走"换皮"（覆写 Element Plus 主题变量），那是下一步。
  现在编辑器预览出来的题还是原样式 —— 但**答题页已经不是了**，两端观感会不一致，
  这是刻意的取舍（先把用户门面做对）。
- 顶部 banner 图、底部 logo 仍是原素材（`/imgs/skin/*.webp`、`/imgs/Logo.webp`），
  要换成 pjsk 风需要重新出图。
- 完成页 / 错误页 / 白名单校验弹窗只做了基础配色统一，没细调。

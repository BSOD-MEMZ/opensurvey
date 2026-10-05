# 前端 pjsk 化：样式抽取结果与重写方案评估

> 抽取来源：`https://sekai-stories.pages.dev/`
> 抽取对象：`/assets/index-PoQpRr9D.css`（21,344 字节 / 1,253 行，未压缩）
> 演示与截图：`docs/style-demo/sekai-ui-demo.html`、`docs/style-demo/sekai-ui-demo.png`

---

## 一、先说一个事实：源站里没有叫 `pushbutton` / `radiobutton` 的类

我全量搜过源站的 CSS 和 3.6 MB 的 JS 包：

| 你提到的名字 | 在源站里的实际情况 |
|---|---|
| `pushbutton` | **不存在**。按钮是 `button.btn-regular` / `.btn-circle` + `.btn-blue/pink/white/red/orange` 五色 |
| `checkbox` | 存在。原生 `input[type=checkbox]` 直接改样式，配 `.checkbox` / `.checkbox__label` |
| `radiobutton` | **不存在**。叫 `.custom-radio-button`，内层选中点叫 `.checkmark` |
| （附）| JS 里出现 11 次 `RadioButton`，是 React 组件名，不是 CSS 类 |

所以下面按**实际存在的类名**整理。如果你说的 `pushbutton/radiobutton` 是别处的命名（比如某个 pjsk UI 组件库），告诉我具体来源，我再去对。

---

## 二、设计令牌

| 令牌 | 值 | 用途 |
|---|---|---|
| 主文字 / 阴影基色 | `#444466` | 所有标题、标签、正文；阴影也是这个色带透明度 |
| 主强调（青绿） | `#77eedd` | `btn-blue` 背景、radio 选中点 |
| 按压背景 | `#e3fcf8` | 按下态背景 |
| 按压文字 | `#77eddd` | 按下态文字色（注意和强调色差一点点，是源站的写法） |
| 次强调（粉） | `#ff5599` | `btn-pink` 背景、选中卡片描边 |
| 勾选线色 | `#ff77ac` | checkbox 勾 |
| 危险 | `#ff2b2b` | `btn-red`，按下态变纯黑 `#000` |
| 警示 | `#ffbb00` | `btn-orange` |
| 表面 | `#ffffff` | 按钮 / 输入框 / checkbox 底 |
| 按钮阴影 | `0 0 8px 0 rgba(68,68,102,.5)` | 按钮、输入框、radio 外圈统一用它 |
| checkbox 阴影 | `0 0 4px 0 rgba(68,68,102,.5)` | 比按钮紧一档 |
| 胶囊圆角 | `30px` | 按钮 |
| 方块圆角 | `10px` | checkbox / 输入框 / 卡片 |

**核心观感公式**：纯色块 + 同色系柔和扩散阴影 + 大圆角 + 深蓝紫灰文字。没有渐变、没有边框线、没有描边（除了 checkbox 未选中时那条 1px 内白边）。

---

## 三、组件规格

### 3.1 Pushbutton

```css
button.btn-regular {          /* 常规按钮 */
  padding: 8px 50px;
  font-size: 20px;
  border-radius: 30px;
  box-shadow: 0 0 8px 0 rgba(68,68,102,.5);
  min-width: 200px;
  min-height: 60px;
}
button.btn-circle {           /* 圆形按钮 */
  font-size: 20px;
  border-radius: 30px;
  box-shadow: 0 0 8px 0 rgba(68,68,102,.5);
  min-width: 60px;
  min-height: 60px;
}
```
五种配色：`btn-blue`(青绿底/深字)、`btn-pink`(粉底/白字)、`btn-white`(白底/深字)、`btn-red`(红底/白字)、`btn-orange`(橙底/深字)。

**按下反馈是"换色"，不是位移或缩放** —— 这点很重要，是这个风格手感的关键：
```css
button.btn-blue:active, button.btn-pink:active { background:#e3fcf8; color:#77eddd; }
button.btn-white:active { background:#a1f4ec; color:#fff; }
button.btn-red:active   { background:#000;    color:#fff; }
```
禁用态：`opacity: .5; cursor: not-allowed`。

⚠️ 适配注意：源站的 `btn-circle` 没有设 `padding: 0`，靠内部是图标撑成正方形才显圆。换成文字内容会变成胶囊。移植时要么保持图标，要么补 `padding: 0`。

### 3.2 Checkbox

原生 input 直接改造，不走伪元素画框：

```css
input[type=checkbox] {
  appearance: none;
  width: 40px; height: 40px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 4px 0 rgba(68,68,102,.5);
}
input[type=checkbox]::before {           /* 未选中：1px 内白边 */
  content: ""; display: block; height: 100%;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px #fff;
}
input[type=checkbox]:checked::before {   /* 选中：换成内联 SVG 勾 */
  box-shadow: none;
  background-image: url("data:image/svg+xml,<svg ...><line stroke='#FF77AC' stroke-width='8'/>...");
  background-size: 70%;
}
```
勾是**内联 SVG data URI**（两条 `line`，`stroke-width: 8`，粉色），不是字体图标、不是伪元素边框画的——**离线可用，这点比底座现在用的 `qicon` 远程字体好**。

### 3.3 RadioButton

```css
.custom-radio-button {          /* 外圈 */
  min-width: 35px; min-height: 35px;
  background: #fff; border-radius: 50%;
  box-shadow: 0 0 8px 0 rgba(68,68,102,.5);
  margin-right: 20px;
}
.custom-radio-button .checkmark {          /* 选中的实心点 */
  width: 25px; height: 25px; border-radius: 50%;
  background-color: #77eedd;
  display: none;
}
.custom-radio-button input[type=radio]:checked + .checkmark { display: inline-block; }
.custom-radio-button input[type=radio] { display: none; }   /* 原生控件直接隐藏 */
```
结构是 `div.custom-radio-button > input[type=radio] + span.checkmark`，选中点靠 `:checked +` 兄弟选择器控制显隐。

### 3.4 文本输入

白底、`border-radius: 10px`、同样的 8px 阴影，**右侧有个铅笔图标**表示"可编辑"（也是内联 SVG data URI，`background-position: 95%`），`padding-right: 50px` 给图标留位。

### 3.5 卡片选择器 `.picker-item`

白边正方形，选中态：`border-color: #ff5599` + `outline: 5px solid #ff5599`，并带 1s 循环 `@keyframes flash` 在粉色和青绿之间闪。桌面端 `:hover` 有 `transform: scale(1.5)`。

### 3.6 字体

源站自托管游戏字体 `FOT-RodinNTLGPro-M / -DB / -EB`（圆体，pjsk 的字感来源），并在多语言下切 Google Fonts 的 Noto Sans 系列。

---

## 四、必须提醒的一件事：字体和素材是 SEGA / Colorful Palette 的 IP

- `FOT-RodinNTLGPro` 是 pjsk 游戏内**商用字体**，源站是直接托管 `.otf` 的。
- 那个站还有 Live2D 模型（`live2dcubismcore.js`）和角色素材。

**配色、圆角、阴影、交互手感这些"设计语言"本身不算受保护的内容，照抄没问题**；但字体文件、角色立绘、游戏 UI 图片这些是实打实的 IP。如果这个项目只在本地/内网跑，无所谓；**一旦要公开发布或挂到公网，字体和素材会是风险点**。

我的建议：**照抄设计语言，字体换成免费的圆体**（比如 Noto Sans SC + 思源黑体圆体方向，或者像 MiSans / HarmonyOS Sans 这类可商用字体）。演示页里我就是这么做的，用的 `Noto Sans SC`。

---

## 五、现有前端体量（实测）

```
web/src                        345 文件   33,901 行
├─ management（管理端+编辑器）  179 文件   20,459 行
├─ materials（题型物料+设置器） 113 文件    9,324 行
├─ render（答题端）              43 文件    3,309 行
└─ common                        10 文件      809 行
```

Element Plus 依赖深度：

| 子应用 | `<el-*>` 使用次数 | 说明 |
|---|---|---|
| management | **258 处** | 深度依赖：表格、表单、弹窗、菜单、上传…… |
| render | **仅 3 处** | 2 个 `el-input` + 1 个 `el-dialog` |

**这个数字是决策的关键**：答题端的题型组件（单选/多选/矩阵/排序……）本来就是手写的原生 HTML/CSS，几乎不沾 Element Plus。也就是说 **答题端 pjsk 化 ≈ 换 CSS + 小改组件，不是重写**。

另外管理端里有 **LogicFlow** 画的逻辑编排画布（`logicModule/components/nodeExtension/`），这是上游最值钱的资产之一，重写等于扔掉。

---

## 六、三个方案

### 方案 A：换皮（保留架构，只换视觉）

- 做一套 pjsk 设计令牌（SCSS 变量）+ 覆写 Element Plus 主题变量 + 按需覆写高频组件样式（table / dialog / form / button / menu）。
- **改动量**：样式层为主，约 20~30 个 SCSS 文件，JS 基本不动。
- **风险**：低。随时可回退。
- **效果**：整体观感立刻变；但 Element Plus 有 258 处，边角（表格密度、菜单、日期选择器）需要逐个调，覆盖率大概 70% 观感。
- **代价**：逻辑编排画布（LogicFlow 自带样式）要单独调，成本较高。

### 方案 B：答题端独立重做（推荐）

- 只重做 `render`（3,309 行 / 43 文件），做成**纯 pjsk 风格**，把 Element Plus 那 3 处也一起拔掉。
- 它是独立的 MPA 入口 + 独立路由 + 独立 store，**和管理端解耦**，可以单独上线。
- **改动量**：3.3k 行里主要是题型组件和页面壳，重写约 1.5~2k 行。
- **风险**：低（不动管理端、不动服务端、不动数据协议）。
- **效果**：答题页是"给受访者看的门面"，视觉收益最大。
- 题型物料可以被 render 复用（物料协议不变），所以**不会推翻上游**。

### 方案 C：彻底重写整个前端

- 连管理端一起重做，含 20,459 行 + LogicFlow 逻辑编排 + 254 处 Element Plus。
- **风险**：极高。编辑器（拖拽、物料加载、自动保存、协同 session、逻辑画布）是上游最核心的资产，重写等于放弃后续同步上游的能力。
- **收益**：视觉一致性最彻底，但 pjsk 化本质是**视觉语言问题，不是架构问题**——用 A+B 能拿到 90% 的效果。

### 我的建议

**先做 B，再做 A。** 理由：

1. B 的成本最低、视觉收益最大，而且**立刻能截图给你看**，可以直接判断这个方向对不对。
2. 做完 B 之后你手里就有一套验证过的 pjsk 组件库（按钮/勾选/单选/输入框/卡片），A 直接复用，不用重做。
3. C 的风险和收益不成比例。真要做，也应该在 B+A 之后做——那时你已经有设计系统和组件库，重写才是可控的，而不是现在把 3.4 万行推倒重来。

---

## 七、需要你拍板

1. **走哪个方案？** 我的建议是先 B（答题端重做），验证方向后再 A。
2. **字体怎么定？** 用免费的圆体（Noto Sans SC / MiSans 等），还是先按游戏字体效果做、发布前再换？
3. **`pushbutton` / `radiobutton` 这两个名字的出处** —— 如果是从别的地方看到的（某个 pjsk UI 组件库），给我链接，我再抽一遍；源站里确实不叫这个名。

<!-- 请先阅读贡献说明：见仓库 README 的「参与贡献」一节 -->

### 改动内容
<!-- 一个 PR 只做一件事。用 1、2、3… 分序号描述改动点 -->

### 相关 Issue
<!-- 较大的改动请先开 Issue 讨论，避免白做工 -->

### 自检
- [ ] `cd server && npx tsc --noEmit` 无错误
- [ ] `cd web && npm run build-only` 通过
- [ ] `cd server && node scripts/smoke-test.mjs` 全绿（需先起 `npm run local`）

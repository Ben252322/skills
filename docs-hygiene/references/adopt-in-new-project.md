# 在新项目落地（adoption guide）

目标：30 分钟内让一个现有项目获得「文档防腐」三件套——**索引与约定、机械门禁、事件挂点**。

## 第 1 步：建立 docs/ 索引与约定

创建 `docs/README.md`，包含四块内容（可直接改写 `maintenance-rules.md` 作为内容源）：

1. 状态图例（活文档 / 设计·已实施 / 设计·实施中 / 待结项）
2. 索引表（每篇文档一行：路径、状态、用途）
3. 权威源指认表（按项目实际调整：字段→源码、索引→基础设施脚本、页面→路由配置、历史→git）
4. 五条硬规则原文

然后把既有 docs 按三态归类进 `design/` / `runbooks/`，删除一次性文档（判据：三问）。

## 第 2 步：机械门禁（不可跳过，这是唯一自动生效的部分）

```bash
# 1. 拷贝脚本（按项目调整 scripts/check-docs-links.js 顶部配置区：
#    ROOT_FILES 填项目根级常被引用的活文档；SCAN_JS_DIRS 填实际目录）
cp <本skill>/scripts/check-docs-links.js <项目>/scripts/

# 2. package.json 接线
```

```json
{
  "scripts": {
    "check:docs": "node scripts/check-docs-links.js",
    "test:verify": "npm run lint && npm run check:docs && npm run test:unit && npm run test:integration"
  }
}
```

验证：`npm run check:docs` 输出 `OK: N 处文档引用全部可达`；故意删一篇被引用的文档，确认退出码 1。

豁免机制：确需引用「示例路径 / 规划中文件」时（如模板文档、规范文档本身），在仓库根放
`.check-docs-ignore`，每行一个字面引用。慎用——豁免等于人为制造死链。

## 第 3 步：写进 agent 规范（AGENTS.md / CLAUDE.md）

在项目的 agent 规范文件追加一节（全文见下），让每次编码会话都读到规则：

```markdown
## Documentation hygiene

1. 创建/移动/删除任何文档前读 docs/README.md——它是索引与维护契约。
2. 文档只写决策、约束、理由、教训；字段表/页面清单/测试数/部署参数等可从代码或 git
   导出的事实不得写入文档，改为指认权威源。平行真相必然漂移。
3. 引用 docs/** 路径必须真实存在；npm run check:docs 已挂入 test:verify，死链提交门禁失败。
4. 新增文档登记索引 + 文件头含日期与状态，与创建它的 commit 同批。
5. 状态头（状态：）与令其失效的代码变更同一个 commit 更新。
6. 一次性文档（已完成的实施计划、时点报告、已完工的 init runbook）直接删除，git 即归档。
```

## 第 4 步：挂发布事件（低频人工检查的唯一入口）

在发布 checklist 的「发布后」阶段加一项：

```markdown
- [ ] **文档结项**：本次发布产生的临时文档（发布待办、审计报告、验收记录）——行动项
      已关闭的，按 docs/README.md 约定并入对应活文档后删除；仍在等待的登记为「待结项」。
```

## 不做什么

- 不装 git pre-commit hook 跑 check:docs（可被 --no-verify 绕过，且拖慢提交）；门禁由 agent 规范的工作流保证，需要自动兜底时再评估。
- 不设「每季度文档 review」——没有所有者的定时任务必然消亡，检查全部挂在既有事件上。
- 不为通过门禁给文档加 coverage-ignore 式豁免；引用不通就修引用或删文档。

# skills

可复用的 agent skills 集合。每个子目录是一个独立 skill，遵循
[SKILL.md 规范](https://code.claude.com/docs/zh-CN/skills)（YAML frontmatter：name + description）。

## Skills 列表

| Skill | 用途 |
| --- | --- |
| [docs-hygiene](./docs-hygiene/) | 项目文档防腐：目录约定、设计文档生命周期、引用可达性门禁 |

## 使用方法

**作为 agent skill 加载**（CodeBuddy / Claude Code）：

```bash
# 用户级（所有项目可用）
cp -r docs-hygiene ~/.codebuddy/skills/

# 或项目级（随仓库共享给协作者）
cp -r docs-hygiene <项目>/.codebuddy/skills/
```

加载后，涉及文档结构、文档去留、文档漂移、设计文档归档时机的任务会自动触发。

**只取机械门禁**（不想引入整套标准）：

```bash
cp docs-hygiene/scripts/check-docs-links.js <项目>/scripts/
# 按脚本头注释调整配置区，然后 package.json：
#   "check:docs": "node scripts/check-docs-links.js"
#   "test:verify": "npm run lint && npm run check:docs && <既有门禁>"
```

## 新增 skill

1. `mkdir <skill-name>`，按规范写 `SKILL.md`（第三人称 description，正文用指令式）
2. 重资源放 `scripts/`（可执行）、`references/`（按需加载的参考）、`assets/`（输出素材）
3. 回到本 README 登记一行

## 来源

- `docs-hygiene`：提炼自 keshiqing-miniapp 仓库 2026-10-16/17 的文档重组实践
  （16 篇文档清点 → reviewer subagent 评审 → 重组 + 门禁落地），含评审修正后的结论。

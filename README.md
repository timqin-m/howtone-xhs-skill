# howtone-xhs-skill (XHS Catch)

小红书笔记采集与痛点分析工具。基于 Kimi WebBridge 模拟真人浏览器操作，批量抓取指定关键词下的笔记数据（标题、正文、作者、图片、点赞/收藏及高赞评论等），并能一键同步数据到「好痛 Howtone」平台，进行 AI 自动分析、商机提炼与文案生成。

## 风险提示与免责声明

1. **账号风险**：本工具通过模拟真人浏览器行为进行数据采集。由于平台策略等不可抗力，频繁、高并发地运行可能导致小红书账号受到限制、冻结或封禁。请避免使用个人主力账号或频繁大批量抓取，并合理控制采集频率。
2. **合理使用**：本工具仅用于学术研究、市场分析及个人学习交流。严禁利用本工具进行任何恶意攻击、高并发网络请求或大规模商业化爬虫等违反法律法规的行为。
3. **免责声明**：作者与开发者不承担任何因使用本工具（包括但不限于账号异常、服务中断、数据泄露、版权/知识产权纠纷等）而产生的直接或间接法律责任及连带责任。使用本工具即代表您已了解并自愿承担相应的风险。

---

## 📦 安装方法 (通过 `npx skills`)

你可以通过 Vercel 官方的 `skills` CLI 将本技能直接安装到你的 AI 助手项目（支持 Claude Code, Cursor, Cline, GitHu Copilot 等 18+ 种 AI Agent 客户端）中。

在项目根目录下执行以下命令：

```bash
npx skills add timqin-m/howtone-xhs-skill
```

安装完成后，技能文件将被放置在项目的 `.codebuddy/skills/howtone-xhs-skill`、`.claude/skills/howtone-xhs-skill` 或相应的 Agent 技能目录中。

## 🚀 快速开始

进入安装后的技能脚本目录安装依赖：

```bash
cd .codebuddy/skills/howtone-xhs-skill/scripts
npm install
```

### 1. 小红书扫码登录（生成 cookies.json）
```bash
npx ts-node login.ts
```

### 2. 开始采集笔记
```bash
npx ts-node webbridge-crawl.ts --keyword="早C晚A 翻车" --limit=10
```

### 3. 生成本地 HTML 可视化报告
```bash
npx ts-node generate-report.ts
```

### 4. 同步至「好痛 Howtone」分析平台
- 首先保存好痛 Token 凭证：
  ```bash
  npx ts-node zion-login.ts --token="你的同步Token"
  ```
- 上传并同步采集结果：
  ```bash
  npx ts-node sync.ts --file=output/你的采集文件.json
  ```

---

## 🛠️ 仓库目录结构

本仓库严格遵循 `Agent Skills` 规范，所有资源均存放在 `skills/howtone-xhs-skill/` 目录下：

```text
.
├── README.md               # 仓库全局说明
├── .gitignore              # Git 忽略配置
└── skills/
    └── howtone-xhs-skill/  # 技能主目录
        ├── SKILL.md        # 技能系统提示词 (Prompt Instructions)
        └── scripts/        # 自动化脚本及依赖
            ├── login.ts
            ├── webbridge-crawl.ts
            ├── generate-report.ts
            ├── zion-login.ts
            ├── sync.ts
            ├── package.json
            └── tsconfig.json
```

## 📄 License

MIT License

# Interesting Mini Program

每天做一个有趣的小程序：文科、工科、理科、游戏和生活都可以成为灵感。每个程序独立编号，可以在本地运行，也能从 GitHub Pages 直接体验。

**[在线编号入口](https://yoimiya-610.github.io/Interesting-Mini-Program/) · [index 索引表](index.md) · [更新日志](CHANGELOG.md)**

## 本地启动

需要 Node.js 22 或更新版本。运行程序无需安装依赖，也无需账号、API Key 或网络。

Windows：下载/克隆仓库，双击 `start.cmd`。

命令行（Windows / macOS / Linux）：

```sh
git clone https://github.com/yoimiya-610/Interesting-Mini-Program.git
cd Interesting-Mini-Program
npm start
```

打开 <http://127.0.0.1:4173/>，按编号搜索。001 直达：<http://127.0.0.1:4173/apps/001-orbit-garden/>。按 Ctrl+C 停止服务器。端口冲突时可设置 `PORT`，例如 PowerShell：`$env:PORT=4180; npm start`。

还可以直接双击 `public/index.html`，或任一程序目录内的 `index.html`，离线打开。

## 每日交付

北京时间 **每天 04:00**，由本机 Codex 定时任务启动建设流程。始终按已合并程序的最大编号递增；2026-10-26 应用户追加指令完成 002、003，下一编号为 **004**。任务在本会话继续，使用这个仓库的本地路径；不需要 API Key。

本机任务需要电脑开机、保持唤醒、桌面应用运行、GitHub CLI 登录有效，且开发/推送/合并权限可用。此任务不是 GitHub 云端 AI 定时任务；GitHub Actions 负责验收与发布。首次计划执行为 2026-10-27 04:00（北京时间）。

流程：同步 main → 检查当天已有交付和未完成 PR → 选择不同题材/玩法/风格 → 分配连续编号 → 实现并本地验证 → 更新元数据、索引、日志 → 建 PR → 等待自动验收 → 审查变更 → 验收通过后合并 → 确认 Pages 发布。相同北京时间日期只交付一个新编号；失败后优先续作，不创建重复程序。

至少在功能、玩法、风格三项中的一项与其他程序有实质区别，不能只改配色或文案。题材轮换，避免一直做同类游戏。合并不要求作者给自己提交 GitHub APPROVE；由自动测试和代码审查完成验收。失败、冲突、未解决修改要求或待完成检查都会阻止验收脚本合并。

## 开发和验证

```sh
npm ci                 # 仅开发/浏览器测试需要安装依赖
npm run next           # 北京日期、下一编号、近期主题
npm run build          # 生成 public/index.html 和 index.md
npm run check          # 元数据、索引、语法、离线依赖、服务器、001 逻辑检查
npx playwright install chromium
npm run test:e2e       # 桌面与手机核心流程
npm run accept -- 12   # 已审查且 CI 成功后，验收并合并指定 PR
```

详细交付约束见 [AGENTS.md](AGENTS.md)。GitHub Pages 只发布 `public/`，PR 通过后 main 的验证成功才触发部署。所有访问路径为相对路径，兼容仓库子路径和本地文件打开。

## 结构

```text
programs.json                     程序目录数据，编号唯一
index.md                          自动生成的直达索引表
public/index.html                 自动生成的网页入口
public/apps/001-orbit-garden/      001 引力花园
public/apps/002-story-fold/        002 故事折叠机
public/apps/003-probability-rain/  003 概率落雨
scripts/                          本地服务、索引生成、验收工具
tests/                            功能和浏览器验收
.github/workflows/                PR 验证与 Pages 发布
CHANGELOG.md                      按日期和编号记录交付
```

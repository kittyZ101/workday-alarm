# 上班脑 · 大小周调休闹钟（可部署版）

面向中国上班族的排班工具：把「大小周 / 单休 / 双休」和「法定节假日 + 调休补班」合成一份准确的上班日历，并生成**分享链接**和**可订阅日历**。

## 一句话价值
> 你只设一次，以后系统每天早上自动判断：今天到底响不响。

## 已实现
- 排班规则：双休 / 单休 / 大小周（可设基准周一与小周）
- 官方节假日多年份结构（内置 2026 基线，2027/2028 待公布占位 + 在线更新）
- 手动纠正：额外放假、额外补班
- 月历 + 本周 + 本月上/休班统计
- 「明天闹钟要不要响」建议
- 下载 `.ics` 工作日历
- **生成分享链接**：别人打开即看到同一份排班
- **日历订阅链接**：iOS/安卓日历订阅后，作者更新会自动同步
- iPhone 快捷指令闹钟四步配置引导（每天自动化 + 上班日闹钟）
- PWA：可添加到主屏幕

## 本地运行
```bash
npm install
npm run dev
```
- 前端：http://localhost:5173
- 后端：http://localhost:3000

## 可部署运行（生产模式）
```bash
npm run prod
```
`prod` 会先构建前端，再用 Node 后端同时托管 API、订阅链接和静态页面，访问 http://localhost:3000 即可。

## 部署到 GitHub Pages（纯静态分享）
GitHub Pages 只能托管静态前端，跑不了后端。因此：
- **分享链接可用**：把排班规则压缩进 URL，同事打开就能看到同一份日历。
- **自动同步订阅不可用**：需要后端；对方可以直接下载 `.ics` 导入。

步骤：
1. 在 GitHub 新建仓库（建议名 `workday-alarm`）。
2. 本地初始化并推送：
   ```bash
   cd workday-alarm
   git init
   git add .
   git commit -m "init: 上班脑 Web MVP"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/workday-alarm.git
   git push -u origin main
   ```
3. 仓库 `Settings → Pages → Build and deployment`，Source 选择 **GitHub Actions**。
4. 推送后 Actions 会自动构建并部署，页面地址类似：
   `https://<你的用户名>.github.io/workday-alarm/`

## 部署到服务器（支持自动订阅）
1. 把项目上传到服务器（或 `git pull`）。
2. 安装 Node.js 18+。
3. 执行 `npm install && npm run build`。
4. 用进程管理器跑 `npm start`，监听 `PORT`（默认 3000）。
5. 用 Nginx / Caddy 反向代理到 `3000`，并配置 HTTPS（订阅链接和复制功能在 HTTPS 下体验最好）。

数据默认存在 `data/schedules.json`。生产建议定期备份这个文件，或后续替换成 SQLite。

## 接口
- `POST /api/schedules`：创建分享，返回 `code`、分享链接、订阅链接
- `GET /api/schedules/:code`：读取分享配置
- `PUT /api/schedules/:code`：更新分享配置
- `GET /ics/:code.ics`：生成日历订阅（当前年 + 未来两年）

## 目录
- `src/core/schedule.js`：排班核心（大小周 / 单休 / 双休 / 调休）
- `src/core/holidays.js`：法定节假日数据（当前内置 2026 年基线）
- `src/core/ics.js`：`.ics` 生成
- `src/components/CalendarView.vue`：日历首页
- `src/components/ConfigView.vue`：排班配置
- `src/components/AlarmGuide.vue`：闹钟接入引导
- `src/components/SharePanel.vue`：分享 / 订阅
- `server.mjs`：Express 后端

## 已知限制
- 2026 法定调休为内置基线，2027/2028 官方安排尚未公布；公布后更新 `src/core/holidays.js` 并提高 `DATA_VERSION` 即可（`public/holidays.json` 会自动同步）。若与实际通知不一致，请在「排班 → 手动纠正」调整。
- Web 版无法直接程序化开/关系统闹钟；iOS 通过快捷指令自动化完成，安卓待正式 App 版本。

## 快捷指令签名（维护说明）
iOS 不允许导入未签名的 `.shortcut` 文件，因此对外提供的 `public/shortcut.shortcut` 需先用 Mac 签名：
```bash
bash scripts/sign-shortcut.sh   # 若先修改了 scripts/shortcut.raw.shortcut
```
签名依赖 Mac 上的 iCloud / Shortcuts 登录，只能在 Mac 上执行，Vercel 构建不会重新签名。

## 下一步
- 接入可年更的节假日数据源
- 分享码加编辑口令，避免知道链接就能改
- 账号 + 云同步排班规则
- 安卓原生闹钟
- 双端上架（iOS App Store / 安卓应用商店）

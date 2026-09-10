# AI 练习室

离线刷题网站与 Android 应用：AI 岗位笔试 150 题 + LeetCode Hot100 100 题，支持 DeepSeek 辅导、个人知识库与学习评估。

- 在线刷题：<https://llh-astro.github.io/ai-study-room/>
- APK 题库更新地址：<https://llh-astro.github.io/ai-study-room/bank.json>
- Android 安装包：[v1.0.4](release/AI练习室-v1.0.4.apk)
- [安装、备份与使用说明](release/安装与使用说明.md)
- [基础知识学习方案（尚未实现）](COURSE_PLAN.md)

## 已实现

- 两套题库，收藏、错题、算法草稿与掌握标记。
- 底部四栏导航与左右滑动，手机端折叠筛选和题号导航。
- 刷题页紧凑 AI 面板：输入框在顶部，题目和回复分别滚动；可拖动调节高度、下拉收起，保留每题聊天与本次未发送输入。
- 用户自填 DeepSeek API Key，流式题目对话、停止生成、连接测试。
- 可搜索、编辑的知识笔记，JSON 完整备份及 Markdown 导出。
- AI 学习评估：模块统计、知识缺口、建议学习顺序与补测；每份报告保存当时的答题快照。
- HTTPS 题库更新及本地 JSON 题库包导入，稳定题号保护已有记录。

## 使用与数据

直接打开 `index.html` 即可离线刷题，也可使用在线网站。电脑本地页面、在线网站和 APK 的存储相互独立；迁移前从旧环境导出完整备份，再在新环境导入。首次访问在线网站不会自动继承本地页面的进度。

网页版 Key 只保留在页面内存；APK 用 Android Keystore 加密保存，学习数据写入私有 SQLite。Key、个人学习记录与备份不会上传到本仓库。AI 请求直接发往 DeepSeek，使用用户账户计费；无 Key 时仍可刷题、读题解、查看已有笔记。

学习评估使用当前答题结果与算法自评。它没有首次作答、耗时或重试次数记录，不能代替实际编程能力测试。样本不足与题目答案修订会单独说明。

## 项目结构

| 路径 | 内容 |
|---|---|
| `index.html` | 已生成的单文件离线网站 |
| `template.html`、`hot100*` | 选择题及算法题界面、逻辑和数据 |
| `study*`、`compact.css` | AI、知识库、评估、备份及手机布局 |
| `questions.json`、`hot100.json` | 题库源数据 |
| `bank.json` | 固定名称的最新题库包 |
| `docs/` | GitHub Pages 发布文件 |
| `release/` | APK、题库包和安装说明 |
| `mobile/` | Android 源码、资源及构建脚本 |
| `verify-*.cjs` | 网页与原生桥接模拟测试 |

## 更新网页与题库

```sh
python assemble.py
python publish_bank.py
python prepare_pages.py
```

修改题库后，在 `publish_bank.py` 中更新版本号及变更说明；已有题号不得重新用于其他题目。脚本同时更新 `bank.json` 和版本化题库包。提交 `docs/` 后，GitHub Pages 从 `main` 分支的 `/docs` 发布；网站及固定题库地址随之更新。

题库包只包含数据，不执行远程代码。APK 用户在“设置 → 题库更新”填写上述 JSON 地址并检查更新。APK 界面或功能变化仍需要安装新版 APK；同签名覆盖安装可保留数据。

## 本地开发与验证

生成网页只需要 Python 3。重新从原始材料提取题库需要 `pypdf` 或 `python-docx`，通过命令参数传入自己的源文件；源材料不包含在仓库中。

```sh
npm install
npx playwright install chromium
npm test
```

测试默认使用 Playwright Chromium，可用 `PLAYWRIGHT_CHANNEL=msedge` 指定本机 Edge。测试使用独立浏览器上下文和模拟 API，不需要真实 Key，不会操作个人浏览器进度。原生桥接测试不等同于真机测试。

## Android 构建

`mobile/build_apk.py` 使用 JDK 17、Android SDK Platform 35 和官方 Build Tools，查找 `mobile/toolchain/jdk`、`platform`、`build-tools` 中的工具。工具需自行配置，不上传仓库。

```sh
python mobile/build_apk.py
```

保管好 `mobile/signing`，它必须留在本地。首次在新机器构建会生成新签名，无法直接覆盖这里已有签名的 APK；维护已有应用需安全迁移原签名。切勿提交签名文件或密码。

题目与题解来源及原题链接保留在数据和界面内。本仓库未为第三方题目或题解授予额外使用许可。

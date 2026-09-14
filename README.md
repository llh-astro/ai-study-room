# AI 练习室

离线刷题网站与 Android 应用：AI 岗位笔试 150 题 + LeetCode Hot100 100 题 + AI 基础认知 300 题 + 企业智能决策 210 题 + 模型训练实战入门 100 题，支持 DeepSeek 辅导、个人知识库与学习评估。

- 在线刷题：<https://llh-astro.github.io/ai-study-room/>
- APK 题库更新地址：<https://llh-astro.github.io/ai-study-room/bank.json>
- Android 安装包：[v1.0.9](release/AI练习室-v1.0.9.apk)
- [安装、备份与使用说明](release/安装与使用说明.md)
- [短课学习方案（尚未实现；基础选择题已上线）](COURSE_PLAN.md)

## 本次新增

独立的[模型训练实战入门题库](training/README.md)：100 题、10 个阶段，配套 CPU MNIST 训练脚本。侧边栏选择“模型训练实战入门”即可顺序练习。旧 APK 请覆盖安装 v1.0.9（不要卸载）；以后题目内容可通过 HTTPS 或题库包更新。原四套题库与题号不变。

## 已实现

- 五套题库，收藏、错题、算法草稿与掌握标记。
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
python build_basics.py
python build_enterprise.py
python training/build_questions.py
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

## 基础认知题库（v1.0.5）

共 300 道原创选择题：240 道单选、60 道多选，10 章各 30 题。涵盖数学、概率统计、数据预处理、机器学习、神经网络、NLP / Transformer、大模型、RAG、Agent 与评估应用。每个概念通过定义、情境或易错判断练习，包含选项分析、例子和参考链接。

内容由 AI 辅助原创编写，参考 Deep Learning 教材以及 scikit-learn、PyTorch、Hugging Face 和 LangChain 官方资料，并非这些机构的原题或认证题。基础辨认练习不等于课程或编程能力验证。

`basics-concepts.txt` 是概念内容源；`build_basics.py` 生成 `basics.json`。题号已发布后保持稳定，不能通过重排概念复用旧题号。基础进度使用独立键，备份和学习评估均包含它。旧题库包缺少 basics 时保留当前基础题库。旧 APK 需覆盖安装 v1.0.5 才有第三个入口，后续内容可通过 bank.json 更新。

## 企业智能决策题库（v1.0.6）

新增独立 210 题：140 单选、70 多选，7 章各 30 题。包含概念、业务场景、指标计算与故障定位；支持错题、收藏、题内问 AI、完整备份与按章节学习评估。原 550 题源数据和存储标识不变。详见 [专项学习路线与资料](ENTERPRISE_STUDY.md)。

## 侧边栏、公式与自建题库（v1.0.7）

点击顶部“☰ 题库”展开侧边栏，选择后自动收起；支持收起按钮、遮罩、Esc 和 Android 返回。题干、解析、AI 回复及报告支持常见 LaTeX 公式，KaTeX 与字体内置，离线可用。代码和原始备份保留源文。

[HTTPS 更新与自建格式指南](BANK_FORMAT.md) · [输入示例](custom-questions.example.json) · [合并与校验脚本](build_custom_bank.py)。模板需要通过脚本与当前 bank.json 合并，不能直接当完整更新包导入。

测试中的自建题库生成需要 Python 3；可用 PYTHON_EXECUTABLE 指定解释器。KaTeX 0.16.22 来源与 MIT 许可证见 vendor/。

## 手机交互修复（v1.0.9）

题库按钮移至左侧，安卓原生容器避开系统栏、刘海和键盘。全部练习、错题（算法待复习）、收藏在当前页面会话分别记住题目位置，切回全部恢复此前题目。问 AI 默认使用更低的紧凑面板，随可视区域与键盘变化自动上移，保留输入草稿及手动拖动收起。

已测试浏览器模拟的键盘覆盖与窗口压缩；不同手机输入法仍需真机确认。

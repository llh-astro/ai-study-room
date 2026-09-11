# HTTPS 更新与自建题库

## 使用者：不重新安装 APK，更新题目

1. 打开“设置 → 题库更新”。
2. 填入 `https://llh-astro.github.io/ai-study-room/bank.json` 并保存。
3. 点击“检查更新”，查看版本和各题库数量，再点击“安装题库更新”。
4. 页面重新加载，已有答题、收藏、聊天和笔记保留。答案修订会标注历史判分。

地址必须直接返回 JSON，而不是 GitHub 仓库主页或带网页外壳的文件预览。浏览器版还要求同源或服务器允许跨域；GitHub Pages 同站地址可以使用。APK 需要网络能够访问此 HTTPS 地址。

修改或追加题目、解析和章节可用此方式。侧边栏、公式渲染等界面功能，以及增加全新的顶层题库类型，需要升级 APK 一次。本次功能版为 v1.0.7；升级后，普通题目更新继续使用 HTTPS，不需要反复安装。

## 作者：推荐使用模板生成

下载当前完整的 `bank.json`、`custom-questions.example.json` 和 `build_custom_bank.py` 到同一目录。编辑示例中的问题，然后运行 Python 3：

```sh
python build_custom_bank.py --base bank.json --input custom-questions.example.json --target enterprise --version my-bank-001 --output my-bank.json
```

- `--target enterprise` 添加到“企业决策”；也可用 `basics` 或 `ai`。
- 输入中的 `module` 是章节名称；新名称会追加章节。
- **新增题省略 `id`**，脚本自动分配下一题号。
- 修订已有题可指定原 `id`；它必须仍是原来那道题，不要用旧题号替换成另一个知识点。
- 脚本保留其他题库，检查新增内容，再生成完整更新包。该输入模板本身不是可直接导入的完整题库包。
- 首先在应用里用“导入题库包”选择 `my-bank.json` 验证，确认版本、题数和内容后，再发布 HTTPS 文件。

把 `my-bank.json` 放入自己的 GitHub Pages 发布目录，可使用 `https://你的用户名.github.io/你的仓库/my-bank.json`。后续覆盖该文件并更改包内 `version`，使用者的更新地址不用变。不要把个人备份或 API Key 放进公开仓库。

## 完整更新包结构

```json
{
  "format": "ai-study-bank",
  "schema": 1,
  "version": "my-bank-001",
  "changelog": "新增我的检索练习章节",
  "ai": {"modules": ["原章节"], "questions": ["原岗位题目对象，全部保留"]},
  "hot": {"topics": ["原专题对象，全部保留"], "questions": ["原算法题目对象，全部保留"]},
  "basics": {"modules": ["原基础章节"], "questions": ["原基础题目对象，全部保留"]},
  "enterprise": {"modules": ["原章节", "我的检索练习"], "questions": ["原题目及新增题目对象"]}
}
```

以上仅展示结构，数组中的说明字符串不是合法题目。请以真实 `bank.json` 为底稿，或使用生成脚本，不能把原题目数组删成空数组。旧格式包缺少 `basics` 或 `enterprise` 时，新版应用保留相应本地题库。

选择题对象的必需字段：

| 字段 | 格式 |
|---|---|
| `id` | 从 1 连续编号的整数，发布后保持稳定 |
| `module` | `modules` 数组下标，从 0 起 |
| `type` | `单选` 或 `多选` |
| `difficulty` | `基础` 或 `进阶` |
| `page` | 非负整数；自建题可用 1 |
| `stem`、`code` | 题干和代码字符串，无代码时用空字符串 |
| `options` | A、B、C、D 四个字符串选项 |
| `answer` | 单选如 `B`，多选如 `AC`，字母升序、不重复、不加空格 |
| `explanation`、`knowledge`、`pitfall` | 解析、知识点、易错点字符串 |
| `refs` | 基础与企业题库必须是 HTTPS 参考链接 |

Hot100 使用独立的算法题结构，包含 `lc-` 题号、专题、题解 blocks 等。此脚本只编辑选择题，原算法题库原样保留。首次自建建议从基础或企业题库追加章节开始。

每个题库不超过 5000 题；建议完整 JSON 文件控制在 12 MB 内。题号不能删除或重新编号。版本号按字符串是否相同判断，不是自动进行语义版本排序，因此每次发布都使用不同版本号，并避免导入过旧的包。

## LaTeX 写法

界面支持 `\(x^2\)`、`\[\frac{a}{b}\]`、`$x^2$` 和 `$$\frac{a}{b}$$`。推荐使用反斜杠形式，减少与美元金额混淆。代码块、行内代码和编辑框保留原文。

在 JSON 源文件中反斜杠需要转义，例如：

```json
{"stem":"计算 \\(x^2\\)","explanation":"结果为 \\[\\frac{1}{2}\\]"}
```

公式引擎和字体随网页与 APK 内置，离线可用。它支持常见数学公式，不是完整 LaTeX 文档编译器；不支持的命令显示为原始内容，原始聊天和导出备份仍保留 LaTeX 源文。

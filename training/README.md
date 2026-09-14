# 模型训练实战入门：100 道选择题

这是独立题库，侧边栏选择“模型训练实战入门”进入。题号 T001–T100，80 道单选、20 道多选，每章 10 题。进度、错题、收藏与其他题库分别保存。

主线是用 PyTorch 在 CPU 上训练 MNIST 手写数字分类器。每题含阶段背景、教学代码节选与解析，建议第一次按顺序练习。题库用于理解训练流程；配套脚本供实际运行，答对选择题本身不代表已经完成训练实践。

| 题号 | 阶段 |
|---|---|
| T001–T010 | 任务、输入输出与基线 |
| T011–T020 | 数据划分与 DataLoader |
| T021–T030 | 张量形状、类型与设备 |
| T031–T040 | 模型结构与前向计算 |
| T041–T050 | 损失函数与评价指标 |
| T051–T060 | 梯度、反向传播与参数更新 |
| T061–T070 | 训练循环与日志 |
| T071–T080 | 验证、过拟合与排错 |
| T081–T090 | 模型保存、加载与续训 |
| T091–T100 | 推理、测试与独立实验 |

## 动手运行

在本目录打开终端，使用 Python 3.12 创建隔离环境（下面为 Windows PowerShell 命令）：

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt --index-url https://download.pytorch.org/whl/cpu --timeout 120
.venv/Scripts/python train_mnist.py --epochs 3
```

首次运行需要联网下载 MNIST。默认使用 10000 个训练样本、2000 个验证样本，最后在独立的 10000 个测试样本上评价。模型为 784→128→10 的 MLP，共 101770 个参数。默认每批 32 张、每轮 313 批、3 轮共 939 次更新。

输出位于 `runs/mnist/`：

- `metrics.json`：每轮指标、第一批张量形状、梯度与参数变化、加载一致性检查。
- `best_weights.pt`：按验证 loss 选择的权重，用于推理。
- `last_checkpoint.pt`：包含优化器和随机状态的续训检查点。

```powershell
.venv/Scripts/python train_mnist.py --epochs 5 --resume runs/mnist/last_checkpoint.pt
```

`--epochs 5` 表示总共训练到第 5 轮。续训保持 seed、batch-size、lr 一致。先按验证集选择方案，最后看测试集；不要根据反复查看的测试结果调参。

题目中的异常曲线明确标为模拟案例。均匀概率对应的交叉熵约 2.303 是理论值，不是随机初始化的保证值。

## 题库构建与更新

在仓库根目录执行 `python training/build_questions.py`，从人工编写的 `questions.txt` 构建独立的 `training.json`，再执行 `assemble.py`、`publish_bank.py`、`prepare_pages.py`。

`training.json` 是该题库的数据源；应用导入使用完整的 `bank.json`。首次加入独立入口需要 APK v1.0.9。此后通过设置里的 HTTPS 更新地址或导入完整题库包更新内容，不必因修题重新安装 APK。

自建题可使用 `build_custom_bank.py --target training` 合并到完整包；保持现有 ID，不删除或重排已有题号，新增题接续 101。

内容依据：

- [PyTorch 快速入门](https://docs.pytorch.org/tutorials/beginner/basics/quickstart_tutorial.html)
- [训练与优化循环](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)
- [保存与加载模型](https://docs.pytorch.org/tutorials/beginner/basics/saveloadrun_tutorial.html)

题目为原创教学练习，参考链接随题提供。

## 本次实际运行

2026-09-14，Windows / Python 3.12 / PyTorch 2.6.0 CPU，默认配置实际完成 3 轮。验证准确率依次为 89.75%、91.90%、93.10%，独立测试准确率 93.62%。这是本次运行结果，不是性能保证。权重保存后重新加载，预测 logits 完全一致；backward 后权重不变，optimizer.step 后权重发生变化。详见 [原始指标](example-run.json)。

另已验证先训练 1 轮、再从 checkpoint 续训至第 3 轮，指标与连续训练 3 轮完全一致。

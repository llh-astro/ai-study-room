# 企业智能决策专项学习题库

210 道原创选择题，140 单选、70 多选。每章 30 题，围绕 10 组概念分别进行概念辨认、场景判断和多选辨析。这里的 210 题是分层练习数量，不代表 210 个互不重复的知识点。

按 RAG、企业数据、Agent、工程、LLM、实验设计、预测这七方面的学习清单编写。业务案例均为模拟客户、订单、工单和产品场景，不包含真实企业数据，也不是招聘真题。题目由 AI 辅助原创编写，附公开参考资料，未经过外部专家逐题审定。

| 章节 | 题号 | 重点 |
|---|---|---|
| RAG / GraphRAG 检索链路 | E001–E030 | BM25、向量、hybrid、切块、过滤、重写、重排、Recall/hit、MRR/NDCG、图检索与错误定位 |
| 企业数据、本体与知识图谱 | E031–E060 | JOIN 粒度、聚合、窗口、指标口径、主数据、血缘、权限、本体、实体关系事件及抽取 |
| Agent 执行与可靠性评测 | E061–E090 | 工具执行、schema、权限、状态、重试、幂等、失败类型、rubric、人审与推理证据 |
| Python 与可复现工程 | E091–E120 | 项目结构、类型、配置、FastAPI、HTTP/JSON、pytest、日志、Docker、Git、异步 |
| LLM 原理与方案选择 | E121–E150 | token、attention、位置、预训练/SFT、DPO、RLHF/RLAIF、解码、长上下文、幻觉与方案选择 |
| 评测统计与实验设计 | E151–E180 | P/R/F1、bootstrap、消融、校准、一致性、错误分类、泄漏、引用与决策指标、受控干预 |
| 预测、异常检测与业务验证 | E181–E210 | 分解、滚动回测、ARIMA、Prophet、滞后特征、序列模型、异常类型、阈值、误差与业务验证 |

先学习前四章。LLM 原理与统计章节可在相关错题较多时穿插；预测章节用于建立认知。提交答案后阅读解析，再用自己的话解释为何其他选项不成立。能选对不等于能独立搭建系统，学习评估也不会据此认证项目交付或岗位胜任能力。

## 参考资料

每题的“查看教材 / 官方文档”指向相关资料，概念来源不等于资料作者认可题中的原创业务案例。

- [Elastic 排序与重排](https://www.elastic.co/docs/solutions/search/ranking)、[Microsoft GraphRAG](https://microsoft.github.io/graphrag/query/overview/)、[Stanford 信息检索教材](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html)
- [PostgreSQL SQL 教程](https://www.postgresql.org/docs/current/tutorial-sql.html)、[W3C OWL](https://www.w3.org/TR/owl2-overview/)、[W3C PROV](https://www.w3.org/TR/prov-overview/)、[Knowledge Graphs 综述](https://arxiv.org/abs/2003.02320)
- [LangGraph 状态与执行](https://docs.langchain.com/oss/python/langgraph/functional-api)、[LangSmith 评测](https://docs.langchain.com/langsmith/evaluation)
- [FastAPI](https://fastapi.tiangolo.com/tutorial/body/)、Python、pytest、Docker、Git 官方文档（逐题链接）
- [Hugging Face TRL](https://huggingface.co/docs/trl/index)、[Lost in the Middle](https://arxiv.org/abs/2307.03172)
- [scikit-learn 评测指标](https://scikit-learn.org/stable/modules/model_evaluation.html)、[SciPy bootstrap](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html)
- [Forecasting: Principles and Practice](https://otexts.com/fpp3/accuracy.html)

## 维护与兼容

`enterprise-concepts.txt` 是概念及场景源文件，`build_enterprise.py` 生成 `enterprise.json`，`assemble.py` 将它打包进离线页面。

题号 E001–E210 与其他题库隔离，使用 `ai-enterprise-210-v1` 保存进度，聊天使用 `enterprise:` 前缀。已发布题号不可重新用于不同知识点；修改答案时保留历史判分。

题库包继续使用 schema 1，增加可选 `enterprise` 字段。旧包缺少该字段时保留现有专项题库。新版的完整备份包含专项进度、对话与评估；恢复应使用 v1.0.6 或更新版本。旧 APK 要先覆盖升级才会出现第四个入口，后续题目内容仍支持 HTTPS 地址更新或导入题库包。

本次交付是学习题库，不包含企业决策 Agent demo。后续实践可以把这些判断落实为 SQL + 文档检索 + 图关系检索原型，再用独立任务集验证。

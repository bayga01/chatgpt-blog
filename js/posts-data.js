/* ============================================================
   文章数据（纯静态，增删文章只需修改此文件）
   每篇文章：slug / title / category / date / readTime / author
            / emoji / excerpt / keywords / content(HTML)
   新增文章后，记得在 index.html 的网格里也加一张卡片。
   ============================================================ */
window.POSTS = {
  "prompt-template": {
    featured: true,
    title: "从零掌握 ChatGPT 提示词：一份能直接套用的结构化模板",
    category: "chatGPT",
    date: "2026-11-10",
    readTime: "8 分钟",
    author: "编辑部",
    emoji: "🧩",
    excerpt: "五段式提示词框架，覆盖写作、分析、编程等真实场景，拿来即用。",
    keywords: "提示词 template 结构化 模板 角色任务",
    content: `
      <p>很多人觉得 ChatGPT「听不懂人话」，其实问题往往不在模型，而在我们怎么提问。一个结构清晰的提示词，能让回答质量提升一个档次。</p>

      <h2 id="why">为什么需要结构化提示词</h2>
      <p>随意的一句「帮我写个方案」，得到的往往是泛泛而谈。因为模型缺少三样东西：<b>上下文、明确任务、输出标准</b>。结构化提示词就是一次性补齐这些信息的模板。</p>

      <h2 id="framework">五段式框架</h2>
      <ul class="bullets">
        <li><b>角色（Role）</b>：你希望 AI 以什么身份作答，如「资深产品经理」。</li>
        <li><b>任务（Task）</b>：要它具体做什么，用动词开头。</li>
        <li><b>上下文（Context）</b>：背景、受众、约束条件。</li>
        <li><b>输出格式（Format）</b>：列表、表格、Markdown 还是 JSON。</li>
        <li><b>约束（Constraints）</b>：字数、语气、禁忌。</li>
      </ul>

      <h3 id="example">一个可直接复制的示例</h3>
      <pre><code>角色：你是一名资深技术博客作者。
任务：写一篇介绍「向量数据库」的科普文章。
上下文：读者是刚入门的后端工程师，没有 ML 背景。
格式：标题 + 3 个小节 + 每节一个类比。
约束：不超过 800 字，不用公式，语气轻松。</code></pre>

      <blockquote>提示词的本质，是给模型一个「清晰的协作契约」。</blockquote>

      <h2 id="tips">三个进阶技巧</h2>
      <ul class="bullets">
        <li>让模型先「复述需求」再回答，能显著减少跑题。</li>
        <li>用「分步思考」引导复杂任务，如「先列出大纲，再逐节展开」。</li>
        <li>给示例（Few-shot）比纯文字描述更稳。</li>
      </ul>

      <div class="callout"><b>小结：</b>把这套五段式存进你的笔记，遇到任何任务先套一遍，再慢慢微调，你会发现「调教」AI 其实有章可循。</div>
    `
  },

  "api-stream": {
    title: "用 Python 接入 ChatGPT API 并实现流式输出",
    category: "Claude",
    date: "2026-11-08",
    readTime: "12 分钟",
    author: "技术组",
    emoji: "🔌",
    excerpt: "从申请密钥到流式对话的完整代码，包含错误处理与费用控制。",
    keywords: "api python 接入 流式 函数调用 function calling",
    content: `
      <p>想在自家产品里嵌入对话能力？OpenAI 的兼容接口让这件事变得很简单。本文用一个最小可运行示例，带你走完「申请密钥 → 发起请求 → 流式渲染」全流程。</p>

      <h2 id="key">第一步：获取并保护好密钥</h2>
      <p>在平台后台创建 API Key，<b>切勿写进前端代码或提交到公开仓库</b>。推荐放在环境变量中：</p>
      <pre><code>export OPENAI_API_KEY="sk-..."</code></pre>

      <h2 id="request">第二步：发起一次对话请求</h2>
      <pre><code>from openai import OpenAI
client = OpenAI()

resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "用一句话解释什么是向量数据库"}]
)
print(resp.choices[0].message.content)</code></pre>

      <h2 id="stream">第三步：流式输出（打字机效果）</h2>
      <pre><code>stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "讲个关于 AI 的冷笑话"}],
    stream=True
)
for chunk in stream:
    delta = chunk.choices[0].delta.content or ""
    print(delta, end="", flush=True)</code></pre>

      <h2 id="cost">费用与控制</h2>
      <ul class="bullets">
        <li>用 <code>max_tokens</code> 限制单次长度，避免意外超支。</li>
        <li>生产环境务必加超时与重试（如 tenacity）。</li>
        <li>对用户输入做内容审核，防止被滥用。</li>
      </ul>
      <div class="callout"><b>提醒：</b>本文为教学示例，真实项目请补全鉴权、限流与日志。</div>
    `
  },

  "ai-trend-2026": {
    title: "2026 年生成式 AI 趋势：普通人真正该关心的 5 件事",
    category: "使用技巧",
    date: "2026-11-02",
    readTime: "10 分钟",
    author: "观察员",
    emoji: "🌐",
    excerpt: "不谈虚的，从就业、工具到监管，给出可落地的判断框架。",
    keywords: "大模型 趋势 职场 替代 未来 2026",
    content: `
      <p>每隔几个月就有人喊「AI 要取代所有人」，但落地到个人，更需要的是冷静的判断框架，而不是焦虑。</p>

      <h2 id="job">1. 被替代的是「任务」，不是「岗位」</h2>
      <p>大多数职业由多个任务组成，AI 先吃掉的是其中可标准化的部分。与其担心被取代，不如盘点：<b>你的工作里哪些环节已能被 AI 加速？</b></p>

      <h2 id="tool">2. 工具平权，拼的是「会用」</h2>
      <p>当大家都能用上同等模型，差距来自提示词、工作流设计和判断力。工具的门槛在降低，<b>使用者的认知门槛在升高</b>。</p>

      <h2 id="agent">3. 智能体（Agent）走向常态化</h2>
      <p>能调用工具、自己规划步骤的 Agent 开始进入日常办公，从「问答」走向「代执行」。</p>

      <h2 id="reg">4. 监管与合规成为刚需</h2>
      <p>数据隐私、内容标识、责任归属逐步立法，企业用 AI 必须过合规关。</p>

      <h2 id="action">5. 普通人该怎么做</h2>
      <ul class="bullets">
        <li>把 AI 当「副驾驶」，先在小任务上练手。</li>
        <li>建立自己的提示词与模板库。</li>
        <li>关注所在行业的 AI 应用案例，而非泛泛的新闻。</li>
      </ul>
      <div class="callout"><b>一句话：</b>趋势不可怕，可怕的是站在原地观望。</div>
    `
  },

  "daily-workflow": {
    title: "把 ChatGPT 接进你的日常工作流：10 个提效场景",
    category: "gemini",
    date: "2026-11-05",
    readTime: "6 分钟",
    author: "效率控",
    emoji: "⚡",
    excerpt: "邮件、会议纪要、代码审查、翻译……让 AI 成为你的副驾驶。",
    keywords: "插件 自定义 gpts 工作流 效率 生产力",
    content: `
      <p>AI 不是用来「炫技」的，而是用来省时间的。下面 10 个场景，几乎覆盖每个职场人的一天。</p>
      <h2 id="scenes">高频场景清单</h2>
      <ul class="bullets">
        <li>邮件：给要点，让它扩写成得体的回复。</li>
        <li>会议纪要：粘贴录音转写，提炼「决议 / 待办 / 责任人」。</li>
        <li>代码审查：贴 diff，让它找潜在 bug 与改进点。</li>
        <li>翻译润色：中英互译并统一术语表。</li>
        <li>头脑风暴：用「反向提问」逼出创意。</li>
      </ul>
      <h2 id="habit">养成习惯的三步</h2>
      <p>先从一个最痛的场景切入，做成可复用模板，再慢慢扩展。别一上来就想改造全部流程。</p>
      <div class="callout"><b>提醒：</b>涉及机密的信息，请使用企业版或本地模型，切勿直接粘贴。</div>
    `
  },

  "data-safety": {
    title: "企业用 ChatGPT 的 6 条数据安全红线",
    category: "常见问题",
    date: "2026-10-28",
    readTime: "7 分钟",
    author: "安全组",
    emoji: "🔐",
    excerpt: "哪些信息绝对不能粘贴进对话框？如何配置企业级数据隔离。",
    keywords: "隐私 数据安全 合规 泄露 企业 风险",
    content: `
      <p>便利与风险并存。企业引入 ChatGPT 前，必须先划清数据红线。</p>
      <h2 id="redlines">六条红线</h2>
      <ul class="bullets">
        <li>客户个人信息、身份证号、银行卡号绝不入框。</li>
        <li>未公开源码、商业机密使用企业版或本地部署。</li>
        <li>关闭「用于模型改进」的训练选项。</li>
        <li>对外接口加内容审核与脱敏层。</li>
        <li>建立可审计的使用日志。</li>
        <li>对员工做定期安全意识培训。</li>
      </ul>
      <blockquote>数据一旦出域，就不再是你的数据。事前隔离，远胜事后补救。</blockquote>
    `
  },

  "role-prompting": {
    title: "角色提示法：让回答质量提升一个档次的秘密",
    category: "chatGPT",
    date: "2026-10-24",
    readTime: "5 分钟",
    author: "编辑部",
    emoji: "🎭",
    excerpt: "给 AI 一个身份，它就会用对应的专业口吻和知识边界来作答。",
    keywords: "角色提示 role 写作 翻译 润色 风格",
    content: `
      <p>「你是一位有 10 年经验的营养师」——仅仅加上这句话，回答的专业度和语气立刻不同。</p>
      <h2 id="why">为什么角色有用</h2>
      <p>角色等于给模型设定了<b>知识边界与表达风格</b>，让它在特定领域里更聚焦、更少胡扯。</p>
      <h2 id="how">怎么写角色</h2>
      <pre><code>你是一位严谨的的法律顾问，擅长用通俗语言解释条款。
请审查以下合同片段并指出风险。</code></pre>
      <div class="callout"><b>技巧：</b>角色越具体（资历、风格、禁忌），输出越稳定。</div>
    `
  },

  "function-calling": {
    title: "手把手实现 Function Calling：让 AI 调用你的接口",
    category: "Claude",
    date: "2026-10-20",
    readTime: "14 分钟",
    author: "技术组",
    emoji: "🛠️",
    excerpt: "用函数调用把大模型接到数据库、日历和外部 API，打造智能体。",
    keywords: "函数调用 function calling 工具 自动化 插件",
    content: `
      <p>Function Calling 让模型不再只是「嘴上说说」，而是能真正触发动作——查数据库、发邮件、下单。</p>
      <h2 id="concept">核心思路</h2>
      <p>你声明一组工具（函数）的描述，模型根据对话决定「该调用哪个、传什么参数」，你的代码执行后把结果回传，模型再组织成自然语言。</p>
      <h2 id="schema">定义工具</h2>
      <pre><code>tools = [{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "查询某城市天气",
    "parameters": {
      "type": "object",
      "properties": {"city": {"type": "string"}},
      "required": ["city"]
    }
  }
}]</code></pre>
      <h2 id="loop">执行循环</h2>
      <p>检测到 <code>tool_calls</code> → 本地执行 → 把返回值以 <code>role:"tool"</code> 回传 → 模型生成最终答复。这就是一个最小智能体的骨架。</p>
    `
  },

  "summarize-pdf": {
    title: "用 ChatGPT 高效阅读和总结 PDF 文档的 7 个方法",
    category: "gemini",
    date: "2026-10-16",
    readTime: "6 分钟",
    author: "效率控",
    emoji: "📄",
    excerpt: "论文、合同、报告不再逐字啃，掌握提问姿势效率翻倍。",
    keywords: "长文 总结 阅读 pdf 文档 分析",
    content: `
      <p>面对几十页的文档，先别急着逐字读。用对方法，10 分钟就能抓住重点。</p>
      <h2 id="methods">七种用法</h2>
      <ul class="bullets">
        <li>「用 5 句话总结全文核心结论」</li>
        <li>「列出所有待办事项与截止日期」</li>
        <li>「把第 3 章翻译成通俗中文」</li>
        <li>「对比本文与 X 方法的异同」</li>
        <li>「找出文中有矛盾或存疑的地方」</li>
      </ul>
      <blockquote>让 AI 做第一遍粗读，你做第二遍精读与判断。</blockquote>
    `
  },

  "open-vs-closed": {
    title: "开源还是闭源？主流大模型怎么选",
    category: "使用技巧",
    date: "2026-10-12",
    readTime: "9 分钟",
    author: "观察员",
    emoji: "💡",
    excerpt: "成本、隐私、可控性三维对比，帮你做出不后悔的技术选型。",
    keywords: "开源 模型 llama 本地 部署 对比",
    content: `
      <p>选型没有标准答案，只有适配与否。我们从三个维度拆解。</p>
      <h2 id="cost">成本</h2>
      <p>闭源 API 按量付费、零运维；开源模型免费但要自购算力与维护。</p>
      <h2 id="privacy">隐私</h2>
      <p>对数据敏感的业务，本地开源模型天然更有优势。</p>
      <h2 id="control">可控性</h2>
      <p>需要微调、私有化、可控迭代，开源更灵活；追求开箱即用，闭源更省心。</p>
      <div class="callout"><b>建议：</b>先用闭源快速验证场景，再对核心链路评估开源替代。</div>
    `
  }
};

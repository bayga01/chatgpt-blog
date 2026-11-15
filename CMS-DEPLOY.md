# 可视化后台发文网站 · 傻瓜式上线指南

> 目标：搭建一个**不用懂代码、不用买主机、永久免费**的文章网站。  
> 以后发文 = 打开一个网页后台 → 填标题、选分类、写正文 → 点发布，网站自动更新。
>
> 技术组合（都已为你准备好，不用自己写）：
>
> - **GitHub**：免费存放网站文件（相当于网盘 + 版本记录）
> - **Cloudflare Pages**：免费托管网站，自带 HTTPS 和全球加速
> - **Decap CMS**：免费的可视化发文后台
>
> 全程零费用。预计 30–45 分钟完成，一次性配置，之后发文只需 2 分钟。

---

## 目录

- [第 0 步：准备两个免费账号](#第-0-步准备两个免费账号)
- [第 1 步：在 GitHub 创建仓库](#第-1-步在-github-创建仓库)
- [第 2 步：把网站文件上传到仓库](#第-2-步把网站文件上传到仓库)
- [第 3 步：创建 GitHub OAuth 应用（用于后台登录）](#第-3-步创建-github-oauth-应用用于后台登录)
- [第 4 步：用 Cloudflare Pages 部署网站](#第-4-步用-cloudflare-pages-部署网站)
- [第 5 步：在 Cloudflare 填入登录密钥](#第-5-步在-cloudflare-填入登录密钥)
- [第 6 步：改好配置，绑定域名](#第-6-步改好配置绑定域名)
- [第 7 步：登录后台，发布第一篇文章](#第-7-步登录后台发布第一篇文章)
- [以后发文的标准流程](#以后发文的标准流程)
- [常见问题排查](#常见问题排查)

---

## 第 0 步：准备两个免费账号

| 账号             | 用途            | 注册地址                                 |
| -------------- | ------------- | ------------------------------------ |
| **GitHub**     | 存放网站文件 + 后台登录 | <https://github.com/signup>          |
| **Cloudflare** | 免费托管网站        | <https://dash.cloudflare.com/signup> |



> 两个都用邮箱注册即可，不需要信用卡。GitHub 有时候访问慢，耐心一点。

---

## 第 1 步：在 GitHub 创建仓库

1. 登录 GitHub，点右上角 **「+」→「New repository」**。
2. 按下面填写：
   - **Repository name**：填一个英文仓库名，例如 `chatgpt-blog`（只能用小写字母、数字、连字符）。
   - **Description**：随便填，例如 `我的 ChatGPT 文章站`。
   - 勾选 **Public**（公开）。⚠️ 必须选 Public，免费版才能用。
   - **不要**勾选 "Add a README file" 等其他选项，保持空仓库。
3. 点 **「Create repository」**。
4. 创建后页面会显示一段地址，形如：
   ```
   https://github.com/你的用户名/chatgpt-blog
   ```
   记下 **你的用户名** 和 **仓库名**，后面要用。

---

## 第 2 步：把网站文件上传到仓库

我把所有文件都给你准备好了。最简单的方式是**用网页直接上传**（不用装任何软件）：

1. 在刚创建的空仓库页面，点 **「uploading an existing file」**（上传已有文件）链接。
2. 把我给你的整个文件夹里的**所有文件和子文件夹**都选中，拖进上传区域。
   > 要上传的是这些内容（保持原有目录结构）：
   >
   > ```
   > index.html
   > post.html
   > admin/            （后台）
   > css/
   > js/
   > data/posts.json   （文章数据）
   > functions/api/    （登录认证）
   > images/
   > ```
3. 滚动到页面底部，在 **Commit changes** 处填一句说明如 `初次上传网站`，点 **「Commit changes」**。

✅ 完成后，仓库里应该能看到上述文件。

> 💡 小提示：`DEPLOY.md` 和 `CMS-DEPLOY.md` 这两个说明文件传不传都行，不影响网站运行。

---

## 第 3 步：创建 GitHub OAuth 应用（用于后台登录）

这一步是让后台能用 GitHub 账号登录。

1. 打开：<https://github.com/settings/developers>
2. 左侧点 **「OAuth Apps」→「New OAuth App」**。
3. 按下面填写：
   - **Application name**：随便填，例如 `我的文章站后台`。
   - **Homepage URL**：先填你的 Cloudflare 临时网址。这个网址在第 4 步才能得到，形如 `https://xxx.pages.dev`。**可以第 4 步之后回来再填**，先随便填 `https://github.com` 也行。
   - **Authorization callback URL**：关键！填：
     ```
     https://xxx.pages.dev/api/callback
     ```
     （`xxx.pages.dev` 换成第 4 步你拿到的实际网址）
4. 点 **「Register application」**。
5. 进入应用页面后：
   - 复制 **Client ID**（一串字母数字），保存好。
   - 点 **「Generate a new client secret」**，生成后**立刻复制保存**（这串密钥只显示一次，关掉页面就看不到了）。

> ⚠️ 这两个值（Client ID 和 Client secret）相当于后台的钥匙，不要发给别人。

---

## 第 4 步：用 Cloudflare Pages 部署网站

1. 登录 Cloudflare：<https://dash.cloudflare.com>
2. 左侧菜单找到 **「Workers & Pages」→「Create」→「Pages」→「Connect to Git」**。
3. 点 **「Connect to GitHub」**，按提示授权 Cloudflare 访问你的 GitHub（第一次会跳转到 GitHub 点授权，全选默认即可）。
4. 在仓库列表里选中你第 1 步创建的仓库（如 `chatgpt-blog`），点 **「Begin setup」**。
5. 配置构建设置（**很重要，照抄**）：
   - **Project name**：随便填，例如 `chatgpt-blog`。它决定你的临时网址 `项目名.pages.dev`。
   - **Production branch**：选 `main`（如果你的仓库默认分支是 `master` 就选 `master`）。
   - **Build framework preset**：选 **「None」** 或 **「No framework / Static」**（我们是纯静态，不需要构建）。
   - **Build command**：**留空**。
   - **Build output directory**：填 `/`（根目录）。
6. 点 **「Save and Deploy」**。等 1–2 分钟，看到 **「Success」** 就部署好了。
7. 此时你会得到一个网址，形如 `https://chatgpt-blog.pages.dev`。点开看看，网站应该正常显示。

> 记下这个 `xxx.pages.dev` 网址——现在回到**第 3 步**，把 OAuth 应用的两个 URL 改成它（Homepage 填 `https://xxx.pages.dev`，Callback 填 `https://xxx.pages.dev/api/callback`），保存。

---

## 第 5 步：在 Cloudflare 填入登录密钥

后台要能登录，需要把第 3 步拿到的 GitHub 密钥告诉 Cloudflare：

1. 在 Cloudflare 的 **「Workers & Pages」→ 你的项目（chatgpt-blog）→「Settings」→「Variables and secrets」**。
2. 点 **「Add variable」**，依次添加两条，**类型都选 Secret（机密）**：
   - 变量名 `GITHUB_CLIENT_ID`，值 = 你的 Client ID
   - 变量名 `GITHUB_CLIENT_SECRET`，值 = 你的 Client secret
3. 保存。
4. 因为改了环境变量，需要**重新部署一次**才生效：进入项目的 **「Deployments」** 标签，找到最近一次部署，点右侧 **「…」→「Retry deployment」**。

---

## 第 6 步：改好配置，绑定域名

### 6.1 修改仓库名（必做）

用网页编辑 GitHub 上的配置文件：

1. 回到 GitHub 仓库，进入 `admin/config.yml` 文件，点右上角铅笔图标（编辑）。
2. 找到这一行：
   ```yaml
   repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
   ```
   改成你自己的，例如：
   ```yaml
   repo: zhangsan/chatgpt-blog
   ```
3. 顺便把这三行里的 `你的域名.com` 改成你的真实域名（如果有）；没有域名可先不改，不影响临时网址访问：
   ```yaml
   site_url: https://你的域名.com/
   display_url: https://你的域名.com/
   logo_url: https://你的域名.com/images/logo.svg
   ```
4. 拉到底部，点 **「Commit changes」** 保存。Cloudflare 会自动重新部署（约 1 分钟）。

### 6.2 绑定你自己的域名（可选但推荐）

1. 在 Cloudflare 项目 **「Settings」→「Custom domains」→「Set up a custom domain」**，填入你的域名（如 `blog.example.com`），按提示操作。
2. 如果你的域名 DNS 不在 Cloudflare，它会提示你加一条 **CNAME 记录**，照着加到你的域名服务商后台即可。
3. 绑定后，把第 6.1 步里 config.yml 的域名改成你绑定的域名，并回到第 3 步把 OAuth 应用的 Homepage 和 Callback 也改成新域名：
   ```
   Homepage URL:  https://blog.example.com
   Callback URL:  https://blog.example.com/api/callback
   ```
   > ⚠️ 换域名后务必同步改 Callback，否则后台登录会失败。

---

## 第 7 步：登录后台，发布第一篇文章

1. 浏览器打开：`https://你的网址/admin`  
   （临时网址就是 `https://chatgpt-blog.pages.dev/admin`，绑了域名就用 `https://blog.example.com/admin`）
2. 点 **「Login with GitHub」**，用你的 GitHub 账号登录并授权（第一次会问是否授权，点 Authorize）。
3. 登录后进入后台，左侧点 **「📝 文章管理」→「全部文章」**。
4. 你会看到现有的 9 篇示例文章，每篇可以点开编辑、删除，或点 **「Add to 文章列表」/「+」** 新增一篇。
5. 新增文章时按表单填写：
   - **文章标题**：文章标题
   - **网址标识 (slug)**：英文小写 + 连字符，如 `my-first-post`（决定文章链接，发布后别改）
   - **分类**：下拉选择
   - **发布日期、阅读时长、作者、封面图标、摘要、搜索关键词**：如实填写
   - **设为首页精选**：勾选后会出现在首页"本周精选"
   - **正文**：点工具栏按钮排版。要在文中放外部链接入口，**选中文字 → 点工具栏的"链接"图标 → 粘贴网址**即可。
6. 填完点右上角 **「Publish now」**（或 Save）。
7. 等 1–2 分钟（Cloudflare 自动重新部署），刷新你的网站首页，就能看到新文章了！

🎉 **恭喜，你已经拥有了一个可视化发文的文章网站。**

---

## 以后发文的标准流程

```
打开 https://你的网址/admin
   ↓
登录（记住登录状态，通常不用每次登）
   ↓
文章管理 → 新增/编辑 → 填表单写正文 → 插入链接入口
   ↓
点 Publish now
   ↓
等 1-2 分钟，网站自动更新
```

就这么简单，**全程不用碰代码、不用传文件**。

---

## 常见问题排查

| 现象                            | 原因                              | 解决                                                                     |
| ----------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| 打开 `/admin` 一片空白              | 后台 JS 没加载完，或配置有语法错误             | 刷新重试；检查 `admin/config.yml` 缩进是否正确（只能用空格，不能用 Tab）                       |
| 登录时提示 "redirect_uri mismatch" | GitHub OAuth 的 Callback URL 填错了 | 到 GitHub OAuth 应用设置里，把 Callback 改成 `https://你的网址/api/callback`，末尾不能多字符 |
| 登录后提示没有权限提交                   | 用了没权限的 GitHub 账号                | 必须用**仓库所有者本人**的 GitHub 账号登录后台                                          |
| 发布后网站没变化                      | Cloudflare 还在部署                 | 等 1–2 分钟；到项目 Deployments 看是否 Success                                   |
| 首页/文章页显示空白或报错                 | 数据文件格式被改坏                       | 检查 `data/posts.json` 是否是合法 JSON（可复制到 JSON 校验网站检查）                      |
| 想删除示例文章                       | 后台直接删                           | 后台文章管理里删掉那 9 篇即可                                                       |
| 图片上传失败                        | 仓库是 Private 或 media 配置问题        | 确认仓库是 Public；或图片改用外部图床链接                                               |

---

## 成本与合规提醒

- **费用**：GitHub 免费 + Cloudflare Pages 免费 + Decap CMS 免费 = **0 元/年**。域名另算（约 30–90 元/年）。
- **访问速度**：Cloudflare Pages 免费版在中国大陆没有节点，访问速度不太稳定（约 100–300ms，偶尔波动）。如果读者主要在国内且要求流畅，这可能是唯一短板。
- **合规**：Cloudflare Pages 服务器在境外，**域名无需 ICP 备案**即可访问。但若面向中国大陆公众提供内容服务，请自行了解并遵守当地相关法规要求。

---

需要我帮你做 **sitemap.xml + RSS**（利于搜索引擎收录），或把示例文章清成空白模板吗？

/* ============================================================
   聚合平台-chatGPT · 交互脚本
   功能：深色模式 / 移动端菜单 / 滚动揭示动画 / 数字计数
        / 文章分类筛选 / 搜索过滤 / 文章详情渲染 / 目录生成
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     数据加载层
     优先从 data/posts.json 读取（Decap CMS 后台管理的单一数据源），
     失败时回退到内联 posts-data.js，保证本地双击打开也能预览。
     ============================================================ */
  // 让正文里的外部链接在新标签页打开，避免用户点出去就离开本站；
  // 已有 target 的不重复处理，页内锚点（#xxx）保持原窗口跳转。
  function externalizeLinks(html) {
    if (!html) return html;
    return html.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi, function (tag, href) {
      if (/^\s*#/.test(href)) return tag;                       // 页内锚点，跳过
      if (/\btarget\s*=/.test(tag)) return tag;                 // 已指定 target，跳过
      return tag.replace(/\s*>$/, ' target="_blank" rel="noopener noreferrer">');
    });
  }

  function toMap(json) {
    var map = {};
    var list = json && json.posts ? json.posts : (Array.isArray(json) ? json : []);
    list.forEach(function (p) {
      if (!p || !p.slug) return;
      // 正文：新数据为 Markdown，用 marked 渲染；已是 HTML 的直接透传
      // 注意：marked v12 的 window.marked 是对象（方法在 .parse 上），不能再判断 typeof === "function"
      var md = window.marked;
      var mdParse = md && (typeof md.parse === "function" ? md.parse.bind(md) : (typeof md === "function" ? md : null));
      var rendered;
      if (p.content != null && mdParse) {
        try { rendered = mdParse(p.content); } catch (e) { rendered = p.content; }
      } else {
        rendered = p.content || "";
      }
      p._html = externalizeLinks(rendered);
      map[p.slug] = p;
    });
    return map;
  }

  function loadPosts(done) {
    // 若环境支持 fetch，优先读取外部 JSON（线上 Cloudflare Pages 走这里）
    if (window.fetch && location.protocol !== "file:") {
      window.fetch("data/posts.json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (json) { window.POSTS = toMap(json); done(); })
        .catch(function () {
          // 回退到内联数据
          if (!window.POSTS) window.POSTS = {};
          done();
        });
    } else {
      // file:// 或旧环境：使用 posts-data.js 内联数据
      if (!window.POSTS) window.POSTS = {};
      done();
    }
  }

  /* ---------- 深色模式 ---------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("cgpt-theme", theme); } catch (e) {}
  }
  // 初始主题：本地存储 > 系统偏好 > 浅色
  (function initTheme() {
    var saved;
    try { saved = localStorage.getItem("cgpt-theme"); } catch (e) {}
    if (saved) {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark");
    }
  })();

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  /* ---------- 移动端菜单 ---------- */
  var hamburger = document.getElementById("hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // 点击菜单项后关闭
    var mm = document.getElementById("mobileMenu");
    if (mm) {
      mm.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          document.body.classList.remove("menu-open");
          hamburger.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ---------- 滚动揭示动画 ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 数字计数动画 ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var dur = 1200, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
      el.textContent = val + (target >= 10000 ? "万+" : "+");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + (target >= 10000 ? "万+" : "+");
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- 文章筛选 + 搜索（首页） ---------- */
  var filters = document.getElementById("filters");
  var grid = document.getElementById("articleGrid");
  var searchInput = document.getElementById("searchInput");
  var noResults = document.getElementById("noResults");

  var pager = document.getElementById("pager");

  var PAGE_SIZE = 12;
  var state = { filter: "all", search: "", page: 1 };

  function getFeaturedKey() {
    if (!window.POSTS) return null;
    var keys = Object.keys(window.POSTS);
    return keys.filter(function (k) { return window.POSTS[k].featured; })[0] || null;
  }

  // 当前筛选/搜索后的文章列表（已排除精选，按日期倒序）
  function getFiltered() {
    if (!window.POSTS) return [];
    var fk = getFeaturedKey();
    var list = Object.keys(window.POSTS).filter(function (k) { return k !== fk; });
    list = list.filter(function (k) {
      var p = window.POSTS[k];
      var okCat = state.filter === "all" || p.category === state.filter;
      var kw = ((p.keywords || "") + " " + p.title + " " + p.category).toLowerCase();
      var okSearch = !state.search || kw.indexOf(state.search) !== -1;
      return okCat && okSearch;
    });
    list.sort(function (a, b) {
      return (window.POSTS[b].date || "").localeCompare(window.POSTS[a].date || "");
    });
    return list;
  }

  function cardHTML(k, p) {
    return '<article class="card reveal in" data-category="' + p.category + '" data-keywords="' + ((p.keywords || "") + " " + p.title) + '">' +
        '<div class="thumb"><span class="cat-tag">' + p.category + '</span><span class="emoji">' + p.emoji + '</span></div>' +
        '<div class="body">' +
          '<div class="meta"><span>📅 ' + p.date + '</span><span>⏱ ' + p.readTime + '</span></div>' +
          '<h3><a href="post.html?slug=' + k + '">' + p.title + '</a></h3>' +
          '<p class="excerpt">' + p.excerpt + '</p>' +
          '<a href="post.html?slug=' + k + '" class="read">阅读全文 ' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        '</div></article>';
  }

  function renderGrid() {
    if (!grid) return;
    var list = getFiltered();
    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * PAGE_SIZE;
    var pageItems = list.slice(start, start + PAGE_SIZE);
    grid.innerHTML = pageItems.map(function (k) { return cardHTML(k, window.POSTS[k]); }).join("");
    if (noResults) noResults.style.display = total === 0 ? "block" : "none";
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    if (!pager) return;
    if (totalPages <= 1) { pager.innerHTML = ""; return; }
    var html = '<button class="page-btn" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? " disabled" : "") + '>‹ 上一页</button>';
    var pages = [], maxShow = 7;
    if (totalPages <= maxShow) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      var s = Math.max(2, state.page - 2);
      var e = Math.min(totalPages - 1, state.page + 2);
      if (s > 2) pages.push("...");
      for (var j = s; j <= e; j++) pages.push(j);
      if (e < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    pages.forEach(function (pg) {
      if (pg === "...") html += '<span class="page-ellipsis">…</span>';
      else html += '<button class="page-btn' + (pg === state.page ? " active" : "") + '" data-page="' + pg + '">' + pg + '</button>';
    });
    html += '<button class="page-btn" data-page="' + (state.page + 1) + '"' + (state.page === totalPages ? " disabled" : "") + '>下一页 ›</button>';
    pager.innerHTML = html;
  }

  if (pager) {
    pager.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button[data-page]") : null;
      if (!btn || btn.disabled) return;
      var pg = parseInt(btn.getAttribute("data-page"), 10);
      if (!isNaN(pg)) {
        state.page = pg;
        renderGrid();
        if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (filters) {
    filters.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        filters.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        state.filter = chip.getAttribute("data-filter");
        state.page = 1;
        renderGrid();
      });
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      state.search = searchInput.value.trim().toLowerCase();
      state.page = 1;
      renderGrid();
    });
  }

  /* ---------- 首页渲染（发文只改 data/posts.json，后台可视化管理） ---------- */
  function renderHome() {
    if (!window.POSTS) return;
    var fk = getFeaturedKey();
    var fpost = fk ? window.POSTS[fk] : null;
    var fc = document.getElementById("featuredContent");
    if (fc && fpost) {
      fc.innerHTML =
        '<div class="f-media"><span class="emoji">' + fpost.emoji + '</span></div>' +
        '<div class="f-body">' +
          '<span class="cat-tag">' + fpost.category + '</span>' +
          '<h2>' + fpost.title + '</h2>' +
          '<p>' + fpost.excerpt + '</p>' +
          '<a href="post.html?slug=' + fk + '" class="btn btn-primary">阅读全文 ' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        '</div>';
    }
    renderGrid(); // 渲染列表第一页（自动排除精选文章）
  }

  /* ============================================================
     文章详情页渲染
     ============================================================ */
  function renderPost() {
    var titleEl = document.getElementById("postTitle");
    if (!titleEl || !window.POSTS) return; // 非文章页

    var slug = new URLSearchParams(window.location.search).get("slug");
    var post = slug && window.POSTS[slug];

    if (!post) {
      // 兜底：未知 slug 时给友好提示
      post = {
        title: "文章不存在或已下架",
        category: "提示", date: "—", readTime: "—", author: "编辑部",
        emoji: "🤔", excerpt: "",
        content: "<p>抱歉，没有找到这篇文章。可能链接已失效，<a href='index.html' style='color:var(--color-primary)'>返回首页</a>看看吧。</p>"
      };
      slug = null;
    }

    var siteName = "聚合平台-chatGPT";
    var pageUrl = "https://dianlijuhe.com/post.html?slug=" + (slug || "");
    document.title = post.title + " · " + siteName;

    // 动态更新 SEO 元信息（让不执行 JS 以外的爬虫/分享也能拿到正确信息）
    var desc = post.excerpt || post.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", post.title + " · " + siteName);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", desc);
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", pageUrl);
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", pageUrl);

    // 注入文章结构化数据（Article + Breadcrumb），利于 SEO / GEO 抓取
    var schemaEl = document.getElementById("articleSchema");
    if (schemaEl) {
      var schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": desc,
        "datePublished": post.date || "",
        "author": { "@type": "Person", "name": post.author || "编辑部" },
        "publisher": { "@type": "Organization", "name": siteName },
        "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
        "inLanguage": "zh-CN"
      };
      schemaEl.textContent = JSON.stringify(schema);
    }

    titleEl.textContent = post.title;
    document.getElementById("postAuthor").textContent = post.author;
    document.getElementById("postDate").textContent = "📅 " + post.date;
    document.getElementById("postRead").textContent = "⏱ " + post.readTime;
    document.getElementById("postCat").textContent = post.category;
    document.getElementById("postAvatar").textContent = (post.author || "AI").slice(0, 1);
    document.getElementById("postCoverEmoji").textContent = post.emoji;

    var crumbCat = document.getElementById("crumbCat");
    var crumbTitle = document.getElementById("crumbTitle");
    crumbCat.textContent = post.category;
    crumbTitle.textContent = post.title;

    // 注入正文（Markdown 已由数据加载层渲染为 HTML）
    var contentEl = document.getElementById("postContent");
    if (contentEl) contentEl.innerHTML = post._html || post.content || "";

    // 生成目录（基于 h2/h3）
    buildTOC(contentEl);

    // 相关文章（同分类，排除自己，最多 3 篇）
    buildRelated(slug, post.category);

    // 更新 URL canonical / og 友好（仅前端，不影响静态托管）
    if (slug) {
      history.replaceState(null, "", "post.html?slug=" + slug);
    }
  }

  function buildTOC(contentEl) {
    var tocList = document.getElementById("tocList");
    var tocBox = document.getElementById("toc");
    if (!tocList) return;
    var heads = contentEl.querySelectorAll("h2, h3");
    if (!heads.length) { if (tocBox) tocBox.style.display = "none"; return; }
    tocList.innerHTML = "";
    heads.forEach(function (h, i) {
      if (!h.id) h.id = "sec-" + i;
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      if (h.tagName === "H3") a.style.paddingLeft = "24px";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      tocList.appendChild(a);
    });
  }

  function buildRelated(slug, category) {
    var box = document.getElementById("relatedGrid");
    if (!box || !window.POSTS) return;
    var items = Object.keys(window.POSTS)
      .filter(function (k) { return k !== slug && window.POSTS[k].category === category; })
      .slice(0, 3);
    // 不足 3 篇时，用其他分类补齐
    if (items.length < 3) {
      Object.keys(window.POSTS).forEach(function (k) {
        if (k !== slug && items.indexOf(k) === -1 && items.length < 3) items.push(k);
      });
    }
    box.innerHTML = "";
    items.forEach(function (k) {
      var p = window.POSTS[k];
      var card = document.createElement("article");
      card.className = "card";
      card.innerHTML =
        '<div class="thumb"><span class="cat-tag">' + p.category + '</span><span class="emoji">' + p.emoji + '</span></div>' +
        '<div class="body"><div class="meta"><span>📅 ' + p.date + '</span><span>⏱ ' + p.readTime + '</span></div>' +
        '<h3><a href="post.html?slug=' + k + '">' + p.title + '</a></h3>' +
        '<p class="excerpt">' + p.excerpt + '</p>' +
        '<a href="post.html?slug=' + k + '" class="read">阅读全文 <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>';
      box.appendChild(card);
    });
  }

  /* ---------- 启动：数据就绪后再渲染首页/详情页 ---------- */
  loadPosts(function () {
    // 文章总数改为真实数据（新增文章后自动更新，避免写死数字失真）
    var statPosts = document.getElementById("statPosts");
    if (statPosts && window.POSTS) {
      statPosts.setAttribute("data-count", Object.keys(window.POSTS).length);
    }
    renderHome();   // 首页：精选 + 分页列表（非首页时内部元素为空，自动跳过）
    renderPost();   // 详情页：正文 + 目录 + 相关阅读
  });
})();

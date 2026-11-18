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
    html = html.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi, function (tag, href) {
      if (/^\s*#/.test(href)) return tag;                       // 页内锚点，跳过
      if (/\btarget\s*=/.test(tag)) return tag;                 // 已指定 target，跳过
      return tag.replace(/\s*>$/, ' target="_blank" rel="noopener noreferrer">');
    });
    // 正文图片懒加载：滚动到附近才加载，避免一次性下载全部大图拖慢首屏。
    // 已有 loading 属性的不重复处理。
    html = html.replace(/<img\s+[^>]*>/gi, function (tag) {
      if (/\bloading\s*=/.test(tag)) return tag;
      return tag.replace(/\s*>$/, ' loading="lazy" decoding="async">');
    });
    return html;
  }

  // marked v12（CommonMark）规定：加粗结束符 ** 后面若紧跟"词字符"（中文/字母/数字），
  // 会被判定为无法闭合，导致 **文字**中文 原样显示星号。
  // 这里在闭合 ** 后补一个空格使其合法，保证 **注重隐私保护：**在... 能正常渲染为加粗。
  // 仅作用于 Markdown 正文，老文章的纯 HTML 内容不受影响。
  function normalizeBold(text) {
    if (!text || typeof text !== "string") return text;
    // 内容排除「句末标点 + 换行」，避免跨句把两段独立的 ** 误当成一对
    // （中间隔着 。！？；， 说明已跨句）。引号、冒号等短语句内标点允许保留。
    return text.replace(/(\*\*[^。！？；，\n*]{1,60}\*\*)(?=[\u4e00-\u9fffA-Za-z0-9])/g, "$1 ");
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
        try { rendered = mdParse(normalizeBold(p.content)); } catch (e) { rendered = p.content; }
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
  // 计数动画的绑定推迟到数据就绪后（见 loadPosts 回调里的 setupCounters），
  // 确保 animateCount 读到的 data-count 是真实文章数，而非 HTML 里写死的初始值。
  var countersReady = false;
  function setupCounters() {
    if (countersReady) return;
    countersReady = true;
    var counters = document.querySelectorAll("[data-count]");
    if ("IntersectionObserver" in window && counters.length) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(function (el) { animateCount(el); });
    }
  }

  /* ---------- 文章筛选 + 搜索（首页） ---------- */
  var filters = document.getElementById("filters");
  var grid = document.getElementById("articleGrid");
  var searchInput = document.getElementById("searchInput");
  var noResults = document.getElementById("noResults");

  var pager = document.getElementById("pager");

  var PAGE_SIZE = 12;
  var state = { filter: "all", search: "", page: 1 };

  // 所有勾选了「首页精选」的文章（最多取 6 篇）
  // 按后台发布顺序倒序：数据源里越靠后 = 越新发布的文章，倒序后最新发布的自动排第一个。
  // 用发布顺序而非「发布日期」，避免漏填/填错日期时新文章排到后面去。
  function getFeaturedKeys() {
    if (!window.POSTS) return [];
    var keys = Object.keys(window.POSTS).filter(function (k) { return window.POSTS[k].featured; });
    keys.reverse();
    return keys.slice(0, 6);
  }

  // 当前筛选/搜索后的文章列表（包含全部文章，按日期倒序）
  // 设为精选的文章会同时在顶部精选区和此列表展示，避免发布后"找不到文章"
  function getFiltered() {
    if (!window.POSTS) return [];
    var list = Object.keys(window.POSTS);
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
    // 列表卡片缩略图：优先封面图片，未上传则回退 emoji
    var thumbInner = p.cover
      ? '<img class="cover-img" src="' + p.cover + '" alt="' + (p.title || '') + '" loading="lazy">'
      : '<span class="emoji">' + p.emoji + '</span>';
    return '<article class="card reveal in" data-category="' + p.category + '" data-keywords="' + ((p.keywords || "") + " " + p.title) + '">' +
        '<div class="thumb' + (p.cover ? ' has-cover' : '') + '"><span class="cat-tag">' + p.category + '</span>' + thumbInner + '</div>' +
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
    var fks = getFeaturedKeys();
    var fc = document.getElementById("featuredContent");
    if (fc) {
      if (fks.length === 0) {
        // 没有精选文章：隐藏整个精选区
        var wrap = fc.closest(".featured");
        if (wrap) wrap.style.display = "none";
      } else {
        // 多篇精选：渲染为可横向排列的小卡片（每张左边小图 + 右边文字）
        fc.innerHTML = fks.map(function (k) {
          var p = window.POSTS[k];
          var thumb = p.cover
            ? '<img class="cover-img" src="' + p.cover + '" alt="' + (p.title || '') + '" loading="lazy">'
            : '<span class="emoji">' + p.emoji + '</span>';
          return '<a class="f-card" href="post.html?slug=' + k + '">' +
              '<div class="f-thumb' + (p.cover ? ' has-cover' : '') + '"><span class="cat-tag">' + p.category + '</span>' + thumb + '</div>' +
              '<div class="f-info">' +
                '<h3>' + p.title + '</h3>' +
                '<div class="f-excerpt">' + (p.excerpt || '') + '</div>' +
                '<span class="f-read">阅读全文 ' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
              '</div>' +
            '</a>';
        }).join('');
      }
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

    var siteName = "AI聚合";
    var pageUrl = "https://dianlijuhe.com/post.html?slug=" + (slug || "");
    document.title = post.title + " - " + siteName;

    // 动态更新 SEO 元信息（让不执行 JS 以外的爬虫/分享也能拿到正确信息）
    var desc = post.excerpt || post.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", post.title + " - " + siteName);
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
    // 详情页封面：有上传图片则显示图片，未上传则显示 emoji
    var coverEl = document.getElementById("postCover");
    if (coverEl) {
      if (post.cover) {
        // 有封面图：加标识类，让 CSS 按原图比例完整显示（不裁切）
        coverEl.classList.add("has-image");
        coverEl.innerHTML = '<img class="cover-img" src="' + post.cover + '" alt="' + (post.title || '') + '" fetchpriority="high">';
      } else {
        coverEl.classList.remove("has-image");
        coverEl.innerHTML = '<span class="emoji" id="postCoverEmoji">' + post.emoji + '</span>';
      }
    }

    var crumbCat = document.getElementById("crumbCat");
    var crumbTitle = document.getElementById("crumbTitle");
    crumbCat.textContent = post.category;
    crumbTitle.textContent = post.title;

    // 注入正文（Markdown 已由数据加载层渲染为 HTML）
    var contentEl = document.getElementById("postContent");
    if (contentEl) contentEl.innerHTML = post._html || post.content || "";

    // 生成目录（基于 h2/h3）
    buildTOC(contentEl);

    // 移动端：把目录搬到首图上方，方便点小标题直接跳转；
    // 电脑端目录保持在正文右侧，完全不变。
    placeTOCForMobile();

    // 相关文章（同分类，排除自己，最多 3 篇）
    buildRelated(slug, post.category);

    // 更新 URL canonical / og 友好（仅前端，不影响静态托管）
    if (slug) {
      history.replaceState(null, "", "post.html?slug=" + slug);
    }
  }

  // 移动端目录位置：≤980px 时移到首图上方（电脑端保持原位）
  // 用 matchMedia 监听，横竖屏/窗口缩放切换时自动归位
  function placeTOCForMobile() {
    var tocBox = document.getElementById("toc");
    var coverEl = document.getElementById("postCover");
    var layout = document.querySelector(".post-layout");
    if (!tocBox || !coverEl || !layout) return;

    var mq = window.matchMedia("(max-width: 980px)");
    function apply() {
      if (mq.matches) {
        // 移动端：插到首图容器里、首图之前
        var host = coverEl.parentElement;
        if (host && tocBox.parentElement !== host) {
          host.insertBefore(tocBox, coverEl);
        }
        tocBox.classList.add("toc-mobile");
      } else {
        // 电脑端：还原到正文右侧（article 之后）
        if (tocBox.parentElement !== layout) {
          layout.appendChild(tocBox);
        }
        tocBox.classList.remove("toc-mobile");
      }
    }
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else if (mq.addListener) mq.addListener(apply);
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
      // 相关阅读卡片同样优先封面图片，未上传回退 emoji
      var relatedThumb = p.cover
        ? '<img class="cover-img" src="' + p.cover + '" alt="' + (p.title || '') + '" loading="lazy">'
        : '<span class="emoji">' + p.emoji + '</span>';
      card.innerHTML =
        '<div class="thumb' + (p.cover ? ' has-cover' : '') + '"><span class="cat-tag">' + p.category + '</span>' + relatedThumb + '</div>' +
        '<div class="body"><div class="meta"><span>📅 ' + p.date + '</span><span>⏱ ' + p.readTime + '</span></div>' +
        '<h3><a href="post.html?slug=' + k + '">' + p.title + '</a></h3>' +
        '<p class="excerpt">' + p.excerpt + '</p>' +
        '<a href="post.html?slug=' + k + '" class="read">阅读全文 <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>';
      box.appendChild(card);
    });
  }

  /* ---------- 回到顶部：全站通用（首页 + 文章页） ---------- */
  function setupToTop() {
    // 已存在则不重复创建，避免脚本被引入两次时出现两个按钮
    if (document.querySelector(".to-top")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "回到顶部");
    btn.title = "回到顶部";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(btn);

    var ticking = false;
    function sync() {
      // 超过一屏高度才显示，首屏阅读区不受干扰
      btn.classList.toggle("show", window.scrollY > window.innerHeight);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;               // rAF 节流：滚动时不做多余计算
      ticking = true;
      window.requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener("resize", sync, { passive: true });

    btn.addEventListener("click", function () {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });

    sync(); // 刷新时若已在页面中部（浏览器恢复滚动位置），立即显示
  }

  /* ---------- 启动：数据就绪后再渲染首页/详情页 ---------- */
  loadPosts(function () {
    // 文章总数改为真实数据（新增文章后自动更新，避免写死数字失真）
    var statPosts = document.getElementById("statPosts");
    if (statPosts && window.POSTS) {
      var total = Object.keys(window.POSTS).length;
      // 仅在成功读到文章时覆盖；数据为空时保留 HTML 初始值，避免显示 0+
      if (total > 0) statPosts.setAttribute("data-count", total);
    }
    // 数据就绪后再绑定计数动画，确保读到上面的真实文章数
    setupCounters();
    renderHome();   // 首页：精选 + 分页列表（非首页时内部元素为空，自动跳过）
    renderPost();   // 详情页：正文 + 目录 + 相关阅读
    setupToTop();   // 回到顶部按钮：所有页面通用
  });
})();

/**
 * 静态 HTML 报告生成器
 * 读取 output/*.json 采集结果，生成一个内联数据的 index.html
 * 用户可直接双击打开，无需服务器或 Zion 配置
 */

import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');
const PROJECT_EX_ID = 'rmLyJ0ZJXK8';

interface XHSNote {
  title: string;
  content: string;
  author_name: string;
  images: string[];
  likes: number;
  collects: number;
  comments_count: number;
  comments?: Array<{ author: string; content: string; likes: number }>;
  comments_extracted?: number;
  keyword: string;
  note_url: string;
  crawl_time: string;
}

function loadData(): XHSNote[] {
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('comments_') && !f.startsWith('test_') && !f.startsWith('Zion_') && !f.startsWith('sync_errors_'));
  const all: XHSNote[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8'));
      if (Array.isArray(data)) all.push(...data);
    } catch {
      // ignore invalid json
    }
  }
  // 去重按 note_url
  const seen = new Set<string>();
  return all.filter((item) => {
    if (!item.note_url || seen.has(item.note_url)) return false;
    seen.add(item.note_url);
    return true;
  });
}

function generateHTML(data: XHSNote[]): string {
  const total = data.length;
  const totalLikes = data.reduce((s, i) => s + (i.likes || 0), 0);
  const totalCollects = data.reduce((s, i) => s + (i.collects || 0), 0);
  const totalComments = data.reduce((s, i) => s + (i.comments_count || 0), 0);
  const avgLikes = total > 0 ? Math.round(totalLikes / total) : 0;
  const keywords = [...new Set(data.map((d) => d.keyword).filter(Boolean))];

  const jsonData = JSON.stringify(data, null, 2);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小红书数据摘要报告 - 好痛 Howtone</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: #f43f5e;       /* Rose-500: 优雅的高级玫红 */
      --primary-hover: #e11d48; /* Rose-600 */
      --bg: #fafafa;            /* 极简淡灰背景 */
      --card-bg: #ffffff;
      --text: #09090b;          /* Zinc-950: 高级深墨 */
      --text-muted: #52525b;    /* Zinc-600: 辅助字色 */
      --text-light: #a1a1aa;    /* Zinc-400 */
      --border: #f4f4f5;        /* Zinc-100 */
      --border-dark: #e4e4e7;   /* Zinc-200 */
      --tag-bg: #fff1f2;        /* Rose-50 */
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      letter-spacing: -0.01em;
      padding-bottom: 5rem;
    }
    header {
      background: white;
      border-bottom: 1px solid var(--border);
      padding: 3rem 2rem;
      text-align: center;
    }
    header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
    }
    header p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    
    /* 核心提示：好痛云端推广 Banner */
    .howtone-banner {
      background: #09090b;
      color: #ffffff;
      padding: 3rem 2rem;
      border-radius: 16px;
      margin: 2rem auto;
      max-width: 1200px;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.15);
      position: relative;
      overflow: hidden;
    }
    .howtone-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(0,0,0,0) 70%);
      pointer-events: none;
    }
    .howtone-banner-content {
      max-width: 850px;
      position: relative;
      z-index: 2;
    }
    .howtone-tag {
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.75rem;
      background: rgba(244, 63, 94, 0.18);
      border: 1px solid rgba(244, 63, 94, 0.35);
      color: #fda4af;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .howtone-banner h2 {
      font-size: 1.65rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      letter-spacing: -0.02em;
    }
    .howtone-banner p {
      color: #d4d4d8;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.75rem;
    }
    .howtone-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.7rem 1.5rem;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px -1px rgba(244, 63, 94, 0.3);
    }
    .howtone-btn:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.4);
    }

    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .stats {
      display: flex;
      justify-content: flex-start;
      gap: 3.5rem;
      padding: 1.5rem 0;
      background: none;
      border-bottom: 1px solid var(--border-dark);
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .stat-item {
      text-align: left;
    }
    .stat-value {
      font-size: 1.85rem;
      font-weight: 700;
      color: var(--text);
    }
    .stat-label {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 500;
      margin-top: 0.2rem;
    }

    .filters-wrapper {
      max-width: 1200px;
      margin: 0 auto;
    }
    .filters {
      padding: 1rem 0;
      background: transparent;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }
    .filter-btn {
      padding: 0.35rem 1rem;
      border: 1px solid var(--border-dark);
      background: white;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .filter-btn:hover, .filter-btn.active {
      border-color: var(--primary);
      background: var(--tag-bg);
      color: var(--primary);
    }
    .search-box {
      flex: 1;
      min-width: 200px;
      padding: 0.35rem 1.2rem;
      border: 1px solid var(--border-dark);
      border-radius: 9999px;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.2s;
    }
    .search-box:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.12);
    }
    .export-btn {
      padding: 0.35rem 1rem;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      color: white;
      transition: all 0.2s;
    }
    .export-btn.csv { background: var(--text); }
    .export-btn.csv:hover { background: #27272a; }
    .export-btn.md { background: var(--text-muted); }
    .export-btn.md:hover { background: #52525b; }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      border-radius: 12px;
      border: 1px solid var(--border-dark);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px -5px rgba(0,0,0,0.04);
      border-color: #d4d4d8;
    }
    .card-images {
      display: flex;
      gap: 2px;
      padding: 6px;
      background: #fafafa;
      border-bottom: 1px solid var(--border);
    }
    .card-images img {
      flex: 1;
      height: 130px;
      object-fit: cover;
      border-radius: 6px;
    }
    .card-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-keyword {
      display: inline-flex;
      padding: 0.15rem 0.5rem;
      background: var(--tag-bg);
      color: var(--primary);
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      align-self: flex-start;
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }
    .card-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 1rem;
      flex: 1;
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
    .card-author {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text);
    }
    .card-stats {
      display: flex;
      gap: 0.75rem;
      font-size: 0.8rem;
      color: var(--text-light);
    }
    .comments-section {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border-dark);
    }
    .comments-toggle {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
    }
    .comments-list {
      margin-top: 0.5rem;
      display: none;
    }
    .comments-list.show {
      display: block;
    }
    .comment-item {
      padding: 0.5rem 0.75rem;
      background: var(--bg);
      border-radius: 6px;
      margin-bottom: 0.4rem;
      font-size: 0.8rem;
    }
    .comment-author {
      color: var(--text-muted);
      font-weight: 500;
      font-size: 0.75rem;
    }
    .comment-content {
      color: var(--text);
      margin-top: 0.15rem;
    }

    .pain-points-section {
      background: white;
      margin: 3rem auto;
      max-width: 1200px;
      padding: 2.5rem;
      border-radius: 16px;
      border: 1px solid var(--border-dark);
    }
    .pain-points-section h2 {
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .pain-point-item {
      padding: 1.25rem;
      background: var(--bg);
      border-radius: 10px;
      margin-bottom: 0.75rem;
      border-left: 4px solid var(--primary);
    }
    .pain-point-item h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.35rem;
    }
    .pain-point-item p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-light); }
    footer { text-align: center; padding: 3rem 0; color: var(--text-light); font-size: 0.8rem; }
  </style>
</head>
<body>
  <header>
    <h1>📕 小红书数据摘要报告</h1>
    <p>${keywords.join(' · ')} · 共 ${total} 条笔记摘要</p>
  </header>

  <!-- Howtone SaaS 导流与定位 Banner -->
  <div class="howtone-banner">
    <div class="howtone-banner-content">
      <div class="howtone-tag">🎯 好痛 Howtone AI 赋能</div>
      <h2>💡 本地数据初步摘要报告</h2>
      <p>
        注意：当前报告仅为根据您的本地过滤条件生成的<strong>初步原始数据摘要</strong>。<br>
        本地客户端计算与归因能力有限，不具备深度商业分析价值。
        如需体验更专业的<strong>多维痛点语义归因、核心商机自动发现、客户声音智能存档、以及爆款小红书推广文案一键生成</strong>，请将数据同步并访问我们的「好痛 Howtone」云端分析平台。
      </p>
      <a href="https://zion-app.functorz.com/zero/${PROJECT_EX_ID}/" target="_blank" class="howtone-btn">
        ✨ 一键同步并访问「好痛 Howtone」
      </a>
    </div>
  </div>

  <div class="stats-container">
    <div class="stats">
      <div class="stat-item"><div class="stat-value">${total}</div><div class="stat-label">采集笔记数</div></div>
      <div class="stat-item"><div class="stat-value">${totalLikes}</div><div class="stat-label">总点赞量</div></div>
      <div class="stat-item"><div class="stat-value">${totalCollects}</div><div class="stat-label">总收藏量</div></div>
      <div class="stat-item"><div class="stat-value">${totalComments}</div><div class="stat-label">总评论量</div></div>
      <div class="stat-item"><div class="stat-value">${avgLikes}</div><div class="stat-label">平均获赞数</div></div>
    </div>
  </div>

  <div class="filters-wrapper">
    <div class="filters">
      <button class="filter-btn active" data-filter="all">全部关键词</button>
      ${keywords.map(k => `<button class="filter-btn" data-filter="${k}">${k}</button>`).join('')}
      <input type="text" class="search-box" placeholder="搜索标题、正文、评论..." id="search">
      <button class="export-btn csv" onclick="exportCSV()">📥 导出 CSV 数据</button>
      <button class="export-btn md" onclick="exportMarkdown()">📝 导出 Markdown</button>
    </div>
  </div>

  <div class="container" id="cards"></div>

  <div class="pain-points-section">
    <h2>📌 核心痛点初步过滤 (根据本地关键词匹配)</h2>
    <div id="pain-points"></div>
  </div>

  <footer>
    <p>生成时间: ${new Date().toLocaleString('zh-CN')} · 弦外 Overtone 采集工具提供支持</p>
  </footer>

  <script>
    const allData = ${jsonData};

    function renderCards(data) {
      const container = document.getElementById('cards');
      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state">没有找到匹配的内容</div>';
        return;
      }
      container.innerHTML = data.map((item, idx) => \`
        <div class="card" data-keyword="\${item.keyword || ''}">
          \${item.images && item.images.length ? \`
            <div class="card-images">
              \${item.images.slice(0, 3).map(img => \`<img src="\${img}" alt="" loading="lazy">\`).join('')}
            </div>
          \` : ''}
          <div class="card-content">
            <span class="card-keyword">#\${item.keyword || ''}</span>
            <div class="card-title">\${item.title || '无标题'}</div>
            <div class="card-text">\${item.content || ''}</div>
            <div class="card-meta">
              <span class="card-author">\${item.author_name || '匿名'}</span>
              <div class="card-stats">
                <span>👍 \${item.likes || 0}</span>
                <span>⭐ \${item.collects || 0}</span>
                <span>💬 \${item.comments_count || 0}</span>
              </div>
            </div>
            \${item.comments && item.comments.length ? \`
              <div class="comments-section">
                <button class="comments-toggle" onclick="toggleComments(\${idx})">
                  💬 查看 \${item.comments.length} 条评论
                </button>
                <div class="comments-list" id="comments-\${idx}">
                  \${item.comments.map(c => \`
                    <div class="comment-item">
                      <div class="comment-author">\${c.author}</div>
                      <div class="comment-content">\${c.content}</div>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}
          </div>
        </div>
      \`).join('');
    }

    function toggleComments(idx) {
      const el = document.getElementById('comments-' + idx);
      el.classList.toggle('show');
    }

    function renderPainPoints() {
      const painWords = ['坑', '痛点', '缺点', '后悔', '避雷', '吐槽', '难用', '局限', '失败', '困难', '问题'];
      const items = allData.filter(item =>
        painWords.some(w => (item.title + item.content).includes(w))
      ).slice(0, 8);
      document.getElementById('pain-points').innerHTML = items.map(item => \`
        <div class="pain-point-item">
          <h4>\${item.title}</h4>
          <p>\${(item.content || '').substring(0, 200)}...</p>
        </div>
      \`).join('') || '<p style="color:#999">暂无匹配痛点关键词的笔记</p>';
    }

    let currentFilter = 'all', searchTerm = '';
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        filterAndRender();
      });
    });
    document.getElementById('search').addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      filterAndRender();
    });
    function filterAndRender() {
      let filtered = allData;
      if (currentFilter !== 'all') filtered = filtered.filter(i => i.keyword === currentFilter);
      if (searchTerm) {
        filtered = filtered.filter(i =>
          (i.title + i.content + (i.comments || []).map(c => c.content).join('')).toLowerCase().includes(searchTerm)
        );
      }
      renderCards(filtered);
    }

    function exportCSV() {
      const headers = ['标题', '关键词', '点赞', '收藏', '评论数', '作者', '内容', '评论内容'];
      const rows = allData.map(item => [
        (item.title || '').replace(/"/g, '""'),
        item.keyword || '',
        item.likes || 0, item.collects || 0, item.comments_count || 0,
        (item.author_name || '').replace(/"/g, '""'),
        (item.content || '').replace(/"/g, '""').substring(0, 500),
        (item.comments || []).map(c => c.content).join('; ').substring(0, 300)
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => \`"\${c}"\`).join(',')).join('\\n');
      downloadFile(csv, 'xhs_report.csv', 'text/csv');
    }
    function exportMarkdown() {
      let md = '# 小红书采集报告\\n\\n';
      md += \`> 生成时间: \${new Date().toLocaleString('zh-CN')} | 共 \${allData.length} 篇笔记\\n\\n---\\n\\n\`;
      allData.forEach((item, i) => {
        md += \`## \${i + 1}. \${item.title || '无标题'}\\n\\n\`;
        md += \`**关键词**: #\${item.keyword || ''} | **点赞**: \${item.likes || 0} | **收藏**: \${item.collects || 0}\\n\\n\`;
        md += \`**内容**:\\n\\n\${(item.content || '').substring(0, 600)}...\\n\\n\`;
        if (item.comments && item.comments.length) {
          md += '**评论**:\\n';
          item.comments.forEach(c => { md += \`- \${c.author}: \${c.content}\\n\`; });
          md += '\\n';
        }
        md += '---\\n\\n';
      });
      downloadFile(md, 'xhs_report.md', 'text/markdown');
    }
    function downloadFile(content, filename, type) {
      const blob = new Blob([content], { type: type + ';charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }

    renderCards(allData);
    renderPainPoints();
  </script>
</body>
</html>`;
}

export function generateReport() {
  const data = loadData();
  if (data.length === 0) {
    console.log('⚠️ 没有找到采集数据，跳过报告生成');
    return;
  }
  const html = generateHTML(data);
  const filepath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(filepath, html);
  console.log(`📊 静态报告已生成: ${filepath} (${data.length} 条笔记)`);
  console.log('   直接双击打开即可查看，无需服务器');
}

// CLI 入口
if (require.main === module) {
  generateReport();
}

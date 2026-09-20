(function () {
  'use strict';

  const data = window.guideData;
  const progressKey = 'pokemmo-parallel-guide-progress-v1';
  const state = { view: 'overview', phaseId: 'u1', activeStep: 0, query: '', zoom: 1, progress: loadProgress() };
  const regionById = Object.fromEntries(data.regions.map((region) => [region.id, region]));
  const phaseById = Object.fromEntries(data.phases.map((phase) => [phase.id, phase]));
  const regionOrder = data.regions.map((region) => region.id);
  const parallelPhases = [...data.phases].sort((a, b) => a.order - b.order);
  const parallelNotes = {
    u1: { badge: '飞翔 01', text: '帆巴馆后得到飞翔，傲骨燕学习飞翔；飞回飞云，从机场转去关东。' },
    k1: { badge: '飞翔 02', text: '枯叶道馆后可以直接飞翔；回华蓝拿自行车，再从枯叶码头转去城都。' },
    j1: { badge: '暂不解锁', text: '先走到浅葱市；湛蓝和浅葱暂缓，坐船转去丰缘，城都飞翔留到后面。' },
    h1: { badge: '前半完成', text: '丰缘推进到第六馆后转入神奥。原文没有单独列出飞翔道具房间，这里按后续跨区用法标为可飞窗口。' },
    s1: { badge: '轮换窗口', text: '帷幕仓库拿到飞翔；野原第五馆后进入正式跨区轮换，下一站回关东。' },
    k2: { badge: '轮换 01', text: '已能飞，回华蓝后走 9 号路、岩山隧道、紫苑、彩虹，完成关东第 4 馆。' },
    j2: { badge: '飞翔 05', text: '湛蓝道馆完成后开始使用城都飞点；至此五地区都可坐船或飞，下一站转合众。' },
    u2: { badge: '轮换 02', text: '帆巴向左走 6 号路、电石洞穴、吹寄天堂塔，下一站回城都。' },
    j3: { badge: '轮换 03', text: '城都火箭队基地与卡吉道馆完成后，飞去神奥野原处理第 6 馆。' },
    s2: { badge: '轮换 04', text: '水脉第 6 馆完成后飞回合众，继续 7 号路和螺丝山。' },
    u3: { badge: '轮换 05', text: '雪花第 7 馆完成后转丰缘水静、送火山、绿岭。' },
    h2: { badge: '轮换 06', text: '绿岭第 7 馆完成后回合众，补龙螺旋之塔、荒野名胜区和双龙。' },
    u4: { badge: '轮换 07', text: '双龙第 8 馆完成后转城都满金电视台和烟墨。' },
    j4: { badge: '轮换 08', text: '烟墨第 8 馆和攀瀑完成后回神奥，处理雪地和第 7 馆。' },
    s3: { badge: '轮换 09', text: '雪峰第 7 馆完成后回关东，进入火箭队总部线。' },
    k3: { badge: '轮换 10', text: '浅红第 6 馆完成后转丰缘绿岭，推进潜水和天空之柱。' },
    h3: { badge: '轮换 11', text: '琉璃第 8 馆完成后回城都打凤王剧情。' },
    j5: { badge: '轮换 12', text: '凤王完成后转关东红莲岛，补第 7 馆。' },
    k4: { badge: '轮换 13', text: '红莲第 7 馆完成后转神奥帷幕、天冠山和滨海。' },
    s4: { badge: '轮换 14', text: '滨海第 8 馆完成后回关东，收常磐最后一馆。' },
    k5: { badge: '八馆完成', text: '关东八馆完成，进入城都冠军之路。' },
    j6: { badge: '联盟 01', text: '城都联盟完成后，按顺序进入合众冠军之路。' },
    u5: { badge: '联盟 02', text: '合众联盟与 N / N 他爹完成后，转丰缘冠军之路。' },
    h4: { badge: '联盟 03', text: '丰缘联盟完成后，转神奥冠军之路。' },
    s5: { badge: '联盟 04', text: '神奥联盟完成后，最后回关东联盟。' },
    k6: { badge: '收官', text: '关东冠军之路和联盟完成，五地区平行通关结束。' }
  };

  function loadProgress() {
    const empty = { completed: {}, current: { phaseId: 'u1', index: 0 } };
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || 'null');
      if (!saved || typeof saved !== 'object') return empty;
      return {
        completed: saved.completed && typeof saved.completed === 'object' ? saved.completed : {},
        current: saved.current && typeof saved.current === 'object' ? saved.current : empty.current
      };
    } catch (error) {
      return empty;
    }
  }

  function saveProgress() {
    try { localStorage.setItem(progressKey, JSON.stringify(state.progress)); } catch (error) { /* private browsing may disable storage */ }
  }

  function detailItems(phase) {
    return data.detailGuides?.[phase.id] || [];
  }

  function phaseProgress(phase) {
    const items = detailItems(phase);
    const flags = state.progress.completed[phase.id] || [];
    const done = items.reduce((count, item, index) => count + (flags[index] ? 1 : 0), 0);
    return { done, total: items.length, flags };
  }

  function totalProgress() {
    return parallelPhases.reduce((total, phase) => {
      const progress = phaseProgress(phase);
      return { done: total.done + progress.done, total: total.total + progress.total };
    }, { done: 0, total: 0 });
  }

  function currentDetail() {
    const phase = phaseById[state.progress.current.phaseId] || parallelPhases[0];
    const items = detailItems(phase);
    const index = Math.max(0, Math.min(Number(state.progress.current.index) || 0, Math.max(items.length - 1, 0)));
    return { phase, item: items[index], index };
  }

  function normalizePlace(value) {
    return String(value || '').replace(/[\s/→·、，,。]/g, '');
  }

  function guidePoint(phase, item) {
    const text = normalizePlace(`${item.place} ${item.action}`);
    const route = phase.route || [];
    for (let index = 0; index < route.length; index += 1) {
      const point = route[index];
      const name = String(point.name || '');
      const aliases = [name, name.replace(/[市镇]$/, ''), name.replace(/号路$/, '路')].filter(Boolean);
      if (aliases.some((alias) => alias.length > 1 && text.includes(normalizePlace(alias)))) return { ...point, index };
    }
    return null;
  }

  // Road-following traces keep the overlay on the actual road network of each
  // source map. Named stops remain in data.js; these bends are visual geometry.
  const roadTraces = {
    u1: [[90.6,94],[90.6,82],[89,70],[79.3,70],[69,70],[60,73],[51.5,77.3],[51.5,54.1],[28.9,54.1]],
    u2: [[28.9,54.1],[24,49],[21,45],[15.6,39.8],[20,34],[24,29]],
    u3: [[15.6,39.8],[20,34],[22,32],[24,29],[28.9,25.5]],
    u4: [[28.9,25.5],[24.5,18],[24,25],[24,38],[29,51],[40,54],[51.5,54.1],[46,53],[43,53],[47,53],[51.5,54.1],[51.5,25.5]],
    u5: [[51.5,25.5],[56,20],[62,13],[66.4,8.8]],
    k1: [[22.7,91],[22.7,73],[22.7,58],[22.7,36],[36,36],[50,30.5],[64.6,30.5],[64.6,47],[64.6,63.9]],
    k2: [[64.6,30.5],[75,30.5],[80,38],[81.5,47.3],[72,47.3],[64.6,47.3],[52.1,47.3]],
    k3: [[52.1,47.3],[64.6,47.3],[81.5,47.3],[81.5,63.9]],
    k4: [[22.7,91],[22.7,82],[31,81],[43,81],[56.7,81]],
    k5: [[22.7,73],[22.7,70]],
    k6: [[22.7,73],[22.7,58],[18,58],[14.6,45],[14.6,30.5]],
    j1: [[33,49],[40,40],[45,25],[40,34],[33,49],[33,70],[39,70],[48,70],[57,49]],
    j2: [[16,70],[18,67],[16,73],[13,77],[10,84]],
    j3: [[10,84],[18,75],[28,70],[39,70],[48,58],[57,49],[70,40],[81,31],[75,24]],
    j4: [[39,70],[43,67],[43,62],[48,58],[57,49],[70,40],[81,31],[84,20]],
    j5: [[57,49],[58,45],[60,42]],
    j6: [[10,84],[15,85],[25,77],[35,63],[45,50],[58,35],[70,30],[89,10]],
    h1: [[15,70],[10,65],[4.6,58],[4.6,40],[10,50],[10,65],[10,84],[18,78],[29.5,65],[31,42.6],[37,28],[42,11]],
    h2: [[62.1,27.5],[70,31],[80.7,37.6],[75,44],[66,51],[74,51],[81,50],[88.7,55.1]],
    h3: [[88.7,55.1],[79,53],[72,58],[67,63],[70,47.8],[66,60],[64,78]],
    h4: [[88.7,55.1],[90.6,59.9],[87.8,60.9]],
    s1: [[17.3,77.6],[24,77],[30.7,76.7],[42,76],[57.9,73.7],[50,63],[43,54],[36.8,44.6],[42,50],[49.8,57],[60,59],[71.8,60.6],[77,68],[83.9,76.9]],
    s2: [[83.9,76.9],[76,70],[71.8,60.6],[64,51],[59,43],[50,40],[46,37],[38,47],[30,58],[18,67],[5.8,73.2]],
    s3: [[5.8,73.2],[18,67],[30,58],[42,51],[50,40],[38,25],[38.2,6.5]],
    s4: [[38.2,6.5],[45,20],[50,40],[60,55],[71.8,60.6],[57.9,73.7],[50,40],[65,48],[75,62],[83.9,76.9]],
    s5: [[83.9,76.9],[84.5,62],[84.5,48],[84.5,35.9],[88,23],[92.9,8.8]]
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function phaseMatches(phase, query) {
    if (!query) return true;
    const details = (data.detailGuides?.[phase.id] || []).flatMap((item) => Object.values(item));
    const text = [phase.title, phase.kicker, phase.summary, phase.focus, ...phase.steps.flat(), ...details].join(' ').toLowerCase();
    return text.includes(query.toLowerCase());
  }

  function getFirstPhase(regionId) {
    return data.phases.find((phase) => phase.region === regionId);
  }

  function renderPhaseLinks(targetId, compact = false) {
    const filtered = data.phases.filter((phase) => phaseMatches(phase, state.query));
    if (!filtered.length) return '<div class="search-empty">没有找到匹配的阶段</div>';
    const linkForPhase = (phase) => `
      <button class="phase-link ${state.view === 'phase' && state.phaseId === phase.id ? 'is-active' : ''}" type="button" data-phase-id="${phase.id}" aria-current="${state.phaseId === phase.id ? 'step' : 'false'}">
        <span class="phase-num">${String(phase.order).padStart(2, '0')}</span>
        <span class="phase-label">${escapeHtml(phase.title)}</span>
        <span class="phase-progress">${phaseProgress(phase).done}/${phaseProgress(phase).total}</span>
      </button>`;
    if (compact) return filtered.map(linkForPhase).join('');
    return regionOrder.map((regionId) => {
      const region = regionById[regionId];
      const phases = filtered.filter((phase) => phase.region === regionId);
      if (!phases.length) return '';
      const group = compact ? '' : `<div class="phase-group-label">${region.name} · ${region.en}</div>`;
      const links = phases.map(linkForPhase).join('');
      return group + links;
    }).join('');
  }

  function renderSidebarNav() {
    $('#phaseNav').innerHTML = renderPhaseLinks('phaseNav', true);
    const overall = totalProgress();
    $('#phaseCountLabel').textContent = `${data.phases.length} · ${overall.done}/${overall.total}`;
    $('#overviewBtn').classList.toggle('is-active', state.view === 'overview' && !state.query);
  }

  function renderOverview() {
    const intro = `
      <section class="page-intro">
        <div>
          <div class="eyebrow">parallel five-region route</div>
          <h2>把五张地图，串成一条能走通的路线。</h2>
          <p>这是一份把《平行通关流程（暂定）》重新编排成地图工作台的攻略：先看阶段，再看地图，最后按步骤处理 NPC、道馆与资源。</p>
        </div>
        <div class="intro-meta"><strong>26</strong><span>阶段</span><i class="dot-sep"></i><strong>5</strong><span>地区</span></div>
      </section>`;
    const flow = data.regions.map((region, index) => {
      const first = getFirstPhase(region.id);
      return `<button class="region-card" type="button" data-region-id="${region.id}">
        <span class="region-dot" style="background:${region.tone}">${String(index + 1).padStart(2, '0')}</span>
        <h4>${region.name}</h4><p>${escapeHtml(region.tagline)}</p><span class="flow-tag">${region.caps}</span>
      </button>`;
    }).join('');
    const rules = [
      ['01', '等级上限优先', '每个地区打完不同道馆后等级上限会变化，队伍不要越过当前上限。'],
      ['02', '能坐船或飞就换区', '把重复练级分散到五地区，用轮换路线节省时间和药品。'],
      ['03', '主力不必全员出场', '天蝎王、乐天河童、宝石海星负责清路，其余主力只处理难点。'],
      ['04', '文档中的建议不是硬规则', '流程按原文整理，翻车时以当前版本和自己的队伍状态为准。']
    ].map(([num, title, copy]) => `<li><span class="rule-num">${num}</span><div><strong>${title}</strong><span>${copy}</span></div></li>`).join('');
    const team = data.team.map((member) => `<div class="team-chip" style="--team-color:${member.color}"><strong>${member.name}</strong><span>${member.type}</span></div>`).join('');
    const overall = totalProgress();
    const current = currentDetail();
    const currentPlace = current.item ? `${current.phase.title} · ${current.item.place}` : current.phase.title;
    const currentCopy = current.item ? current.item.action : '点击阶段导航开始记录。';
    const currentPercent = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;
    return `${intro}
      <div class="reference-banner"><span>◉</span><span><b>地图说明</b> 当前地图使用五地区总览图，并在上面叠加攻略阶段的路线节点；点击任意地区即可进入对应阶段。</span></div>
      <section class="panel progress-panel"><div class="progress-summary"><div><div class="eyebrow">local progress</div><h3>继续上次推进位置</h3><p><strong>${escapeHtml(currentPlace)}</strong><br>${escapeHtml(currentCopy)}</p></div><button class="progress-continue" type="button" data-phase-id="${current.phase.id}">打开当前位置</button></div><div class="progress-meter"><span style="width:${currentPercent}%"></span></div><div class="progress-foot"><span>本机已记录 ${overall.done} / ${overall.total} 个步骤</span><span>${currentPercent}%</span></div></section>
      <div class="overview-grid">
        <section class="panel flow-panel">
          <div class="panel-heading"><div><h3>五地区轮换路线</h3><p>按照文档顺序，先完成前半段道馆，再进入等级轮换。</p></div><span class="tiny-link">点击地区进入</span></div>
          <div class="region-flow">${flow}</div>
          <div class="stats-row"><div class="stat"><strong>26</strong><span>路线阶段</span></div><div class="stat"><strong>5</strong><span>地区地图</span></div><div class="stat"><strong>8</strong><span>联盟收官节点</span></div></div>
        </section>
        <section class="panel rules-panel"><div class="panel-heading"><div><h3>平行通关的四条原则</h3><p>先理解节奏，再照地图走。</p></div></div><ol class="rules-list">${rules}</ol></section>
      </div>
      ${renderParallelRoute()}
      <section class="panel overview-team"><div class="panel-heading"><div><h3>推荐队伍骨架</h3><p>原文主力五只 + 三只工具宠的职责划分。</p></div><span class="tiny-link">查看完整配置</span></div><div class="team-strip">${team}</div></section>`;
  }

  function renderSearchResults() {
    const results = data.phases.filter((phase) => phaseMatches(phase, state.query));
    const cards = results.map((phase) => {
      const region = regionById[phase.region];
      return `<button type="button" class="search-result" data-phase-id="${phase.id}" style="--result-color:${region.tone}"><span class="result-region">${region.name}</span><strong>${phase.title}</strong><span>${escapeHtml(phase.summary)}</span><small>${phase.npc} · 等级 ${phase.cap}</small></button>`;
    }).join('');
    return `<section class="page-intro"><div><div class="eyebrow">search route notes</div><h2>搜索结果</h2><p>正在检索“${escapeHtml(state.query)}”在城市、道路、道馆、道具和战斗提示中的出现位置。</p></div></section><div class="search-results">${cards || '<div class="panel search-empty">没有找到匹配内容。试试城市名、道馆、隐形岩或飞翔。</div>'}</div>`;
  }

  function renderParallelRoute() {
    const rows = parallelPhases.map((phase, index) => {
      const region = regionById[phase.region];
      const next = parallelPhases[index + 1];
      const note = parallelNotes[phase.id] || { badge: '继续', text: `完成本段后转去 ${next ? `${regionById[next.region].name} · ${next.title}` : '下一阶段'}。` };
      const nextLabel = next ? `下一站：${regionById[next.region].name} · ${next.title}` : '下一站：五地区流程完成';
      return `<button class="route-row" type="button" data-phase-id="${phase.id}">
        <span class="route-num" style="--route-color:${region.tone}">${String(phase.order).padStart(2, '0')}</span>
        <span class="route-main"><strong>${region.name} · ${phase.title}</strong><span>${escapeHtml(phase.kicker)} · ${escapeHtml(phase.cap)} · ${escapeHtml(phase.npc)}</span></span>
        <span class="route-handoff"><b style="color:${region.tone}">${escapeHtml(note.badge)}</b><span>${escapeHtml(note.text)}</span><em>${escapeHtml(nextLabel)}</em></span>
      </button>`;
    }).join('');
    return `<section class="panel parallel-panel"><div class="panel-heading"><div><h3>实际平行轮换顺序</h3><p>按原文的跨地区执行顺序排列：每一行就是一个“打到这里 → 转去下一地区”的接力点。</p></div><span class="tiny-link">点击任意行查看地图</span></div><div class="route-board">${rows}</div></section>`;
  }

  function renderMap(phase, region) {
    const points = phase.route || [];
    // `route` holds named stops.  `path` is an optional, denser trace that
    // follows the road network on the source map between those stops.
    const path = roadTraces[phase.id] || phase.path || points;
    const polyline = path.map((point) => `${point.x},${point.y}`).join(' ');
    const markers = points.map((point, index) => `
      <button class="map-marker ${state.activeStep === index ? 'is-active' : ''}" type="button" data-step-index="${index}" style="left:${point.x}%;top:${point.y}%;--route-color:${region.tone}" aria-label="第 ${index + 1} 个地图节点：${escapeHtml(point.name)}">
        ${String(index + 1).padStart(2, '0')}<span class="map-marker-label">${escapeHtml(point.name)}</span>
      </button>`).join('');
    return `<section class="panel map-panel" style="--route-color:${region.tone}">
      <div class="map-panel-head"><div><h3>${region.name}地图</h3><p>${escapeHtml(region.tagline)}</p></div><div class="map-tools"><button class="map-tool" type="button" data-zoom="out" aria-label="缩小地图">−</button><span class="map-tool zoom-value">${Math.round(state.zoom * 100)}%</span><button class="map-tool" type="button" data-zoom="in" aria-label="放大地图">＋</button><button class="map-tool" type="button" data-zoom="reset" aria-label="还原地图">↺</button></div></div>
      <div class="map-viewport"><div class="map-canvas" style="aspect-ratio:${region.ratio};transform:scale(${state.zoom})"><img src="${region.map}" alt="${region.name}地区总览图"><svg viewBox="0 0 100 100" role="img" aria-label="${phase.title}路线示意"><polyline class="route-glow" points="${polyline}"></polyline><polyline class="route-line" points="${polyline}"></polyline>${points.map((point) => `<circle class="route-point" cx="${point.x}" cy="${point.y}" r="1.3"></circle>`).join('')}</svg>${markers}</div></div>
      <div class="map-caption"><span><strong>${phase.title}</strong> · 路线节点按原文中的地区与城镇顺序标记</span><span><a href="https://pokemmo.info/maps" target="_blank" rel="noreferrer">地图来源与更多地图 ↗</a>${region.id === 'unova' ? ' · <a href="assets/maps/Unova-reference.png" target="_blank" rel="noreferrer">查看你提供的合众截图 ↗</a>' : ''}</span></div>
    </section>`;
  }

  function renderDetailedGuide(phase, region) {
    const details = detailItems(phase);
    if (!details.length) return '';
    const progress = phaseProgress(phase);
    const items = details.map((item, index) => {
      const point = guidePoint(phase, item);
      const done = Boolean(progress.flags[index]);
      const isCurrent = state.progress.current.phaseId === phase.id && state.progress.current.index === index;
      const visual = point
        ? `<button class="guide-visual" type="button" data-step-index="${point.index}" aria-label="在地图上定位 ${escapeHtml(point.name)}" style="background-image:url('${region.map}');background-position:${point.x}% ${point.y}%"><span>地图定位</span><i></i></button>`
        : `<div class="guide-visual is-overview" style="background-image:url('${region.map}')"><span>路线图</span></div>`;
      return `
      <li class="guide-item ${done ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}">
        <span class="guide-index">${String(index + 1).padStart(2, '0')}</span>
        ${visual}
        <div class="guide-body">
          <div class="guide-topline"><strong>${escapeHtml(item.place)}</strong><span class="guide-region-dot" style="background:${region.tone}"></span>${isCurrent ? '<em class="current-label">当前位置</em>' : ''}</div>
          <p class="guide-action">${escapeHtml(item.action)}</p>
          <div class="guide-meta">
            ${item.npc ? `<span class="guide-chip guide-npc">${escapeHtml(item.npc)}</span>` : ''}
            ${item.gain ? `<span class="guide-chip guide-gain">${escapeHtml(item.gain)}</span>` : ''}
          </div>
          <div class="guide-controls">
            <button class="guide-check ${done ? 'is-checked' : ''}" type="button" data-progress-toggle="true" data-progress-phase="${phase.id}" data-progress-index="${index}" aria-label="${done ? '取消完成' : '标记完成'}第 ${index + 1} 步">${done ? '✓ 已完成' : '○ 标记完成'}</button>
            <button class="guide-current ${isCurrent ? 'is-current' : ''}" type="button" data-current-position="true" data-current-phase="${phase.id}" data-current-index="${index}">${isCurrent ? '当前推进位置' : '设为当前位置'}</button>
          </div>
        </div>
      </li>`;
    }).join('');
    return `<section class="panel guide-panel">
      <div class="panel-heading guide-heading"><div><h3>图文执行清单</h3><p>点击小地图可定位路线；完成一步就勾选，想记录正在推进的位置就点“设为当前位置”。NPC 编号沿用原文统计，跳过的可选战已注明。</p></div><div class="guide-tools"><span class="guide-count">${progress.done}/${details.length} 步</span><button class="progress-reset" id="resetProgressBtn" type="button">清除本机进度</button></div></div>
      <ol class="guide-list">${items}</ol>
    </section>`;
  }

  function renderPhaseView() {
    const phase = phaseById[state.phaseId] || data.phases[0];
    const region = regionById[phase.region];
    const progress = phaseProgress(phase);
    const progressPercent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    const steps = phase.steps.map((step, index) => `<li class="step-item ${state.activeStep === index ? 'is-active' : ''}" data-step-index="${index}"><span class="step-index">${String(index + 1).padStart(2, '0')}</span><div><span class="step-place">${escapeHtml(step[0])}</span><p class="step-copy">${escapeHtml(step[1])}</p><span class="step-tag">${escapeHtml(step[2])}</span></div></li>`).join('');
    const rail = renderPhaseLinks('phaseRail', true);
    const phaseIndex = parallelPhases.findIndex((item) => item.id === phase.id);
    const previous = parallelPhases[phaseIndex - 1];
    const next = parallelPhases[phaseIndex + 1];
    const note = parallelNotes[phase.id] || { badge: '接力点', text: `完成后转去 ${next ? `${regionById[next.region].name} · ${next.title}` : '五地区流程完成'}。` };
    const handoff = `<section class="panel handoff-panel"><div class="handoff-top"><span class="handoff-label">${escapeHtml(note.badge)}</span><span>${escapeHtml(note.text)}</span></div><div class="handoff-nav"><span>${previous ? `上一站：${regionById[previous.region].name} · ${previous.title}` : '起点：新号从合众开始'}</span><b>→</b><strong>${next ? `下一站：${regionById[next.region].name} · ${next.title}` : '五地区流程完成'}</strong></div></section>`;
    return `<section class="page-intro"><div><div class="eyebrow">${region.en} · phase ${String(phase.order).padStart(2, '0')}</div><h2>${escapeHtml(phase.kicker)}</h2><p>先按地图节点确认方向，再按“逐步执行攻略”推进剧情、NPC、道馆、技能和道具。</p></div><div class="intro-meta"><strong>${escapeHtml(phase.cap)}</strong><span>等级上限</span><i class="dot-sep"></i><strong>${escapeHtml(phase.npc.replace('NPC ×', '×'))}</strong><span>原文统计 NPC</span></div></section>
      <div class="detail-layout">
        <aside class="panel phase-rail"><h3>阶段导航</h3><div class="phase-nav">${rail}</div></aside>
        ${renderMap(phase, region)}
        <aside class="detail-panel" style="--route-color:${region.tone}">
          <section class="panel phase-header"><div class="phase-kicker"><span>${region.name} / ${phase.kicker}</span><span class="phase-badge" style="background:${region.tone}">${String(phase.order).padStart(2, '0')}</span></div><h2>${escapeHtml(phase.title)}</h2><p>${escapeHtml(phase.summary)}</p><div class="phase-meta"><span class="meta-pill">${escapeHtml(phase.cap)} 级上限</span><span class="meta-pill">${escapeHtml(phase.npc)}</span><span class="meta-pill">${progress.done}/${progress.total} 步已完成</span></div><div class="phase-progress-track"><span style="width:${progressPercent}%"></span></div></section>
          ${handoff}
          <section class="panel step-panel"><h3 class="section-title">地图节点摘要</h3><ol class="step-list">${steps}</ol></section>
          <section class="panel focus-panel"><h3>这一段记住什么</h3><p>${escapeHtml(phase.focus)}</p></section>
        </aside>
      </div>
      <div class="full-guide" style="--route-color:${region.tone}">${renderDetailedGuide(phase, region)}</div>`;
  }

  function render() {
    renderSidebarNav();
    const view = $('#appView');
    if (state.query) {
      $('#breadcrumbLabel').textContent = `搜索：${state.query}`;
      view.innerHTML = renderSearchResults();
      return;
    }
    if (state.view === 'overview') {
      $('#breadcrumbLabel').textContent = '五地区总览';
      view.innerHTML = renderOverview();
    } else {
      const phase = phaseById[state.phaseId];
      $('#breadcrumbLabel').textContent = phase ? phase.title : '阶段视图';
      view.innerHTML = renderPhaseView();
    }
  }

  function selectPhase(phaseId) {
    if (!phaseById[phaseId]) return;
    state.view = 'phase'; state.phaseId = phaseId; state.activeStep = 0; state.zoom = 1; state.query = '';
    $('#searchInput').value = '';
    $('#sidebar').classList.remove('is-open');
    render();
  }

  document.addEventListener('click', (event) => {
    const progressTarget = event.target.closest('[data-progress-toggle]');
    if (progressTarget) {
      const phaseId = progressTarget.dataset.progressPhase;
      const index = Number(progressTarget.dataset.progressIndex);
      const phase = phaseById[phaseId];
      if (phase) {
        const flags = [...(state.progress.completed[phaseId] || [])];
        flags[index] = !flags[index];
        state.progress.completed[phaseId] = flags;
        if (flags[index]) {
          const nextIndex = index + 1;
          const nextPhase = nextIndex < detailItems(phase).length ? phase : parallelPhases[phase.order];
          state.progress.current = nextPhase
            ? { phaseId: nextPhase.id, index: nextPhase === phase ? nextIndex : 0 }
            : { phaseId, index };
        } else {
          state.progress.current = { phaseId, index };
        }
        saveProgress();
        render();
      }
      return;
    }
    const currentTarget = event.target.closest('[data-current-position]');
    if (currentTarget) {
      state.progress.current = { phaseId: currentTarget.dataset.currentPhase, index: Number(currentTarget.dataset.currentIndex) };
      saveProgress();
      render();
      return;
    }
    if (event.target.closest('#resetProgressBtn')) {
      state.progress = { completed: {}, current: { phaseId: 'u1', index: 0 } };
      saveProgress();
      render();
      return;
    }
    const phaseButton = event.target.closest('[data-phase-id]');
    if (phaseButton) { selectPhase(phaseButton.dataset.phaseId); return; }
    const overviewButton = event.target.closest('#overviewBtn');
    if (overviewButton) { state.view = 'overview'; state.query = ''; $('#searchInput').value = ''; render(); return; }
    const regionButton = event.target.closest('[data-region-id]');
    if (regionButton) { const first = getFirstPhase(regionButton.dataset.regionId); if (first) selectPhase(first.id); return; }
    const stepTarget = event.target.closest('[data-step-index]');
    if (stepTarget && state.view === 'phase') { state.activeStep = Number(stepTarget.dataset.stepIndex); render(); return; }
    const zoomTarget = event.target.closest('[data-zoom]');
    if (zoomTarget && state.view === 'phase') {
      if (zoomTarget.dataset.zoom === 'in') state.zoom = Math.min(1.8, +(state.zoom + .1).toFixed(1));
      if (zoomTarget.dataset.zoom === 'out') state.zoom = Math.max(.8, +(state.zoom - .1).toFixed(1));
      if (zoomTarget.dataset.zoom === 'reset') state.zoom = 1;
      render(); return;
    }
    if (event.target.closest('#mobileMenu')) { $('#sidebar').classList.toggle('is-open'); return; }
    if (event.target.closest('#printBtn')) { window.print(); return; }
  });

  $('#searchInput').addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    if (state.query) state.view = 'search';
    else if (state.view === 'search') state.view = 'overview';
    render();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { $('#sidebar').classList.remove('is-open'); }
  });

  render();
})();

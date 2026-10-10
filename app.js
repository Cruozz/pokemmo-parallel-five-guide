(async function () {
  'use strict';

  const editor = window.guideEditor;
  await editor.ready;
  const data = window.guideData;
  const progressKey = 'pokemmo-parallel-guide-progress-v1';
  const state = { view: 'overview', phaseId: 'u1', activeStep: 0, query: '', zoom: 1, progress: loadProgress() };
  const regionById = Object.fromEntries(data.regions.map((region) => [region.id, region]));
  const phaseById = Object.fromEntries(data.phases.map((phase) => [phase.id, phase]));
  const regionOrder = data.regions.map((region) => region.id);
  const parallelPhases = [...data.phases].sort((a, b) => a.order - b.order);
  const parallelNotes = () => Object.fromEntries(parallelPhases.map((phase, index) => {
    const next = parallelPhases[index + 1];
    const plan = data.routePlans[phase.id];
    return [phase.id, {
      badge: index === parallelPhases.length - 1 ? '收官' : phase.order >= 22 ? `联盟 ${phase.order - 21}` : '完成后转区',
      text: `${plan.finish}${next ? `返回${data.travelPorts[phase.region]}，坐船前往${regionById[next.region].name}。` : ''}`
    }];
  }));

  function npcLabel(phase) {
    return phase.npc.replace('NPC ×', '原文 NPC 编号至 ');
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || 'null');
      return editor.hydrateProgress(saved);
    } catch (error) {
      return editor.hydrateProgress(null);
    }
  }

  function saveProgress() {
    try { localStorage.setItem(progressKey, JSON.stringify(editor.progressForStorage(state.progress))); } catch (error) { /* private browsing may disable storage */ }
  }

  function detailItems(phase) {
    return data.detailGuides?.[phase.id] || [];
  }

  function phaseProgress(phase) {
    const items = detailItems(phase);
    const completed = new Set(state.progress.completedById[phase.id] || []);
    const flags = items.map(item => completed.has(item.id));
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
    const matching = items.findIndex(item => item.id === state.progress.current.stepId);
    const index = matching >= 0 ? matching : Math.max(0, Math.min(Number(state.progress.current.index) || 0, Math.max(items.length - 1, 0)));
    return { phase, item: items[index], index };
  }

  function guidePoints(phase, guideIndex) {
    return phase.route.map((point, index) => ({ ...point, index }))
      .filter((point) => point.guideIndices.includes(guideIndex));
  }

  function renderRouteGuides(phase) {
    const guides = data.routeGuides?.[phase.id] || [];
    if (!guides.length && phase.id !== 'j6') return '';
    if (!guides.length) return '<section class="panel route-guide-panel"><h3>城都冠军之路 · 地图待核对</h3><p>城都使用心金／魂银版本，不能套用关东火红／叶绿冠军之路。暂未收录核对过的分层路线图，请结合下方执行清单和原文截图推进。</p></section>';
    return `<section class="panel route-guide-panel"><div class="panel-heading"><div><h3>复杂地图走法</h3><p>先看入口与楼层，再沿原图标记前进；地区总览连线不代表洞内路线。</p></div></div>${guides.map((guide) => `<article class="route-guide"><h4>${escapeHtml(guide.title)}</h4><p class="route-version">${escapeHtml(guide.version)}</p><ol>${guide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><p class="route-caution">${escapeHtml(guide.caution)}</p><div class="route-map-grid">${guide.maps.map((map) => `<figure><a href="${map.src}" target="_blank" rel="noreferrer" aria-label="放大 ${escapeHtml(map.label)}"><img src="${map.src}" alt="${escapeHtml(map.label)}：${escapeHtml(map.description)}" loading="lazy" width="${map.width}" height="${map.height}"></a><figcaption><strong>${escapeHtml(map.label)}</strong><span>${escapeHtml(map.description)}</span><a href="${map.src}" target="_blank" rel="noreferrer">打开本地大图 ↗</a></figcaption></figure>`).join('')}</div><p class="route-source">来源：<a href="${guide.source}" target="_blank" rel="noreferrer">${escapeHtml(guide.credit)} ↗</a> · 核对日期：2026-09-28</p></article>`).join('')}</section>`;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function phaseMatches(phase, query) {
    if (!query) return true;
    const details = (data.detailGuides?.[phase.id] || []).flatMap((item) => Object.values(item));
    const plan = data.routePlans[phase.id];
    const visualText = (data.stepVisuals[phase.id] || []).flatMap(step => step.maps.flatMap(ref => {
      const note = data.mapNotes[ref.id];
      return [ref.title, ...(note?.points || []).map(point => point.label), ...(note?.walkthrough || [])];
    }));
    const text = [phase.title, phase.kicker, phase.summary, phase.focus, phase.cap, npcLabel(phase),
      ...phase.steps.flat(), ...details, plan.start, plan.finish, plan.arrival,
      ...plan.requirements, ...plan.reminders, data.travelPorts[phase.region], ...visualText].join(' ').toLowerCase();
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
      ['02', '地区内飞翔，跨地区坐船', '飞翔用于当前地区已解锁的返回点；跨地区先回本地区港口，再和船员对话。'],
      ['03', '只看路线与剧情', '按入口、剧情触发点和 NPC 编号推进，不绑定特定精灵或配招。'],
      ['04', '文档中的建议不是硬规则', '流程按原文整理，翻车时以当前版本和自己的队伍状态为准。']
    ].map(([num, title, copy]) => `<li><span class="rule-num">${num}</span><div><strong>${title}</strong><span>${copy}</span></div></li>`).join('');

    const overall = totalProgress();
    const current = currentDetail();
    const illustrated = parallelPhases.reduce((count,phase) => count + (data.stepVisuals[phase.id] || []).filter(visual => visual.shots.length || visual.maps.length).length, 0);
    const currentPlace = current.item ? `${current.phase.title} · ${current.item.place}` : current.phase.title;
    const currentCopy = current.item ? current.item.action : '点击阶段导航开始记录。';
    const currentPercent = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;
    return `${intro}
      <div class="reference-banner"><span aria-hidden="true">◉</span><span><b>已有 ${illustrated}/${overall.total} 步配有图解</b> · 场景截图与对应全图直接配在步骤中，点击地图放大查看。地区总览连线表示地点顺序，洞内走法见本步图解。</span></div>
      <section class="panel progress-panel"><div class="progress-summary"><div><div class="eyebrow">local progress</div><h3>继续上次推进位置</h3><p><strong>${escapeHtml(currentPlace)}</strong><br>${escapeHtml(currentCopy)}</p></div><button class="progress-continue" type="button" data-phase-id="${current.phase.id}" data-jump-guide-index="${current.index}">打开当前位置</button></div><div class="progress-meter"><span style="width:${currentPercent}%"></span></div><div class="progress-foot"><span>本机已记录 ${overall.done} / ${overall.total} 个步骤</span><span>${currentPercent}%</span></div></section>
      <div class="overview-grid">
        <section class="panel flow-panel">
          <div class="panel-heading"><div><h3>五地区轮换路线</h3><p>按照文档顺序，先完成前半段道馆，再进入等级轮换。</p></div><span class="tiny-link">点击地区进入</span></div>
          <div class="region-flow">${flow}</div>
          <div class="stats-row"><div class="stat"><strong>26</strong><span>路线阶段</span></div><div class="stat"><strong>5</strong><span>地区地图</span></div><div class="stat"><strong>5</strong><span>联盟收官阶段</span></div></div>
        </section>
        <section class="panel rules-panel"><div class="panel-heading"><div><h3>平行通关的四条原则</h3><p>先理解节奏，再照地图走。</p></div></div><ol class="rules-list">${rules}</ol></section>
      </div>
      ${renderTravelReference()}
      ${renderParallelRoute()}
      `;
  }

  function renderSearchResults() {
    const results = data.phases.filter((phase) => phaseMatches(phase, state.query));
    const cards = results.map((phase) => {
      const region = regionById[phase.region];
      return `<button type="button" class="search-result" data-phase-id="${phase.id}" style="--result-color:${region.tone}"><span class="result-region">${region.name}</span><strong>${escapeHtml(phase.title)}</strong><span>${escapeHtml(phase.summary)}</span><small>${escapeHtml(npcLabel(phase))} · 等级 ${escapeHtml(phase.cap)}</small></button>`;
    }).join('');
    return `<section class="page-intro"><div><div class="eyebrow">search route notes</div><h2>搜索结果</h2><p>正在检索“${escapeHtml(state.query)}”在城市、道路、道馆、道具和战斗提示中的出现位置。</p></div></section><div class="search-results">${cards || '<div class="panel search-empty">没有找到匹配内容。试试城市名、道馆、山洞或飞翔。</div>'}</div>`;
  }

  function renderParallelRoute() {
    const rows = parallelPhases.map((phase, index) => {
      const region = regionById[phase.region];
      const next = parallelPhases[index + 1];
      const note = parallelNotes()[phase.id] || { badge: '继续', text: `完成本段后转去 ${next ? `${regionById[next.region].name} · ${next.title}` : '下一阶段'}。` };
      const nextLabel = next ? `下一站：${next.title}` : '下一站：五地区流程完成';
      return `<button class="route-row" type="button" data-phase-id="${phase.id}">
        <span class="route-num" style="--route-color:${region.tone}">${String(phase.order).padStart(2, '0')}</span>
        <span class="route-main"><strong>${escapeHtml(phase.title)}</strong><span>${escapeHtml(phase.kicker)} · 上限 ${escapeHtml(phase.cap)} · ${escapeHtml(npcLabel(phase))}</span></span>
        <span class="route-handoff"><b style="color:${region.tone}">${escapeHtml(note.badge)}</b><span>${escapeHtml(note.text)}</span><em>${escapeHtml(nextLabel)}</em></span>
      </button>`;
    }).join('');
    return `<section class="panel parallel-panel"><div class="panel-heading"><div><h3>实际平行轮换顺序</h3><p>按原文的跨地区执行顺序排列：每一行就是一个“打到这里 → 转去下一地区”的接力点。</p></div><span class="tiny-link">点击任意行查看地图</span></div><div class="route-board">${rows}</div></section>`;
  }

  function renderTravelReference() {
    const caps = {
      unova: [20,24,27,31,35,38,43,46,56], kanto: [20,26,32,37,46,47,50,55,62],
      johto: [20,24,29,32,37,39,41,46,48], hoenn: [20,24,28,33,35,38,44,48,58],
      sinnoh: [20,27,29,34,37,43,46,52,60]
    };
    const rows = data.regions.map(region => `<tr><th scope="row">${region.name}</th>${caps[region.id].map(cap => `<td>${cap}</td>`).join('')}</tr>`).join('');
    const ports = data.regions.map(region => `<li><strong>${region.name}</strong><span>${data.travelPorts[region.id]}</span></li>`).join('');
    const source = data.contentSources.caps;
    return `<details class="panel travel-reference"><summary>出发前查阅 · 五地区港口与等级上限</summary><p>第一次离开起始地区需先取得四枚徽章。跨地区通过船员选择目的地；飞翔只用于地区内已解锁的返回点。新地区尚未抵达港口时，可检查家中妈妈的返回选项。</p><ul class="port-list">${ports}</ul><div class="cap-table-wrap"><table class="cap-table"><caption>徽章数量对应的等级上限参考</caption><thead><tr><th scope="col">地区</th>${Array.from({length:9}, (_, i) => `<th scope="col">${i} 枚</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p>城都八馆后为 48，凤王剧情完成后为 55。各地区分别检查；角色信息中的当前上限优先于资料表。NPC 编号沿用原文，不代表本阶段的战斗数量。</p><p class="route-source">等级资料：<a href="${source.url}" target="_blank" rel="noreferrer">${source.title} ↗</a></p></details>`;
  }

  function renderRoutePlan(phase) {
    const plan = data.routePlans[phase.id];
    const next = parallelPhases[parallelPhases.findIndex(item => item.id === phase.id) + 1];
    const transfer = next ? `返回${data.travelPorts[phase.region]} → 与跨区船员对话 → ${regionById[next.region].name}。${plan.arrival}` : plan.arrival;
    return `<section class="panel route-plan"><div class="panel-heading"><div><h3>这一段怎么走</h3><p>先检查出发条件，达到完成条件后再转去下一站。</p></div><button type="button" class="progress-continue" data-guide-index="0">开始执行清单 ↓</button></div><dl class="route-plan-grid"><div><dt>从哪里开始</dt><dd>${escapeHtml(plan.start)}</dd></div><div><dt>打到哪里停</dt><dd>${escapeHtml(plan.finish)}</dd></div><div><dt>通路与前置条件</dt><dd>${plan.requirements.length ? plan.requirements.map(escapeHtml).join('；') : '按主线剧情推进；无需新增通路能力。'}</dd></div><div><dt>怎么转去下一站</dt><dd>${escapeHtml(transfer)}</dd></div></dl><ul class="route-reminders">${plan.reminders.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>${plan.sources.length ? `<p class="route-source">补充依据：${plan.sources.map(key => { const source = data.contentSources[key]; return `<a href="${source.url}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} ↗</a>`; }).join(' · ')}</p>` : ''}</section>`;
  }

  function renderMap(phase, region) {
    const points = phase.route || [];
    // The overview shows first-visit order, not surveyed road geometry.
    const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
    const markers = points.map((point, index) => `
      <button class="map-marker ${state.activeStep === index ? 'is-active' : ''}" type="button" data-step-index="${index}" style="left:${point.x}%;top:${point.y}%;--route-color:${region.tone}" aria-label="第 ${index + 1} 个地图节点：${escapeHtml(point.name)}" aria-pressed="${state.activeStep === index}">
        ${String(index + 1).padStart(2, '0')}<span class="map-marker-label">${escapeHtml(point.name)}</span>
      </button>`).join('');
    return `<section class="panel map-panel" style="--route-color:${region.tone}">
      <div class="map-panel-head"><div><h3>${region.name}地图</h3><p>${escapeHtml(region.tagline)}</p></div><div class="map-tools"><button class="map-tool" type="button" data-zoom="out" aria-label="缩小地图">−</button><span class="map-tool zoom-value">${Math.round(state.zoom * 100)}%</span><button class="map-tool" type="button" data-zoom="in" aria-label="放大地图">＋</button><button class="map-tool" type="button" data-zoom="reset" aria-label="还原地图">↺</button></div></div>
      <div class="map-viewport"><div class="map-canvas" style="aspect-ratio:${region.ratio};transform:scale(${state.zoom})"><img src="${region.map}" alt="${region.name}地区总览图"><svg viewBox="0 0 100 100" role="img" aria-label="${escapeHtml(phase.title)}地点顺序示意，连线不表示实际道路"><polyline class="route-glow" points="${polyline}"></polyline><polyline class="route-line" points="${polyline}"></polyline>${points.map((point) => `<circle class="route-point" cx="${point.x}" cy="${point.y}" r="1.3"></circle>`).join('')}</svg>${markers}</div></div>
      <div class="map-caption"><span><strong>地点顺序示意</strong> · 编号与右侧摘要一致；同城返回见执行清单。连线不表示实际道路、洞内通路或跨区航线。</span><span><a href="https://pokemmo.info/maps" target="_blank" rel="noreferrer">地图来源与更多地图 ↗</a>${region.id === 'unova' ? ' · <a href="assets/maps/Unova-reference.png" target="_blank" rel="noreferrer">合众原始参考图 ↗</a>' : ''}</span></div>
    </section>`;
  }

  function renderKeyShots(phase, index) {
    const shots = data.keyShots?.[phase.id]?.[index] || [];
    if (!shots.length) return '';
    return `<div class="key-shots">${shots.map((shot) => `<figure class="key-shot"><a href="${shot.src}" target="_blank" rel="noreferrer" aria-label="放大：${escapeHtml(shot.kind)}"><img src="${shot.src}" loading="lazy" alt="${escapeHtml(shot.caption)}"></a><figcaption><strong>${escapeHtml(shot.kind)}</strong>${escapeHtml(shot.caption)}<small>来源：Word 原文截图 · 已人工核对场景 · 点击图片放大</small></figcaption></figure>`).join('')}</div>`;
  }

  function renderDetailedGuide(phase, region) {
    const details = detailItems(phase);
    const progress = phaseProgress(phase);
    const items = details.map((item, index) => {
      const points = guidePoints(phase, index);
      const done = Boolean(progress.flags[index]);
      const isCurrent = state.progress.current.phaseId === phase.id && currentDetail().index === index;

      const mapLocator = points.map(point => `<button class="guide-map-location" type="button" data-step-index="${point.index}" data-locate-map="true" aria-label="在总览地图上定位 ${escapeHtml(point.name)}">⌖ 总览定位：${escapeHtml(point.name)}</button>`).join(' ');
      return `
      <li id="guide-${phase.id}-${index}" tabindex="-1" class="guide-item ${done ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}">
        <span class="guide-index">${String(index + 1).padStart(2, '0')}</span>
        <div class="guide-body">
          <div class="guide-topline"><strong>${escapeHtml(item.place)}</strong><span class="guide-region-dot" style="background:${region.tone}"></span>${isCurrent ? '<em class="current-label">当前位置</em>' : ''}</div>
          ${editor.renderStepTools(phase, index)}
          <p class="guide-action">${escapeHtml(item.action)}</p>
          <div class="guide-meta">
            ${item.npc ? `<span class="guide-chip guide-npc">${escapeHtml(item.npc)}</span>` : ''}
            ${item.gain ? `<span class="guide-chip guide-gain">${escapeHtml(item.gain)}</span>` : ''}
          </div>

          ${window.guideVisuals.renderStep(phase, index)}
          ${mapLocator}
          <div class="guide-controls">
            <button class="guide-check ${done ? 'is-checked' : ''}" type="button" data-progress-toggle="true" data-progress-phase="${phase.id}" data-progress-index="${index}" aria-label="${done ? '取消完成' : '标记完成'}第 ${index + 1} 步">${done ? '✓ 已完成' : '○ 标记完成'}</button>
            <button class="guide-current ${isCurrent ? 'is-current' : ''}" type="button" data-current-position="true" data-current-phase="${phase.id}" data-current-index="${index}">${isCurrent ? '当前推进位置' : '设为当前位置'}</button>
          </div>
        </div>
      </li>`;
    }).join('');
    return `<section class="panel guide-panel">
      <div class="panel-heading guide-heading"><div><h3>逐步执行清单</h3><p>每一步配场景截图或对应全图。地图上的编号可点击放大查看动作；多楼层图可在本步展开。地形参考、目标标注与分段走法分别标明，原文 NPC 编号保留在步骤上方。</p></div><div class="guide-tools"><span class="guide-count">${progress.done}/${details.length} 步</span><button class="progress-reset" id="resetProgressBtn" type="button">清除本机进度</button></div></div>
      ${editor.renderPhaseTools(phase)}
      ${details.length ? `<ol class="guide-list">${items}</ol>` : '<p class="editor-empty">本阶段还没有步骤。开启“编辑流程”后，可以新增步骤或还原本阶段。</p>'}
    </section>`;
  }

  function renderPhaseView() {
    const phase = phaseById[state.phaseId] || data.phases[0];
    const region = regionById[phase.region];
    const progress = phaseProgress(phase);
    const progressPercent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    const details = detailItems(phase);
    const steps = phase.route.map((point, index) => `<li class="step-item ${state.activeStep === index ? 'is-active' : ''}"><button type="button" class="step-index" data-step-index="${index}" aria-label="选择地图节点 ${escapeHtml(point.name)}" aria-pressed="${state.activeStep === index}">${String(index + 1).padStart(2, '0')}</button><div class="node-summary-content"><div class="node-summary-heading"><span class="step-place">${escapeHtml(point.name)}</span>${editor.renderNodeTools(phase,point)}</div>${point.summary ? `<p class="step-copy node-summary">${escapeHtml(point.summary)}</p>` : ''}<div class="node-summary-links" aria-label="${escapeHtml(point.name)}的详细步骤">${point.guideIndices.map(guideIndex => `<button type="button" class="step-guide-link" data-guide-index="${guideIndex}">步骤 ${String(guideIndex + 1).padStart(2,'0')} · ${escapeHtml(details[guideIndex].place)} ↓</button>`).join('')}</div></div></li>`).join('');

    const phaseIndex = parallelPhases.findIndex((item) => item.id === phase.id);
    const previous = parallelPhases[phaseIndex - 1];
    const next = parallelPhases[phaseIndex + 1];
    const note = parallelNotes()[phase.id] || { badge: '接力点', text: `完成后转去 ${next ? `${regionById[next.region].name} · ${next.title}` : '五地区流程完成'}。` };
    const handoff = `<section class="panel handoff-panel"><div class="handoff-top"><span class="handoff-label">${escapeHtml(note.badge)}</span><span>${escapeHtml(note.text)}</span></div><div class="handoff-nav">${previous ? `<button type="button" class="phase-transfer" data-phase-id="${previous.id}">← 上一站：${escapeHtml(previous.title)}</button>` : '<span>起点：新号从合众开始</span>'}${next ? `<button type="button" class="phase-transfer" data-phase-id="${next.id}">下一站：${escapeHtml(next.title)} →</button>` : '<strong>五地区流程完成</strong>'}</div></section>`;
    return `<section class="page-intro"><div><div class="eyebrow">${region.en} · phase ${String(phase.order).padStart(2, '0')}</div><h2>${escapeHtml(phase.kicker)}</h2><p>按阶段完成条件和执行清单推进；总览地图用于确认地点与对应步骤。</p></div><div class="intro-meta"><strong>${escapeHtml(phase.cap)}</strong><span>本地区等级上限</span><i class="dot-sep"></i><strong>${escapeHtml(phase.npc.replace('NPC ×', ''))}</strong><span>原文 NPC 编号至</span></div></section>
      ${renderRoutePlan(phase)}
      <div class="detail-layout">

        ${renderMap(phase, region)}
        <aside class="detail-panel" style="--route-color:${region.tone}">
          <section class="panel phase-header"><div class="phase-kicker"><span>${region.name} / ${escapeHtml(phase.kicker)}</span><span class="phase-badge" style="background:${region.tone}">${String(phase.order).padStart(2, '0')}</span></div><h2>${escapeHtml(phase.title)}</h2><p>${escapeHtml(phase.summary)}</p><div class="phase-meta"><span class="meta-pill">${escapeHtml(phase.cap)} 级上限</span><span class="meta-pill">${escapeHtml(npcLabel(phase))}</span><span class="meta-pill">${progress.done}/${progress.total} 步已完成</span></div><div class="phase-progress-track"><span style="width:${progressPercent}%"></span></div></section>
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

  function scrollToGuide(index) {
    const item = document.getElementById(`guide-${state.phaseId}-${index}`);
    if (item) { item.scrollIntoView({ block: 'start' }); item.focus({ preventScroll: true }); }
  }

  function selectPhase(phaseId, guideIndex) {
    if (!phaseById[phaseId]) return;
    state.view = 'phase'; state.phaseId = phaseId; state.activeStep = 0; state.zoom = 1; state.query = '';
    $('#searchInput').value = '';
    $('#sidebar').classList.remove('is-open');
    render();
    if (guideIndex !== undefined) scrollToGuide(guideIndex);
    else window.scrollTo({ top: 0 });
  }

  document.addEventListener('click', (event) => {
    const progressTarget = event.target.closest('[data-progress-toggle]');
    if (progressTarget) {
      const phaseId = progressTarget.dataset.progressPhase;
      const index = Number(progressTarget.dataset.progressIndex);
      const phase = phaseById[phaseId];
      if (phase) {
        const item = detailItems(phase)[index];
        const completed = new Set(state.progress.completedById[phaseId] || []);
        const wasDone = completed.has(item.id);
        if (wasDone) completed.delete(item.id); else completed.add(item.id);
        state.progress.completedById[phaseId] = [...completed];
        if (!wasDone) {
          const nextIndex = index + 1;
          const nextPhase = nextIndex < detailItems(phase).length ? phase : parallelPhases.slice(phase.order).find(p => detailItems(p).length);
          const targetIndex = nextPhase === phase ? nextIndex : 0;
          state.progress.current = nextPhase
            ? { phaseId: nextPhase.id, index: targetIndex, stepId: detailItems(nextPhase)[targetIndex].id }
            : { phaseId, index, stepId: item.id };
        } else {
          state.progress.current = { phaseId, index, stepId: item.id };
        }
        saveProgress();
        render();
      }
      return;
    }
    const currentTarget = event.target.closest('[data-current-position]');
    if (currentTarget) {
      const phaseId = currentTarget.dataset.currentPhase, index = Number(currentTarget.dataset.currentIndex);
      state.progress.current = { phaseId, index, stepId: data.detailGuides[phaseId][index].id };
      saveProgress();
      render();
      return;
    }
    if (event.target.closest('#resetProgressBtn')) {
      state.progress = editor.hydrateProgress(null);
      saveProgress();
      render();
      return;
    }
    const phaseButton = event.target.closest('[data-phase-id]');
    if (phaseButton) { selectPhase(phaseButton.dataset.phaseId, phaseButton.dataset.jumpGuideIndex); return; }
    const overviewButton = event.target.closest('#overviewBtn');
    if (overviewButton) { state.view = 'overview'; state.query = ''; $('#searchInput').value = ''; render(); return; }
    const regionButton = event.target.closest('[data-region-id]');
    if (regionButton) { const first = getFirstPhase(regionButton.dataset.regionId); if (first) selectPhase(first.id); return; }
    const guideTarget = event.target.closest('[data-guide-index]');
    if (guideTarget && state.view === 'phase') { scrollToGuide(guideTarget.dataset.guideIndex); return; }
    const stepTarget = event.target.closest('[data-step-index]');
    if (stepTarget && state.view === 'phase') {
      state.activeStep = Number(stepTarget.dataset.stepIndex);
      $$('.map-marker').forEach((marker, index) => {
        marker.classList.toggle('is-active', index === state.activeStep);
        marker.setAttribute('aria-pressed', String(index === state.activeStep));
      });
      $$('.step-item').forEach((item, index) => {
        item.classList.toggle('is-active', index === state.activeStep);
        $('.step-index', item).setAttribute('aria-pressed', String(index === state.activeStep));
      });
      if (stepTarget.dataset.locateMap) $('.map-panel').scrollIntoView({ block: 'start' });
      else if (stepTarget.classList.contains('map-marker')) $$('.step-item')[state.activeStep]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    const zoomTarget = event.target.closest('[data-zoom]');
    if (zoomTarget && state.view === 'phase') {
      if (zoomTarget.dataset.zoom === 'in') state.zoom = Math.min(1.8, +(state.zoom + .1).toFixed(1));
      if (zoomTarget.dataset.zoom === 'out') state.zoom = Math.max(.8, +(state.zoom - .1).toFixed(1));
      if (zoomTarget.dataset.zoom === 'reset') state.zoom = 1;
      $('.map-canvas').style.transform = `scale(${state.zoom})`;
      $('.zoom-value').textContent = `${Math.round(state.zoom * 100)}%`;
      return;
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

  editor.connect({
    currentPhase: () => state.view === 'phase' ? state.phaseId : currentDetail().phase.id,
    openCurrent: () => {
      const current = currentDetail();
      selectPhase(state.view === 'phase' ? state.phaseId : current.phase.id, state.view === 'phase' ? 0 : current.index);
    },
    refresh: ({phaseId, stepId} = {}) => {
      const scroll = window.scrollY;
      if (phaseId) { state.view = 'phase'; state.phaseId = phaseId; state.query = ''; $('#searchInput').value = ''; }
      state.activeStep = Math.min(state.activeStep, Math.max(0, phaseById[state.phaseId].route.length - 1));
      render();
      if (stepId) scrollToGuide(data.detailGuides[state.phaseId].findIndex(item => item.id === stepId));
      else window.scrollTo({top:scroll});
    }
  });
  $('#editGuideBtn').disabled = false;
  saveProgress();
  render();
})();

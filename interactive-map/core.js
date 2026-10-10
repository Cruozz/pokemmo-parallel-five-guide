(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const kinds = ['battle','story','item','exit','goal'];
  function asset(src) {
    return typeof src === 'string' && (/^(?:\.\.\/assets\/|assets\/)[a-zA-Z0-9_./% -]+\.(?:png|jpg|jpeg|webp)$/i.test(src) && !src.replace(/^\.\.\//,'').includes('..') || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(src));
  }
  function validate(input) {
    const fail = message => { throw new Error(message); };
    const text = (value,max=1200) => typeof value === 'string' && value.length <= max;
    const position = p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100;
    if (!input || input.version !== 1 || !Array.isArray(input.maps) || !input.maps.length || input.maps.length > 1000 || !Array.isArray(input.media)) fail('这不是有效的地图模板备份。');
    const mapIds = new Set(), mediaIds = new Set(), stepIds = new Set();
    for (const media of input.media) {
      if (!text(media.id,120) || mediaIds.has(media.id) || !asset(media.src) || !text(media.title,120) || !text(media.caption)) fail('备份中的配图信息不完整或格式不支持。');
      mediaIds.add(media.id);
    }
    for (const map of input.maps) {
      if (!text(map.id,120) || mapIds.has(map.id) || !asset(map.src) || !text(map.title,120) || !text(map.category,50) || !Number.isFinite(map.width) || !Number.isFinite(map.height) || map.width < 1 || map.height < 1 || map.width > 30000 || map.height > 30000 || !Array.isArray(map.markers) || !Array.isArray(map.steps) || !Array.isArray(map.paths)) fail('备份中的地图信息不完整。');
      mapIds.add(map.id);
      const markerIds = new Set();
      for (const marker of map.markers) {
        if (!text(marker.id,120) || markerIds.has(marker.id) || !text(marker.label,80) || !marker.label.trim() || !position(marker) || !kinds.includes(marker.kind)) fail(`「${map.title}」有无效标记。`);
        markerIds.add(marker.id);
      }
      for (const step of map.steps) {
        if (!text(step.id,120) || stepIds.has(step.id) || !markerIds.has(step.markerId) || !text(step.title,120) || !step.title.trim() || !text(step.action) || step.mediaId && !mediaIds.has(step.mediaId)) fail(`「${map.title}」的步骤关联无效。`);
        stepIds.add(step.id);
      }
      for (const route of map.paths) if (!Array.isArray(route) || route.length < 2 || route.some(p => !position(p))) fail(`「${map.title}」的路线坐标无效。`);
    }
    for (const map of input.maps) {
      for (const marker of map.markers) if (marker.targetMap && !mapIds.has(marker.targetMap)) fail('城市入口指向了不存在的地图。');
      for (const step of map.steps) if (step.interiorMap && !mapIds.has(step.interiorMap)) fail('内部地图关联无效。');
    }
    const result = clone(input);
    // Ignore unexpected fields such as a stale selection or foreign progress.
    result.completed = Array.isArray(result.completed) ? result.completed.filter(step => stepIds.has(step)) : [];
    return result;
  }
  function addMarker(map,x,y) {
    const marker={id:id('point'),label:'新地点',kind:'story',x,y};
    const step={id:id('step'),markerId:marker.id,title:'填写这一步要做什么',action:'',mediaId:'',interiorMap:''};
    map.markers.push(marker); map.steps.push(step); return step;
  }
  function reorder(map,stepId,direction) {
    const from=map.steps.findIndex(step=>step.id===stepId), to=from+direction;
    if(from<0 || to<0 || to>=map.steps.length)return false;
    [map.steps[from],map.steps[to]]=[map.steps[to],map.steps[from]]; return true;
  }
  function removeStep(map,stepId) {
    const step=map.steps.find(s=>s.id===stepId); if(!step)return;
    map.steps=map.steps.filter(s=>s.id!==stepId);
    if(!map.steps.some(s=>s.markerId===step.markerId))map.markers=map.markers.filter(p=>p.id!==step.markerId);
  }
  function revisit(map,stepId) {
    const source=map.steps.find(s=>s.id===stepId); if(!source)return;
    const step={...clone(source),id:id('step'),title:`返回${map.markers.find(p=>p.id===source.markerId).label}`,action:'填写返回这里要做什么'};
    map.steps.push(step); return step;
  }
  const api={clone,id,asset,validate,addMarker,reorder,removeStep,revisit};
  if(typeof module==='object' && module.exports)module.exports=api;
  else root.MapGuideCore=api;
})(typeof window==='object'?window:this);

(async function () {
  'use strict';
  const C=window.MapGuideCore,$=s=>document.querySelector(s);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let project=C.clone(window.MAP_TEMPLATE_DATA), mode='read',mapId=project.initialMap,stepId='',tool='browse',history=[],undo=[],draftLine=[],saveTimer,toastTimer,adapter,saveQueue=Promise.resolve(),revision=0;
  let scale=1,fitScale=1,tx=0,ty=0,drag=null,uploadContext,backupUrl;
  const current=()=>project.maps.find(m=>m.id===mapId);
  const selected=()=>current().steps.find(s=>s.id===stepId);
  const point=()=>current().markers.find(p=>p.id===selected()?.markerId);
  const mediaFor=step=>project.media.find(m=>m.id===step?.mediaId);
  const labelFor=step=>current().markers.find(p=>p.id===step.markerId)?.label || '';
  const kinds={battle:'必打战斗',story:'剧情',item:'领取道具',exit:'前往区域',goal:'道馆挑战'};
  const snapshot=()=>({...C.clone(project),lastView:{mapId,stepId}});
  function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
  async function storage(){
    try{
      const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('pokemmo-interactive-template-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('draft');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('存储被占用'));});
      return {read:()=>new Promise((resolve,reject)=>{const r=db.transaction('draft').objectStore('draft').get('project');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}),write:value=>new Promise((resolve,reject)=>{const t=db.transaction('draft','readwrite');t.objectStore('draft').put(value,'project');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);})};
    }catch(_){return {read:async()=>JSON.parse(localStorage.getItem('pokemmo-interactive-template-v1')||'null'),write:async value=>localStorage.setItem('pokemmo-interactive-template-v1',JSON.stringify(value))};}
  }
  function checkpoint(){undo.push(C.clone(project));if(undo.length>15)undo.shift();$('#undoBtn').disabled=false;}
  function saveSoon(){revision++;$('#saveStatus').textContent='有改动 · 正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow(),350);}
  async function saveNow(){
    clearTimeout(saveTimer);const value=snapshot(),version=revision;
    saveQueue=saveQueue.catch(()=>{}).then(()=>adapter.write(value));
    try{await saveQueue;if(version===revision)$('#saveStatus').textContent='已保存在本机 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});return true;}
    catch(_){$('#saveStatus').textContent='本机保存失败 · 请导出备份';toast('当前编辑还在页面中。请先导出备份，再检查浏览器存储。');return false;}
  }
  function renderLibrary(){
    const query=$('#mapSearch').value.trim(),category=$('#categoryFilter').value;
    const maps=project.maps.filter(m=>m.category!=='总览' && (!query || m.title.includes(query)) && (category==='all'||m.category===category));
    $('#mapCount').textContent=project.maps.filter(m=>m.category!=='总览').length+' 张';$('#overviewBtn').hidden=!project.maps.some(m=>m.id==='unova-overview');
    $('#mapList').innerHTML=maps.length?maps.map(m=>`<button type="button" class="map-entry ${m.id===mapId?'is-active':''}" data-map="${esc(m.id)}" ${m.id===mapId?'aria-current="location"':''}><img src="${esc(m.src)}" alt="" loading="lazy"><span><strong>${esc(m.title)}</strong><small>${esc(m.category)} · ${m.steps.length?m.steps.length+' 步':'可添加标记'}</small></span></button>`).join(''):'<p class="editor-help">没有找到这张地图。</p>';
  }
  function transform(){
    $('#mapSurface').style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
    document.querySelectorAll('.map-marker').forEach(el=>el.style.transform=`translate(-50%,-50%) scale(${1/scale})`);
    $('#zoomValue').textContent=Math.round(scale/fitScale*100)+'%';
  }
  function fit(){const view=$('#mapViewport'),map=current();fitScale=Math.min((view.clientWidth-54)/map.width,(view.clientHeight-64)/map.height);scale=fitScale;tx=(view.clientWidth-map.width*scale)/2;ty=(view.clientHeight-map.height*scale)/2;transform();}
  function zoom(factor){const view=$('#mapViewport'),x=view.clientWidth/2,y=view.clientHeight/2,next=Math.max(fitScale*.5,Math.min(fitScale*7,scale*factor));tx=x-(x-tx)*next/scale;ty=y-(y-ty)*next/scale;scale=next;transform();}
  function renderPaths(){
    const map=current(),paths=[...map.paths];if(draftLine.length)paths.push(draftLine);
    $('#pathOverlay').innerHTML=paths.map((line,i)=>`<polyline points="${line.map(p=>p.x*map.width/100+','+p.y*map.height/100).join(' ')}" fill="none" stroke="white" stroke-width="${5/scale}" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${line.map(p=>p.x*map.width/100+','+p.y*map.height/100).join(' ')}" fill="none" stroke="${i>=map.paths.length?'#ae4c22':'#e98730'}" stroke-width="${3/scale}" stroke-linejoin="round" stroke-linecap="round" ${i>=map.paths.length?'stroke-dasharray="'+6/scale+' '+4/scale+'"':''}/>`).join('');
  }
  function renderMarkers(){
    const map=current();
    $('#markerLayer').innerHTML=map.markers.map((p,i)=>{
      const visits=map.steps.map((s,index)=>({s,index})).filter(v=>v.s.markerId===p.id), numbers=visits.map(v=>v.index+1), active=selected()?.markerId===p.id,done=visits.length&&visits.every(v=>project.completed.includes(v.s.id));
      const short=active?selected().title:visits[0]?.s.title||'点击进入全图';
      return `<button type="button" class="map-marker ${active?'is-selected':''} ${done?'is-done':''} side-${esc(p.labelSide||'bottom')} ${p.x>88?'near-right':''}" data-marker="${esc(p.id)}" style="left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%) scale(${1/scale})" aria-label="${esc(p.label+'：'+short)}" aria-pressed="${!!active}"><span class="marker-dot">${done?'✓':numbers.join('·')||i+1}</span><span class="marker-tag"><strong>${esc(p.label)}</strong><small>${esc(short)}</small></span></button>`;
    }).join('');
  }
  function renderRoute(){
    const map=current(),done=map.steps.filter(s=>project.completed.includes(s.id)).length;
    $('#routeTitle').textContent=map.category==='总览'?'选择城市，进入当地全图':'在这里按顺序办事';
    $('#routeProgress').textContent=map.steps.length?`${done} / ${map.steps.length} 已完成`:'';
    $('#emptyRoute').hidden=!!map.steps.length || map.category==='总览';
    $('#routeList').innerHTML=map.steps.map((s,i)=>`<li><button type="button" class="${s.id===stepId?'is-active':''} ${project.completed.includes(s.id)?'is-done':''}" data-step="${esc(s.id)}" aria-pressed="${s.id===stepId}"><b class="step-number">${project.completed.includes(s.id)?'✓':i+1}</b><span><strong>${esc(labelFor(s))}</strong><small>${esc(s.title)}</small></span></button></li>`).join('');
  }
  function renderDetail(){
    const map=current(),s=selected(),p=point(),pane=$('#detailPanel');
    if(!s){pane.innerHTML=`<div class="detail-empty"><p class="detail-eyebrow">${mode==='edit'?'编辑这张地图':'地图导航'}</p><h2>${esc(map.title)}</h2><p>${map.category==='总览'?'点击城市标记，就能进入当地全图，再选择学校、道馆或剧情地点。':mode==='edit'?'点击“添加标记”，再点地图上的正确位置。也可以上传一张新地图，从第一个地点开始。':'这张图还没有攻略节点。切到“编辑地图”，可以在图上标位置、写动作、配图片。'}</p></div>`;return;}
    const index=map.steps.indexOf(s),m=mediaFor(s),next=map.steps[index+1];
    if(mode==='edit'){
      pane.innerHTML=`<p class="detail-eyebrow">编辑第 ${index+1} 步</p><div class="detail-heading"><h2>把动作标在地图上</h2></div><form id="nodeForm" class="editor-form"><label>地图上的名称<input name="label" maxlength="80" required value="${esc(p.label)}"></label><label>这一步要做什么<input name="title" maxlength="120" required value="${esc(s.title)}"></label><label>具体动作<textarea name="action" maxlength="1200">${esc(s.action)}</textarea></label><label>节点类型<select name="kind">${Object.entries(kinds).map(([v,t])=>`<option value="${v}" ${v===p.kind?'selected':''}>${t}</option>`).join('')}</select></label><label>点击后展示的图片<select name="mediaId"><option value="">暂不配图</option>${project.media.map(m=>`<option value="${esc(m.id)}" ${m.id===s.mediaId?'selected':''}>${esc(m.title)}</option>`).join('')}</select></label><button type="button" class="upload-btn" data-action="upload-media">＋ 上传自己的截图</button><label>关联的内部地图<select name="interiorMap"><option value="">没有内部地图</option>${project.maps.filter(m=>m.id!==mapId&&m.category!=='总览').map(m=>`<option value="${esc(m.id)}" ${m.id===s.interiorMap?'selected':''}>${esc(m.title)}</option>`).join('')}</select></label><div class="two-fields"><label>横向位置 %<input name="x" type="number" min="0" max="100" step="0.1" required value="${p.x}"></label><label>纵向位置 %<input name="y" type="number" min="0" max="100" step="0.1" required value="${p.y}"></label></div><p class="editor-help">可以输入位置，也可以用“重新定位”在图上点选。再次到访同一地点，用“新增返回步骤”。</p><button type="submit" class="primary">保存节点</button></form><div class="editor-actions"><button type="button" data-action="reposition">重新定位</button><button type="button" data-action="preview">预览这个节点</button><button type="button" data-action="up" ${index===0?'disabled':''}>上移一步</button><button type="button" data-action="down" ${index===map.steps.length-1?'disabled':''}>下移一步</button><button type="button" class="span-two" data-action="revisit">＋ 新增返回步骤</button><button type="button" class="span-two danger" data-action="delete-step">删除这一步</button></div>`;
    }else{
      pane.innerHTML=`<p class="detail-eyebrow">第 ${index+1} 步 / 共 ${map.steps.length} 步</p><div class="detail-heading"><h2>${esc(p.label)}</h2><span class="kind-badge">${esc(kinds[p.kind])}</span></div><p class="detail-subtitle">${esc(s.title)}</p>${m?`<button type="button" class="media-preview ${m.id==='school-interior'?'school-media':''}" data-action="large-image" aria-label="放大图片：${esc(m.title)}"><img src="${esc(m.src)}" alt="${esc(m.title)}">${m.id==='school-interior'?'<span class="school-callout">进入学校 · 与黑连对话并对战</span>':''}</button><p class="media-caption">${esc(m.caption)}</p>`:'<p class="editor-help">可以在编辑模式为这个节点添加实景截图。</p>'}<section class="action-block"><h3>到这里做什么</h3><p>${esc(s.action||'尚未填写动作，切到编辑模式补充。')}</p></section>${next?`<p class="next-hint">下一步：${esc(labelFor(next))} · ${esc(next.title)}</p>`:'<p class="next-hint">本图步骤结束，可从地图库进入下一张地图。</p>'}<button type="button" class="primary wide" data-action="complete">${project.completed.includes(s.id)?next?'前往下一步':'本步已完成':next?'完成，前往下一步':'标记本步完成'}</button>${s.interiorMap?`<button type="button" class="inside-btn" data-action="interior">打开${esc(project.maps.find(m=>m.id===s.interiorMap).title)}地图 ↗</button>`:''}${project.completed.includes(s.id)?'<button type="button" class="inside-btn" data-action="uncomplete">取消本步完成</button>':''}`;
    }
  }
  function renderMap(){
    const map=current();$('#mapTitle').textContent=map.title;$('#mapNameInput').value=map.title;$('#breadcrumb').textContent='合众 / '+map.category;
    $('#mapImage').src=map.src;$('#mapImage').alt=map.title+'全图';$('#mapSurface').style.width=map.width+'px';$('#mapSurface').style.height=map.height+'px';$('#pathOverlay').setAttribute('viewBox',`0 0 ${map.width} ${map.height}`);
    $('#mapMeta').textContent=map.category==='总览'?'点击城市入口 · 总览坐标沿用攻略地图':'点击地点名称查看动作 · 路线由编辑者按实际道路绘制';
    $('#mapSource').hidden=!/^https:\/\//.test(map.source||'');if(!$('#mapSource').hidden)$('#mapSource').href=map.source;
    $('#backMapBtn').hidden=!history.length;fit();renderMarkers();renderPaths();renderRoute();renderDetail();renderLibrary();
  }
  function commitForm(notice=false){
    commitMapName();
    const form=$('#nodeForm'),s=selected(),p=point();if(!form||!s)return true;
    if(!form.reportValidity())return false;
    const fields=new FormData(form),next={label:fields.get('label').trim(),title:fields.get('title').trim(),action:fields.get('action').trim(),kind:fields.get('kind'),mediaId:fields.get('mediaId'),interiorMap:fields.get('interiorMap'),x:Number(fields.get('x')),y:Number(fields.get('y'))};
    if(!next.label||!next.title){toast('名称和动作标题不能只填空格。');return false;}
    if(next.label!==p.label||next.title!==s.title||next.action!==s.action||next.kind!==p.kind||next.mediaId!==s.mediaId||next.interiorMap!==s.interiorMap||next.x!==p.x||next.y!==p.y){checkpoint();Object.assign(p,{label:next.label,kind:next.kind,x:next.x,y:next.y});Object.assign(s,{title:next.title,action:next.action,mediaId:next.mediaId,interiorMap:next.interiorMap});renderMarkers();renderRoute();saveSoon();}
    if(notice)toast('节点已保存，可以点击“预览这个节点”。');return true;
  }
  function setTool(value){
    tool=value;$('#mapViewport').classList.toggle('is-placing',value!=='browse');
    document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===value)));
    $('#finishLineBtn').hidden=value!=='line';$('#removeVertexBtn').hidden=value!=='line';
    $('#toolHint').textContent=value==='add'?'点击地图上的正确入口，添加一个新节点。':value==='line'?'依次点击道路拐点，最后点“完成绘制”。':value==='place'?'在地图上点选这个地点的新位置。':'点击地点查看动作；拖动空白处移动地图，使用加减按钮缩放。';
  }
  function finishLine(){if(draftLine.length<2){toast('路线至少需要两个点；可以点“拖动地图”取消。');return false;}checkpoint();current().paths.push(C.clone(draftLine));draftLine=[];setTool('browse');renderPaths();saveSoon();return true;}
  function leaveTool(){if(draftLine.length){if(draftLine.length>=2)finishLine();else{draftLine=[];renderPaths();}}setTool('browse');}
  function goMap(id,keepHistory=false){if(!project.maps.some(m=>m.id===id)||!commitForm())return;leaveTool();if(keepHistory)history.push({mapId,stepId});else history=[];mapId=id;stepId=current().steps[0]?.id||'';renderMap();}
  function chooseStep(id){if(!commitForm())return;leaveTool();stepId=id;renderMarkers();renderRoute();renderDetail();if(window.innerWidth<=700&&mode==='read')$('#detailPanel').scrollIntoView({block:'start',behavior:'auto'});}
  function changeMode(next){if(!commitForm())return;leaveTool();mode=next;document.body.classList.toggle('is-editing',mode==='edit');document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));renderDetail();}
  function coords(event){const r=$('#mapSurface').getBoundingClientRect(),x=(event.clientX-r.left)/r.width*100,y=(event.clientY-r.top)/r.height*100;return x>=0&&x<=100&&y>=0&&y<=100?{x:Math.round(x*10)/10,y:Math.round(y*10)/10}:null;}
  const viewport=$('#mapViewport');
  viewport.addEventListener('pointerdown',e=>{if(tool!=='browse'||e.target.closest('.map-marker')||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,tx,ty};viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');});
  viewport.addEventListener('pointermove',e=>{if(drag){tx=drag.tx+e.clientX-drag.x;ty=drag.ty+e.clientY-drag.y;transform();}});
  const stopDrag=()=>{drag=null;viewport.classList.remove('is-dragging');};viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);
  viewport.addEventListener('click',e=>{
    if(tool==='browse')return;e.stopPropagation();const p=coords(e);if(!p){toast('请点在地图图片内。');return;}if(mode!=='edit')return;
    if(tool==='add'){if(!commitForm())return;checkpoint();const s=C.addMarker(current(),p.x,p.y);stepId=s.id;setTool('browse');renderMarkers();renderRoute();renderDetail();renderLibrary();saveSoon();}
    else if(tool==='place'){checkpoint();Object.assign(point(),p);setTool('browse');renderMarkers();renderDetail();saveSoon();}
    else if(tool==='line'){draftLine.push(p);renderPaths();}
  });
  viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')tx+=40;if(e.key==='ArrowRight')tx-=40;if(e.key==='ArrowUp')ty+=40;if(e.key==='ArrowDown')ty-=40;transform();}if(e.key==='+'||e.key==='=')zoom(1.25);if(e.key==='-')zoom(.8);});
  document.addEventListener('submit',e=>{if(e.target.id==='nodeForm'){e.preventDefault();commitForm(true);}});
  document.addEventListener('click',async e=>{
    const modeBtn=e.target.closest('[data-mode]');if(modeBtn){changeMode(modeBtn.dataset.mode);return;}
    const mapBtn=e.target.closest('[data-map]');if(mapBtn){goMap(mapBtn.dataset.map);return;}
    const stepBtn=e.target.closest('[data-step]');if(stepBtn){chooseStep(stepBtn.dataset.step);return;}
    const markerBtn=e.target.closest('[data-marker]');if(markerBtn&&tool==='browse'){
      const marker=current().markers.find(p=>p.id===markerBtn.dataset.marker);if(marker.targetMap){goMap(marker.targetMap,true);return;}
      const visits=current().steps.filter(s=>s.markerId===marker.id);const target=visits.find(s=>s.id===stepId)||visits.find(s=>!project.completed.includes(s.id))||visits[0];if(target)chooseStep(target.id);return;
    }
    const toolBtn=e.target.closest('[data-tool]');if(toolBtn){if(!commitForm())return;if(current().category==='总览'&&toolBtn.dataset.tool!=='browse'){toast('先打开城市全图，再标记学校、道馆或其他地点。');return;}leaveTool();setTool(toolBtn.dataset.tool);return;}
    const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
    if(action==='large-image'){const m=mediaFor(selected());$('#imageDialogTitle').textContent=m.title;$('#largeImage').src=m.src;$('#largeImage').alt=m.title;$('#largeCaption').textContent=m.caption;$('#imageDialog').showModal();$('#closeImage').focus();return;}
    if(action==='complete'){checkpoint();const s=selected(),map=current(),i=map.steps.indexOf(s);if(!project.completed.includes(s.id))project.completed.push(s.id);if(map.steps[i+1])stepId=map.steps[i+1].id;renderMarkers();renderRoute();renderDetail();saveSoon();return;}
    if(action==='uncomplete'){checkpoint();project.completed=project.completed.filter(id=>id!==stepId);renderMarkers();renderRoute();renderDetail();saveSoon();return;}
    if(action==='interior'){goMap(selected().interiorMap,true);return;}
    if(!commitForm())return;
    if(action==='reposition'){setTool('place');toast('现在点击地图上的新位置。');}
    if(action==='preview')changeMode('read');
    if(action==='up'||action==='down'){checkpoint();C.reorder(current(),stepId,action==='up'?-1:1);renderMarkers();renderRoute();renderDetail();saveSoon();}
    if(action==='revisit'){checkpoint();stepId=C.revisit(current(),stepId).id;renderMarkers();renderRoute();renderDetail();saveSoon();}
    if(action==='delete-step'){checkpoint();C.removeStep(current(),stepId);project.completed=project.completed.filter(id=>id!==stepId);stepId=current().steps[0]?.id||'';renderMarkers();renderRoute();renderDetail();renderLibrary();saveSoon();toast('已删除这一步，可以用“撤销”恢复。');}
    if(action==='upload-media'){uploadContext={mapId,stepId};$('#mediaFile').click();}
  });
  $('#zoomIn').addEventListener('click',()=>{zoom(1.25);renderPaths();});$('#zoomOut').addEventListener('click',()=>{zoom(.8);renderPaths();});$('#fitBtn').addEventListener('click',()=>{fit();renderPaths();});
  $('#finishLineBtn').addEventListener('click',finishLine);$('#removeVertexBtn').addEventListener('click',()=>{draftLine.pop();renderPaths();});
  $('#undoBtn').addEventListener('click',()=>{if(!undo.length)return;project=undo.pop();if(!project.maps.some(m=>m.id===mapId))mapId=project.initialMap;if(!current().steps.some(s=>s.id===stepId))stepId=current().steps[0]?.id||'';draftLine=[];setTool('browse');$('#undoBtn').disabled=!undo.length;renderMap();saveSoon();toast('已撤销上一次修改。');});
  $('#overviewBtn').addEventListener('click',()=>goMap('unova-overview',true));
  $('#backMapBtn').addEventListener('click',()=>{if(!commitForm()||!history.length)return;leaveTool();const previous=history.pop();mapId=previous.mapId;stepId=previous.stepId;renderMap();});
  $('#mapSearch').addEventListener('input',renderLibrary);$('#categoryFilter').addEventListener('change',renderLibrary);
  function commitMapName(){const field=$('#mapNameInput'),title=field.value.trim();if(!title){field.value=current().title;return;}if(title!==current().title){checkpoint();current().title=title;$('#mapTitle').textContent=title;$('#mapImage').alt=title+'全图';renderLibrary();saveSoon();}}
  $('#mapNameInput').addEventListener('change',commitMapName);
  $('#saveBtn').addEventListener('click',async()=>{if(!commitForm())return;leaveTool();if(await saveNow())toast('草稿已保存在本机。导出备份后，可以换浏览器或电脑继续编辑。');});
  $('#exportBtn').addEventListener('click',()=>{if(!commitForm())return;leaveTool();if(backupUrl)URL.revokeObjectURL(backupUrl);const text=JSON.stringify(snapshot(),null,2);backupUrl=URL.createObjectURL(new Blob([text],{type:'application/json'}));$('#backupDownload').href=backupUrl;$('#backupDownload').download='合众路线地图-'+new Date().toLocaleDateString('sv-SE')+'.json';$('#backupText').value=text;$('#backupDialog').showModal();$('#backupDownload').focus();});
  $('#closeBackup').addEventListener('click',()=>$('#backupDialog').close());$('#backupDialog').addEventListener('close',()=>$('#exportBtn').focus());
  $('#importBtn').addEventListener('click',()=>{if(commitForm())$('#importFile').click();});
  $('#importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>75*1024*1024)throw new Error('备份超过 75 MB，请拆分后导入。');const next=C.validate(JSON.parse(await file.text()));checkpoint();project=next;mapId=project.maps.some(m=>m.id===project.lastView?.mapId)?project.lastView.mapId:project.maps.some(m=>m.id===project.initialMap)?project.initialMap:project.maps[0].id;stepId=current().steps.some(s=>s.id===project.lastView?.stepId)?project.lastView.stepId:current().steps[0]?.id||'';history=[];draftLine=[];setTool('browse');renderMap();saveSoon();toast('备份已导入，可以用“撤销”恢复导入前的草稿。');}catch(error){toast(error.message||'备份无法读取，请检查文件。');}e.target.value='';});
  $('#addMapBtn').addEventListener('click',()=>{if(commitForm())$('#mapFile').click();});
  async function readImage(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('请使用 PNG、JPG 或 WebP 图片。');if(file.size>5*1024*1024)throw new Error('单张图片请控制在 5 MB 内。');const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('图片读取失败'));r.readAsDataURL(file);});const dimensions=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(new Error('无法识别这张图片'));image.src=src;});if(dimensions.width>30000||dimensions.height>30000)throw new Error('图片尺寸太大，请缩小后重试。');return {src,...dimensions};}
  $('#mapFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const image=await readImage(file);checkpoint();const map={id:C.id('map'),title:file.name.replace(/\.[^.]+$/,'').slice(0,120),category:'我的地图',...image,markers:[],steps:[],paths:[]};project.maps.push(map);$('#categoryFilter').value='all';$('#mapSearch').value='';mapId=map.id;stepId='';history=[];draftLine=[];setTool('add');renderMap();saveSoon();toast('地图已加入。点击地图上的位置，添加第一个节点。');}catch(error){toast(error.message);}e.target.value='';});
  $('#mediaFile').addEventListener('change',async e=>{const file=e.target.files[0],target=uploadContext;if(!file||!target)return;try{const image=await readImage(file),map=project.maps.find(m=>m.id===target.mapId),s=map?.steps.find(s=>s.id===target.stepId);if(!s)throw new Error('原节点已删除，请重新选择节点上传。');checkpoint();const media={id:C.id('media'),src:image.src,title:file.name.slice(0,120),caption:'自己上传的节点截图'};project.media.push(media);s.mediaId=media.id;if(mapId===target.mapId&&stepId===target.stepId)renderDetail();saveSoon();toast('截图已配到这个节点。');}catch(error){toast(error.message);}e.target.value='';});
  $('#closeImage').addEventListener('click',()=>$('#imageDialog').close());$('#imageDialog').addEventListener('close',()=>$('[data-action="large-image"]')?.focus());
  window.addEventListener('resize',()=>{if(!drag){fit();renderPaths();}});
  try{adapter=await storage();const draft=await adapter.read();if(draft){project=C.validate(draft);mapId=project.maps.some(m=>m.id===project.lastView?.mapId)?project.lastView.mapId:project.maps.some(m=>m.id===project.initialMap)?project.initialMap:project.maps[0].id;$('#saveStatus').textContent='已恢复本机草稿';}else $('#saveStatus').textContent='示例已就绪 · 修改后自动保存';}
  catch(_){adapter={write:async()=>{throw new Error('不可用');}};$('#saveStatus').textContent='本机保存不可用 · 可导出备份';}
  stepId=current().steps.some(s=>s.id===project.lastView?.stepId)?project.lastView.stepId:current().steps[0]?.id||'';renderMap();
})();

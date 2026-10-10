(function(){
  'use strict';
  const C=window.GuideEditCore,data=window.guideData,base=C.clone(data),$=s=>document.querySelector(s);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let project=C.create(base),active=false,api,adapter,history=[],timer,revision=0,queue=Promise.resolve(),editing,uploadContext,returnFocus,toastTimer,backupUrl,hasContent=false;
  const phase=id=>project.phases.find(p=>p.id===id);
  function status(text){$('#guideEditStatus').textContent=text;}
  function toast(text){$('#guideEditToast').textContent=text;$('#guideEditToast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#guideEditToast').hidden=true,4500);}
  async function storage(){
    try{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('pokemmo-guide-content-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('draft');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('存储被占用'));});
      return {read:()=>new Promise((resolve,reject)=>{const r=db.transaction('draft').objectStore('draft').get('content');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}),write:value=>new Promise((resolve,reject)=>{const t=db.transaction('draft','readwrite');t.objectStore('draft').put(value,'content');t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);})};
    }catch(_){return {read:async()=>JSON.parse(localStorage.getItem('pokemmo-guide-content-v1')||'null'),write:async value=>localStorage.setItem('pokemmo-guide-content-v1',JSON.stringify(value))};}
  }
  const ready=(async()=>{try{adapter=await storage();const saved=await adapter.read();if(saved){project=C.validate(saved,base);hasContent=true;status('已恢复本机编辑内容');}else status('原攻略已就绪 · 修改后自动保存');}catch(error){if(!adapter)adapter={write:async()=>{throw error;}};status('原攻略已载入 · 编辑内容可导出备份');}C.apply(project,data,base);})();
  function checkpoint(){history.push(C.clone(project));if(history.length>12)history.shift();$('#guideUndoBtn').disabled=false;}
  async function saveNow(){clearTimeout(timer);const value=C.clone(project),version=revision;queue=queue.catch(()=>{}).then(()=>adapter.write(value));try{await queue;if(version===revision)status('已保存在本机 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}));return true;}catch(_){status('本机保存失败 · 请导出备份');toast('编辑内容仍在页面中，请先导出备份保存。');return false;}}
  function saveSoon(){revision++;hasContent=true;status('有修改 · 正在保存…');clearTimeout(timer);timer=setTimeout(saveNow,350);window.dispatchEvent(new Event('guide-content-change'));}
  function refresh(where={}){C.apply(project,data,base);api?.refresh(where);$('#guideUndoBtn').disabled=!history.length;}
  function change(work,where){checkpoint();work();refresh(where);saveSoon();}
  function toggle(){active=!active;document.body.classList.toggle('is-guide-editing',active);$('#editGuideBtn').setAttribute('aria-pressed',String(active));$('#editGuideBtn').textContent=active?'结束编辑':'编辑流程';if(active)api?.openCurrent();else api?.refresh();}
  const renderStepTools=(p,index)=>active?`<div class="step-edit-tools" aria-label="第 ${index+1} 步编辑操作"><button type="button" class="edit-step-main" data-guide-edit="step" data-edit-phase="${p.id}" data-edit-step="${esc(data.detailGuides[p.id][index].id)}">编辑文字与图片</button><button type="button" data-guide-edit="up" data-edit-phase="${p.id}" data-edit-step="${esc(data.detailGuides[p.id][index].id)}" ${index===0?'disabled':''}>上移</button><button type="button" data-guide-edit="down" data-edit-phase="${p.id}" data-edit-step="${esc(data.detailGuides[p.id][index].id)}" ${index===data.detailGuides[p.id].length-1?'disabled':''}>下移</button><button type="button" data-guide-edit="insert" data-edit-phase="${p.id}" data-edit-step="${esc(data.detailGuides[p.id][index].id)}">在下方加一步</button><button type="button" class="edit-delete" data-guide-edit="delete" data-edit-phase="${p.id}" data-edit-step="${esc(data.detailGuides[p.id][index].id)}">删除</button></div>`:'';
  const renderPhaseTools=p=>active?`<div class="phase-edit-tools"><button type="button" data-guide-edit="phase" data-edit-phase="${p.id}">编辑阶段说明</button><button type="button" data-guide-edit="append" data-edit-phase="${p.id}">＋ 新增步骤</button><button type="button" data-guide-edit="restore" data-edit-phase="${p.id}">还原本阶段</button></div>`:'';
  const renderNodeTools=(p,node)=>active?`<button type="button" class="node-summary-edit" data-guide-edit="node" data-edit-phase="${p.id}" data-edit-node="${esc(node.name)}" aria-label="编辑${esc(node.name)}摘要">编辑摘要</button>`:'';
  function imageFor(ref){return ref.custom||base.atlas[ref.id];}
  function descriptionFor(step,ref){return ref.description??base.stepMapNotes?.[editing.phaseId]?.[step.baseIndex]?.[ref.id]?.note??base.mapNotes?.[ref.id]?.note??base.atlas[ref.id]?.description??'';}
  function imagePreview(image,src,title){return `<span class="image-markup-preview"><img src="${esc(src)}" alt="${esc(title)}">${window.ImageMarkupCore.svg(image.annotation)}</span>`;}
  function landmarkFields(image){
    const points=C.mapLandmarks(base,editing.phaseId,editing.draft,image);
    if(!points.length)return '';
    const rows=points.map((point,index)=>`<article class="edit-landmark-row" data-landmark-row="${index}"><div class="edit-landmark-heading"><strong>节点 ${index+1}</strong><label class="edit-landmark-visible"><input type="checkbox" data-landmark-field="visible" ${point.hidden?'':'checked'} aria-label="显示第 ${index+1} 个节点">显示此节点</label><div class="edit-image-actions"><button type="button" data-landmark-action="up" data-landmark-index="${index}" ${index===0?'disabled':''} aria-label="上移第 ${index+1} 个节点">上移</button><button type="button" data-landmark-action="down" data-landmark-index="${index}" ${index===points.length-1?'disabled':''} aria-label="下移第 ${index+1} 个节点">下移</button></div></div><div class="edit-landmark-labels"><label>图上编号<input data-landmark-field="id" maxlength="16" required value="${esc(point.id)}" aria-label="第 ${index+1} 个节点编号"></label><label>名称 / 简短动作<input data-landmark-field="label" maxlength="180" required value="${esc(point.label)}" aria-label="第 ${index+1} 个节点名称"></label></div><label>详细动作（可选）<textarea data-landmark-field="detail" maxlength="5000" aria-label="第 ${index+1} 个节点详细动作">${esc(point.detail||'')}</textarea></label></article>`).join('');
    return `<details class="edit-landmarks" data-landmark-image="${image.visualId}"><summary>地图编号说明 · ${points.length} 个节点</summary><p class="edit-help">修改图下的名称和动作，图上编号一起更新。上移／下移调整说明顺序；编号可自行修改。取消“显示此节点”会隐藏它的编号和说明。只修改当前这一步。</p><div class="edit-image-actions"><button type="button" data-landmark-action="hide-all">全部隐藏</button><button type="button" data-landmark-action="restore">恢复原有编号说明</button></div>${rows}</details>`;
  }
  function renderOrder(){
    const items=C.orderedImages(editing.draft);
    $('#guideImageOrder').innerHTML=items.length?`<ol class="image-order-list" aria-label="本步全部图片展示顺序">${items.map(({type,image,id},i)=>{const title=type==='shot'?image.kind:image.title;return `<li class="image-order-item" data-order-id="${id}"><button type="button" data-image-drag aria-label="拖动第 ${i+1} 张图片：${esc(title)}"><span aria-hidden="true">↕</span><b>${i+1}</b></button><img draggable="false" src="${esc(type==='shot'?image.src:imageFor(image).src)}" alt=""><span class="image-order-title">${esc(title)}<small>${type==='shot'?'场景截图':'地图'}${image.annotation?.elements.length?' · 已添加标注':''}</small></span><div class="image-order-actions"><button type="button" data-order-action="up" data-image-id="${id}" aria-label="向前移动图片：${esc(title)}" ${i===0?'disabled':''}>前移</button><button type="button" data-order-action="down" data-image-id="${id}" aria-label="向后移动图片：${esc(title)}" ${i===items.length-1?'disabled':''}>后移</button><button type="button" data-order-action="annotate" data-image-id="${id}" aria-label="标注图片：${esc(title)}">画线 / 文字</button></div></li>`;}).join('')}</ol>`:'<p class="editor-empty">先在下方添加图片或地图。</p>';
  }
  async function annotate(image,type,trigger){
    syncImages();const context=editing;
    try{await window.ImageMarkupEditor.open({src:type==='shot'?image.src:imageFor(image).src,title:type==='shot'?image.kind:image.title,annotation:image.annotation,trigger,isCurrent:()=>editing===context&&$('#guideEditorDialog').open,onApply:annotation=>{if(editing!==context)return;image.annotation=annotation;renderImages();toast('标注已应用，点击“保存这一步”保存到攻略。');}});}catch(e){error(e.message);}
  }
  function renderImages(){
    const opened=new Set([...document.querySelectorAll('.edit-landmarks[open]')].map(panel=>panel.dataset.landmarkImage));
    const step=C.normalizeImages(editing.draft);renderOrder();
    for(const type of ['shot','map']){
      const images=step[type==='shot'?'shots':'maps'];
      $(type==='shot'?'#guideShotEditor':'#guideMapEditor').innerHTML=images.length?images.map((image,index)=>{
        const title=type==='shot'?image.kind:image.title,description=type==='shot'?image.caption:descriptionFor(step,image),attrs=`data-image-type="${type}" data-image-index="${index}"`;
        return `<article class="edit-image-card">${imagePreview(image,type==='shot'?image.src:imageFor(image).src,title)}<div class="edit-image-fields"><label>${type==='shot'?'图片':'地图'}标题<input ${attrs} data-image-field="${type==='shot'?'kind':'title'}" maxlength="180" required value="${esc(title)}"></label><label>${type==='shot'?'图片':'地图'}说明<textarea ${attrs} data-image-field="${type==='shot'?'caption':'description'}" maxlength="5000">${esc(description)}</textarea></label><div class="edit-image-actions"><button type="button" data-image-action="annotate" ${attrs}>画线路 / 箭头 / 文字</button><button type="button" data-image-action="replace" ${attrs}>更换${type==='shot'?'图片':'地图图片'}</button><button type="button" class="edit-delete" data-image-action="remove" ${attrs}>移除${type==='shot'?'图片':'地图'}</button></div>${type==='map'?landmarkFields(image):''}</div></article>`;
      }).join(''):`<p class="editor-empty">还没有${type==='shot'?'场景图片':'地图'}，可以在这里添加。</p>`;
    }
    document.querySelectorAll('.edit-landmarks').forEach(panel=>panel.open=opened.has(panel.dataset.landmarkImage));
  }
  function syncImages(){
    document.querySelectorAll('[data-image-field]').forEach(field=>{const image=editing?.draft?.[field.dataset.imageType==='shot'?'shots':'maps']?.[Number(field.dataset.imageIndex)];if(!image)return;const key=field.dataset.imageField;if(field.dataset.imageType==='shot'&&image[key]!==field.value)image.captionEdited=true;image[key]=field.value;});
    document.querySelectorAll('[data-landmark-image]').forEach(panel=>{
      const image=editing?.draft?.maps.find(ref=>ref.visualId===panel.dataset.landmarkImage);if(!image)return;
      const original=C.mapLandmarks(base,editing.phaseId,editing.draft,image),points=C.clone(original);
      panel.querySelectorAll('[data-landmark-row]').forEach(row=>{
        const point=points[Number(row.dataset.landmarkRow)];if(!point)return;
        const label=row.querySelector('[data-landmark-field="label"]').value.trim(),detail=row.querySelector('[data-landmark-field="detail"]').value.trim();
        point.id=row.querySelector('[data-landmark-field="id"]').value.trim();
        if(point.detail!==undefined||detail)point.detail=point.detail===point.label&&detail===point.detail?label:detail;
        point.label=label;if(row.querySelector('[data-landmark-field="visible"]').checked)delete point.hidden;else point.hidden=true;
      });
      if(JSON.stringify(points)!==JSON.stringify(original))image.landmarks=points;
    });
  }
  function field(label,name,value,large=false,max=5000,required=false){return `<label>${label}${large?`<textarea name="${name}" aria-label="${esc(label)}" maxlength="${max}" ${required?'required':''}>${esc(value)}</textarea>`:`<input name="${name}" aria-label="${esc(label)}" maxlength="${max}" ${required?'required':''} value="${esc(value)}">`}</label>`;}
  function openStep(phaseId,stepId,target,insertion=false){
    const p=phase(phaseId),source=p.steps.find(s=>s.id===stepId),draft=insertion?C.insert(C.clone(p),stepId):C.clone(source);if(!draft)return;
    editing={type:'step',phaseId,stepId:draft.id,draft,insert:insertion,afterId:stepId,previousStatus:$('#guideEditStatus').textContent};returnFocus=target;
    $('#guideEditorSave').textContent='保存这一步';
    $('#guideEditorDialog .editor-file-hint').textContent='图片支持 PNG / JPG / WebP，每张最多 5 MB';
    $('#guideEditorTitle').textContent=insertion?'新增攻略步骤':'编辑文字与图片';
    const titles=new Map();Object.values(base.stepVisuals).flat().forEach(v=>v.maps.forEach(ref=>{if(!titles.has(ref.id))titles.set(ref.id,ref.title);}));
    const locations=base.phases.find(p=>p.id===phaseId).route;
    $('#guideEditorBody').innerHTML=`<form id="guideContentForm"><div class="edit-form-section"><h3>步骤文字</h3>${field('步骤标题 / 地点','place',draft.place,false,180,true)}${field('具体要做什么','action',draft.action,true)}<div class="edit-two-fields">${field('NPC / 战斗提示','npc',draft.npc,true,2000)}${field('获得内容 / 完成条件','gain',draft.gain,true,2000)}</div></div><section class="edit-form-section"><div class="edit-section-heading"><h3>场景图片</h3><button type="button" data-upload-shots>＋ 上传图片</button></div><div id="guideShotEditor"></div></section><section class="edit-form-section"><div class="edit-section-heading"><h3>对应地图</h3><button type="button" data-upload-map>＋ 上传地图图片</button></div><div id="guideMapEditor"></div><div class="existing-map-picker"><label for="existingGuideMap">从已有地图中选择</label><div><select id="existingGuideMap">${Object.values(base.atlas).map(map=>`<option value="${esc(map.id)}">${esc(titles.get(map.id)||map.file)}</option>`).join('')}</select><button type="button" data-add-existing-map>添加地图</button></div></div><p class="edit-help">新上传的地图按原图展示，可包含你自己画好的路线标记。</p></section><details class="edit-form-section edit-locations"><summary>对应的总览地点（可选）</summary><p class="edit-help">选择后，原页面的总览定位会指向这一步。</p><div>${locations.map(p=>`<label><input type="checkbox" name="locations" value="${esc(p.name)}" ${draft.locations.includes(p.name)?'checked':''}>${esc(p.name)}</label>`).join('')}</div></details></form>`;
    const section=document.createElement('section');section.className='edit-form-section';section.innerHTML='<h3>图片展示顺序</h3><p class="edit-help">拖动图片左侧的 ↕ 排顺序，或使用“前移 / 后移”。场景截图和地图可以交叉排列。</p><div id="guideImageOrder"></div>';
    $('#guideContentForm').insertBefore(section,$('#guideContentForm').children[1]);
    renderImages();$('#guideEditorError').hidden=true;$('#guideEditorSave').disabled=false;$('#guideEditorDialog').showModal();$('#guideContentForm [name="place"]').focus();
  }
  function openPhase(phaseId,target){
    const p=phase(phaseId);editing={type:'phase',phaseId,previousStatus:$('#guideEditStatus').textContent};returnFocus=target;$('#guideEditorTitle').textContent='编辑阶段说明';$('#guideEditorSave').textContent='保存阶段说明';
    $('#guideEditorDialog .editor-file-hint').textContent='点击“保存阶段说明”后应用到攻略';
    $('#guideEditorBody').innerHTML=`<form id="guideContentForm"><div class="edit-form-section">${field('阶段名称','title',p.title,false,160,true)}${field('阶段主题','kicker',p.kicker,false,160)}${field('阶段简介','summary',p.summary,true)}${field('本阶段提醒','focus',p.focus,true)}<div class="edit-two-fields">${field('等级上限说明','cap',p.cap,false,100)}${field('NPC 编号说明','npc',p.npc,false,160)}</div></div><div class="edit-form-section"><h3>这一段怎么走</h3>${field('从哪里开始','start',p.plan.start,true)}${field('打到哪里停','finish',p.plan.finish,true)}${field('通路与前置条件（每行一条）','requirements',p.plan.requirements.join('\n'),true)}${field('转区后做什么','arrival',p.plan.arrival,true)}${field('路线提醒（每行一条）','reminders',p.plan.reminders.join('\n'),true)}</div></form>`;
    $('#guideEditorError').hidden=true;$('#guideEditorSave').disabled=false;$('#guideEditorDialog').showModal();$('#guideContentForm [name="title"]').focus();
  }
  function error(message){$('#guideEditorError').textContent=message;$('#guideEditorError').hidden=false;}
  function openNode(phaseId,name,target){
    const p=phase(phaseId);if(!base.phases.find(item=>item.id===phaseId).route.some(node=>node.name===name))return;
    editing={type:'node',phaseId,name,previousStatus:$('#guideEditStatus').textContent};returnFocus=target;
    $('#guideEditorTitle').textContent='编辑节点摘要 · '+name;$('#guideEditorSave').textContent='保存摘要';
    $('#guideEditorDialog .editor-file-hint').textContent='点击“保存摘要”后应用到攻略';
    $('#guideEditorBody').innerHTML=`<form id="guideContentForm"><div class="edit-form-section"><p class="edit-help">填写这个地点大概要做什么，可按顺序分行写。摘要会直接显示在“地图节点摘要”中，详细步骤和快速跳转继续保留。</p>${field('节点概括','nodeSummary',C.nodeSummary(p,name),true,2000)}<button type="button" data-reset-node-summary>恢复自动摘要</button><p class="edit-help">自动摘要从当前关联步骤提取；自己填写后，可独立编辑。留空并保存可以隐藏概括文字。</p></div></form>`;
    $('#guideEditorError').hidden=true;$('#guideEditorSave').disabled=false;$('#guideEditorDialog').showModal();$('#guideContentForm [name="nodeSummary"]').focus();
  }
  function saveForm(){
    const form=$('#guideContentForm');if(!form.reportValidity())return;const values=new FormData(form),context=editing,p=phase(context.phaseId);
    if(context.type==='step'){
      syncImages();const step=context.draft;for(const key of ['place','action','npc','gain'])step[key]=String(values.get(key)||'').trim();step.locations=values.getAll('locations');
      if(!step.place){error('请填写步骤标题或地点。');return;}if(step.shots.some(s=>!s.kind.trim())||step.maps.some(m=>!m.title.trim())){error('请填写每张图片的标题。');return;}
      const candidate=C.clone(project),destination=candidate.phases.find(item=>item.id===p.id);
      if(context.insert){const after=destination.steps.findIndex(s=>s.id===context.afterId);destination.steps.splice(context.afterId?after+1:destination.steps.length,0,C.clone(step));}else destination.steps[destination.steps.findIndex(s=>s.id===step.id)]=C.clone(step);
      try{C.validate(candidate,base);}catch(e){error(e.message);return;}
      context.applied=true;change(()=>project=candidate,{phaseId:p.id,stepId:step.id});
    }else if(context.type==='node'){
      const candidate=C.clone(project),draft=candidate.phases.find(item=>item.id===p.id);
      draft.nodeSummaries=(draft.nodeSummaries||[]).filter(node=>node.name!==context.name);
      if(!context.useAutomatic)draft.nodeSummaries.push({name:context.name,summary:String(values.get('nodeSummary')||'').trim()});
      try{C.validate(candidate,base);}catch(e){error(e.message);return;}
      context.applied=true;change(()=>project=candidate,{phaseId:p.id});
    }else{
      if(!String(values.get('title')||'').trim()){error('请填写阶段名称。');return;}
      const candidate=C.clone(project),draft=candidate.phases.find(item=>item.id===p.id);
      for(const key of ['title','kicker','summary','focus','cap','npc'])draft[key]=String(values.get(key)||'').trim();for(const key of ['start','finish','arrival'])draft.plan[key]=String(values.get(key)||'').trim();for(const key of ['requirements','reminders'])draft.plan[key]=String(values.get(key)||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      try{C.validate(candidate,base);}catch(e){error(e.message);return;}
      context.applied=true;change(()=>project=candidate,{phaseId:p.id});
    }
    $('#guideEditorDialog').close();toast('已应用修改，正在保存到本机。');
  }
  function chooseUpload(context,multiple=false){syncImages();uploadContext={editing, ...context};const input=$('#guideImageFile');input.multiple=multiple;input.click();}
  async function readImage(file){
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('请选择 PNG、JPG 或 WebP 图片。');if(file.size>5*1024*1024)throw new Error('单张图片请控制在 5 MB 内。');
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('图片读取失败'));r.readAsDataURL(file);});
    const size=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(new Error('无法识别这张图片'));image.src=src;});if(size.width>30000||size.height>30000)throw new Error('图片尺寸太大，请缩小后重试。');return {src,...size,file:file.name,version:'自己上传的图片',credit:'自己上传的图片'};
  }
  document.addEventListener('click',event=>{
    const direct=event.target.closest('[data-guide-image],[data-guide-landmarks]');if(direct&&active){openStep(direct.dataset.visualPhase,direct.dataset.visualStepId,direct);if(direct.dataset.guideLandmarks){const panel=document.querySelector(`[data-landmark-image="${direct.dataset.guideLandmarks}"]`);if(panel){panel.open=true;panel.scrollIntoView({block:'start'});panel.querySelector('[data-landmark-field="label"]').focus({preventScroll:true});}}else{const item=C.orderedImages(editing.draft).find(item=>item.id===direct.dataset.guideImage);if(item)annotate(item.image,item.type,direct);}return;}
    const button=event.target.closest('[data-guide-edit]');if(button){
      const id=button.dataset.editPhase,stepId=button.dataset.editStep,p=phase(id),action=button.dataset.guideEdit;
      if(action==='step'||action==='insert'||action==='append'){openStep(id,stepId,button,action!=='step');return;}
      if(action==='phase'){openPhase(id,button);return;}
      if(action==='node'){openNode(id,button.dataset.editNode,button);return;}
      if(action==='up'||action==='down'){change(()=>C.move(p,stepId,action==='up'?-1:1),{phaseId:id,stepId});toast('顺序已调整，文字、配图和完成标记一起保留。');return;}
      if(action==='delete'){const index=p.steps.findIndex(s=>s.id===stepId),next=p.steps[index+1]||p.steps[index-1];change(()=>p.steps.splice(index,1),{phaseId:id,stepId:next?.id});toast('步骤已删除，点击“撤销”可以恢复。');return;}
      if(action==='restore'){change(()=>{project.phases[project.phases.findIndex(item=>item.id===id)]=C.create(base).phases.find(item=>item.id===id);},{phaseId:id});toast('本阶段已还原，可以撤销。');return;}
    }
    if($('#guideEditorDialog').open&&editing?.type==='node'&&event.target.closest('[data-reset-node-summary]')){
      editing.useAutomatic=true;$('#guideContentForm [name="nodeSummary"]').value=C.autoNodeSummary(phase(editing.phaseId),editing.name);$('#guideContentForm [name="nodeSummary"]').focus();return;
    }
    if(!$('#guideEditorDialog').open||editing?.type!=='step')return;
    const landmarkButton=event.target.closest('[data-landmark-action]');if(landmarkButton){
      syncImages();const panel=landmarkButton.closest('[data-landmark-image]'),image=editing.draft.maps.find(ref=>ref.visualId===panel.dataset.landmarkImage),action=landmarkButton.dataset.landmarkAction;
      if(action==='restore')delete image.landmarks;
      else{const points=C.mapLandmarks(base,editing.phaseId,editing.draft,image);if(action==='hide-all')points.forEach(point=>point.hidden=true);else{const from=Number(landmarkButton.dataset.landmarkIndex),to=from+(action==='up'?-1:1);if(to<0||to>=points.length)return;[points[from],points[to]]=[points[to],points[from]];}image.landmarks=points;}
      renderImages();const nextPanel=document.querySelector(`[data-landmark-image="${image.visualId}"]`);nextPanel.querySelector('summary').focus({preventScroll:true});return;
    }
    const orderButton=event.target.closest('[data-order-action]');if(orderButton){syncImages();const item=C.orderedImages(editing.draft).find(item=>item.id===orderButton.dataset.imageId);if(!item)return;if(orderButton.dataset.orderAction==='annotate'){annotate(item.image,item.type,orderButton);return;}C.moveImage(editing.draft,item.id,orderButton.dataset.orderAction==='up'?-1:1);renderImages();document.querySelector(`[data-order-action="${orderButton.dataset.orderAction}"][data-image-id="${item.id}"]`)?.focus();return;}
    const imageButton=event.target.closest('[data-image-action]');if(imageButton){
      syncImages();const type=imageButton.dataset.imageType,images=editing.draft[type==='shot'?'shots':'maps'],index=Number(imageButton.dataset.imageIndex),action=imageButton.dataset.imageAction;
      if(action==='replace'){chooseUpload({type,target:images[index]});return;}
      if(action==='annotate'){annotate(images[index],type,imageButton);return;}
      if(action==='remove')images.splice(index,1);if(action==='up'&&index>0)[images[index-1],images[index]]=[images[index],images[index-1]];if(action==='down'&&index<images.length-1)[images[index+1],images[index]]=[images[index],images[index+1]];renderImages();return;
    }
    if(event.target.closest('[data-upload-shots]')){chooseUpload({type:'shot'},true);return;}
    if(event.target.closest('[data-upload-map]')){chooseUpload({type:'map'});return;}
    if(event.target.closest('[data-add-existing-map]')){syncImages();const id=$('#existingGuideMap').value;if(editing.draft.maps.some(m=>m.id===id&&!m.custom)){error('这张地图已在当前步骤中。');return;}editing.draft.maps.push({id,title:$('#existingGuideMap').selectedOptions[0].textContent});renderImages();$('#guideEditorError').hidden=true;}
  });
  document.addEventListener('submit',event=>{if(event.target.id==='guideContentForm'){event.preventDefault();saveForm();}});
  $('#guideImageFile').addEventListener('change',async event=>{
    const files=[...event.target.files],context=uploadContext;if(!files.length||!context)return;$('#guideEditorSave').disabled=true;status('正在读取图片…');
    try{for(const file of files){const image=await readImage(file);if(editing!==context.editing||!$('#guideEditorDialog').open)return;syncImages();
      const title=file.name.replace(/\.[^.]+$/,'').slice(0,180)||'上传的图片';
      if(context.target){delete context.target.annotation;delete context.target.landmarks;}
      if(context.type==='shot'){if(context.target){Object.assign(context.target,{src:image.src,uploaded:true,captionEdited:true});}else editing.draft.shots.push({src:image.src,kind:title,caption:'',uploaded:true});}
      else{const ref=context.target||{id:'uploaded-map-'+C.newId(),title};if(context.target)ref.id='uploaded-map-'+C.newId();ref.custom=image;ref.description=ref.description||'';if(!context.target)editing.draft.maps.push(ref);}renderImages();
    }$('#guideEditorError').hidden=true;status('图片已读入 · 点击“保存这一步”应用修改');}catch(e){error(e.message);}finally{event.target.value='';if(editing===context.editing)$('#guideEditorSave').disabled=false;}
  });
  let imageDrag;
  document.addEventListener('pointerdown',event=>{const handle=event.target.closest('[data-image-drag]');if(!handle||event.button!==0||editing?.type!=='step')return;syncImages();const row=handle.closest('[data-order-id]');imageDrag={id:row.dataset.orderId,targetId:row.dataset.orderId,x:event.clientX,y:event.clientY,context:editing,moved:false};handle.setPointerCapture(event.pointerId);event.preventDefault();});
  document.addEventListener('pointermove',event=>{if(!imageDrag)return;if(Math.hypot(event.clientX-imageDrag.x,event.clientY-imageDrag.y)>6)imageDrag.moved=true;if(!imageDrag.moved)return;document.querySelector(`[data-order-id="${imageDrag.id}"]`)?.classList.add('is-dragging');const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-order-id]');if(!row)return;imageDrag.targetId=row.dataset.orderId;document.querySelectorAll('.is-drag-over').forEach(n=>n.classList.remove('is-drag-over'));row.classList.add('is-drag-over');});
  document.addEventListener('pointerup',()=>{if(!imageDrag)return;const drag=imageDrag;imageDrag=null;if(editing===drag.context&&drag.moved){C.reorderImage(editing.draft,drag.id,drag.targetId);renderImages();}document.querySelectorAll('.is-dragging,.is-drag-over').forEach(n=>n.classList.remove('is-dragging','is-drag-over'));});
  document.addEventListener('pointercancel',()=>{imageDrag=null;document.querySelectorAll('.is-dragging,.is-drag-over').forEach(n=>n.classList.remove('is-dragging','is-drag-over'));});
  document.addEventListener('input',event=>{if(editing?.type==='node'&&event.target.name==='nodeSummary')editing.useAutomatic=false;});
  $('#guideEditorDialog').addEventListener('close',()=>{const context=editing;if(context&&!context.applied)status(context.previousStatus);editing=null;uploadContext=null;const nodeTarget=context?.type==='node'?Array.from(document.querySelectorAll('[data-guide-edit="node"]')).find(button=>button.dataset.editPhase===context.phaseId&&button.dataset.editNode===context.name):null;const focusTarget=returnFocus?.isConnected?returnFocus:nodeTarget||document.querySelector(`[data-guide-edit="step"][data-edit-step="${context?.stepId||''}"]`)||$('#editGuideBtn');focusTarget?.focus({preventScroll:true});});
  $('#guideEditorCancel').addEventListener('click',()=>$('#guideEditorDialog').close());
  $('#editGuideBtn').addEventListener('click',toggle);
  $('#guideSaveBtn').addEventListener('click',async()=>{if(await saveNow())toast('文字、顺序和配图已保存在本机。');});
  $('#guideUndoBtn').addEventListener('click',()=>{if(!history.length)return;project=history.pop();refresh({phaseId:api?.currentPhase()});saveSoon();toast('已撤销上一次内容修改。');});
  $('#guideExportBtn').addEventListener('click',()=>{const text=JSON.stringify(project,null,2);if(backupUrl)URL.revokeObjectURL(backupUrl);backupUrl=URL.createObjectURL(new Blob([text],{type:'application/json'}));$('#guideBackupLink').href=backupUrl;$('#guideBackupLink').download='平行五通-攻略备份-'+new Date().toLocaleDateString('sv-SE')+'.json';$('#guideBackupText').value=text;$('#guideBackupDialog').showModal();$('#guideBackupLink').focus();});
  $('#closeGuideBackup').addEventListener('click',()=>$('#guideBackupDialog').close());$('#guideBackupDialog').addEventListener('close',()=>$('#guideExportBtn').focus());
  $('#guideImportBtn').addEventListener('click',()=>$('#guideBackupFile').click());
  $('#guideBackupFile').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{const next=C.validate(JSON.parse(await file.text()),base);change(()=>project=next,{phaseId:api?.currentPhase()});toast('攻略备份已恢复。导入前的内容可以用“撤销”恢复。');}catch(e){toast(e.message||'无法读取这份备份。');}event.target.value='';});
  window.guideEditor={ready,connect:callbacks=>api=callbacks,renderStepTools,renderPhaseTools,renderNodeTools,get active(){return active;},get hasContent(){return hasContent;},get busy(){return Boolean($('#guideEditorDialog').open||document.querySelector('.image-markup-dialog[open]'));},get revision(){return revision;},snapshot:()=>C.clone(project),async replaceFromCloud(value){if(this.busy)throw new Error('请先保存或取消正在编辑的步骤，再接收云端内容。');const next=C.validate(value,base);checkpoint();project=next;hasContent=true;revision++;refresh({phaseId:api?.currentPhase()});return saveNow();},flush:()=>revision?saveNow():Promise.resolve(true),hydrateProgress:saved=>C.hydrateProgress(saved,base),progressForStorage:progress=>C.progressForStorage(progress,base)};
})();

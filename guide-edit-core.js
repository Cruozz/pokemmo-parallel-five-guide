(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const originalId=(phase,index)=>`${phase}-original-${index}`;
  const newId=()=>`custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
  function orderedImages(step){
    const items=['shot','map'].flatMap(type=>(step[type==='shot'?'shots':'maps']||[]).map((image,index)=>({type,index,image,id:image.visualId||`${type}-${index}`})));
    const order=step.visualOrder||items.map(item=>item.id);
    return order.map(id=>items.find(item=>item.id===id)).filter(Boolean);
  }
  function normalizeImages(step){
    const items=['shot','map'].flatMap(type=>step[type==='shot'?'shots':'maps'].map((image,index)=>({type,index,image}))),used=new Set();
    for(const {type,index,image} of items){if(!image.visualId){let id=`${step.id}-media-${type}-${index}`;while(used.has(id)||items.some(item=>item.image.visualId===id))id+='x';image.visualId=id;}used.add(image.visualId);}
    step.visualOrder=(step.visualOrder||[]).filter((id,index,all)=>used.has(id)&&all.indexOf(id)===index);
    for(const {image} of items)if(!step.visualOrder.includes(image.visualId))step.visualOrder.push(image.visualId);
    return step;
  }
  function moveImage(step,id,offset){normalizeImages(step);const from=step.visualOrder.indexOf(id),to=from+offset;if(from<0||to<0||to>=step.visualOrder.length)return false;[step.visualOrder[from],step.visualOrder[to]]=[step.visualOrder[to],step.visualOrder[from]];return true;}
  function reorderImage(step,id,targetId){normalizeImages(step);const from=step.visualOrder.indexOf(id),to=step.visualOrder.indexOf(targetId);if(from<0||to<0||from===to)return false;step.visualOrder.splice(from,1);step.visualOrder.splice(to,0,id);return true;}
  function mapLandmarks(base,phaseId,step,ref){
    if(ref.custom)return [];
    return clone(ref.landmarks??base.stepMapNotes?.[phaseId]?.[step.baseIndex]?.[ref.id]?.points??base.mapNotes?.[ref.id]?.points??[]);
  }
  function autoNodeSummary(phase,name){
    const actions=phase.steps.filter(step=>step.locations.includes(name)).map(step=>{
      const first=step.action.trim().split(/[。！？\n]/u)[0].trim();
      return first.length>110?first.slice(0,110)+'…':first;
    }).filter(Boolean);
    const summary=[...new Set(actions)].join('；');
    return summary.length>2000?summary.slice(0,1999)+'…':summary;
  }
  function nodeSummary(phase,name){
    const saved=phase.nodeSummaries?.find(node=>node.name===name);
    return saved?saved.summary:autoNodeSummary(phase,name);
  }
  function imageAsset(src){
    if(typeof src!=='string')return false;
    if(/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(src))return src.length<=7*1024*1024;
    try{const path=decodeURIComponent(src);return /^assets\/[a-zA-Z0-9_/ .-]+\.(png|jpg|jpeg|webp)$/i.test(path)&&!path.includes('..');}catch(_){return false;}
  }
  function create(base){return {version:1,kind:'pokemmo-guide-editor',phases:base.phases.map(phase=>({
    id:phase.id,title:phase.title,kicker:phase.kicker,summary:phase.summary,focus:phase.focus,cap:phase.cap,npc:phase.npc,
    plan:clone(base.routePlans[phase.id]),steps:base.detailGuides[phase.id].map((item,index)=>normalizeImages({
      id:originalId(phase.id,index),baseIndex:index,...clone(item),
      locations:phase.route.filter(p=>p.guideIndices.includes(index)).map(p=>p.name),
      shots:clone(base.stepVisuals[phase.id][index].shots),maps:clone(base.stepVisuals[phase.id][index].maps)
    }))
  }))};}
  function validate(input,base){
    input=clone(input);
    const fail=message=>{throw new Error(message);};
    const text=(value,max=5000)=>typeof value==='string'&&value.length<=max;
    const nonempty=(v,max)=>text(v,max)&&v.trim().length>0;
    const list=(value,max=100)=>Array.isArray(value)&&value.length<=max;
    if(!input||input.version!==1||input.kind!=='pokemmo-guide-editor'||!Array.isArray(input.phases)||input.phases.length!==base.phases.length)fail('请选择从“编辑流程”导出的攻略备份。');
    const phases=new Set(),ids=new Set();
    for(const phase of input.phases){
      const original=base.phases.find(p=>p.id===phase.id);
      if(!original||phases.has(phase.id)||!nonempty(phase.title,160)||!text(phase.kicker,160)||!text(phase.summary)||!text(phase.focus)||!text(phase.cap,100)||!text(phase.npc,160))fail('备份中的阶段说明不完整。');
      phases.add(phase.id);
      const plan=phase.plan;
      if(!plan||!['start','finish','arrival'].every(key=>text(plan[key]))||!['requirements','reminders'].every(key=>list(plan[key])&&plan[key].every(v=>text(v))))fail('备份中的阶段路线说明不完整。');
      if(!list(phase.steps,1000))fail('备份中的步骤数量不支持。');
      const names=new Set(original.route.map(p=>p.name));
      if(phase.nodeSummaries!==undefined){
        if(!list(phase.nodeSummaries,names.size))fail('地图节点摘要数量不正确。');
        const used=new Set();
        for(const node of phase.nodeSummaries){
          if(!node||!names.has(node.name)||used.has(node.name)||!text(node.summary,2000))fail('地图节点摘要格式不正确，每个地点最多 2000 字。');
          used.add(node.name);
        }
      }
      for(const step of phase.steps){
        if(!nonempty(step.id,160)||!/^[a-zA-Z0-9-]+$/.test(step.id)||ids.has(step.id)||!nonempty(step.place,180)||!text(step.action)||!text(step.npc,2000)||!text(step.gain,2000))fail('步骤名称或文字格式不正确。');
        ids.add(step.id);
        if(step.baseIndex!==null&&(!Number.isInteger(step.baseIndex)||!base.detailGuides[phase.id][step.baseIndex]||step.id!==originalId(phase.id,step.baseIndex)))fail('原步骤的关联编号不正确。');
        if(step.baseIndex===null&&!step.id.startsWith('custom-'))fail('新增步骤编号不正确。');
        if(!list(step.locations,50)||step.locations.some(name=>!names.has(name)))fail('步骤关联了不存在的总览地点。');
        if(!list(step.shots,100)||!list(step.maps,100))fail('单步图片数量不支持。');
        for(const shot of step.shots)if(!imageAsset(shot.src)||!nonempty(shot.kind,180)||!text(shot.caption))fail('配图或图注格式不支持。');
        for(const ref of step.maps){
          if(!nonempty(ref.id,180)||!nonempty(ref.title,180)||ref.description!==undefined&&!text(ref.description))fail('地图标题或说明格式不正确。');
          if(ref.landmarks!==undefined){
            if(!list(ref.landmarks,200))fail('地图编号说明数量不支持。');
            const pointIds=new Set(),coordinate=v=>Number.isFinite(v)&&v>=0&&v<=100;
            for(const point of ref.landmarks){
              if(!point||!nonempty(point.id,16)||!/^[a-zA-Z0-9-]+$/.test(point.id)||pointIds.has(point.id))fail('同一张地图的编号不能重复，请使用数字或英文字母。');
              pointIds.add(point.id);
              if(!nonempty(point.label,180)||point.detail!==undefined&&!text(point.detail))fail('请填写每个地图编号的名称，详细动作最多 5000 字。');
              if(!coordinate(point.x)||!coordinate(point.y)||['labelX','labelY'].some(key=>point[key]!==undefined&&!coordinate(point[key])))fail('地图编号位置不正确。');
              if(!['entry','exit','story','heal','item','goal','battle','switch'].includes(point.kind)||point.hidden!==undefined&&typeof point.hidden!=='boolean')fail('地图编号显示格式不正确。');
            }
          }
          if(ref.custom){const m=ref.custom;if(!imageAsset(m.src)||!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<1||m.height<1||m.width>30000||m.height>30000)fail('上传的地图图片不正确。');}
          else if(!Object.hasOwn(base.atlas,ref.id))fail('备份引用了不存在的地图。');
        }
        const visuals=[...step.shots,...step.maps],visualIds=new Set();
        for(const image of visuals){
          if(image.visualId!==undefined){if(!nonempty(image.visualId,200)||!/^[a-zA-Z0-9-]+$/.test(image.visualId)||visualIds.has(image.visualId))fail('图片关联编号不正确。');visualIds.add(image.visualId);}
          if(image.annotation!==undefined){const markup=typeof module==='object'&&module.exports?require('./image-markup-core.js'):root.ImageMarkupCore;image.annotation=markup.validate(image.annotation);}
        }
        if(step.visualOrder!==undefined&&(!list(step.visualOrder,200)||step.visualOrder.length!==visuals.length||new Set(step.visualOrder).size!==visuals.length||step.visualOrder.some(id=>!visualIds.has(id))))fail('图片排列顺序不完整。');
        normalizeImages(step);
      }
    }
    return clone(input);
  }
  function apply(project,data,base){
    data.stepMapNotes={};
    for(const edit of project.phases){
      const phase=data.phases.find(p=>p.id===edit.id),original=base.phases.find(p=>p.id===edit.id);
      for(const key of ['title','kicker','summary','focus','cap','npc'])phase[key]=edit[key];
      data.routePlans[phase.id]=clone(base.routePlans[phase.id]);
      for(const key of ['start','finish','arrival','requirements','reminders'])data.routePlans[phase.id][key]=clone(edit.plan[key]);
      data.detailGuides[phase.id]=edit.steps.map(step=>({id:step.id,baseIndex:step.baseIndex,place:step.place,action:step.action,npc:step.npc,gain:step.gain}));
      data.stepVisuals[phase.id]=edit.steps.map(step=>({shots:clone(step.shots),maps:clone(step.maps),visualOrder:clone(step.visualOrder||orderedImages(step).map(item=>item.id))}));
      data.stepMapNotes[phase.id]={};
      edit.steps.forEach((step,index)=>{if(step.baseIndex!==null&&base.stepMapNotes?.[phase.id]?.[step.baseIndex])data.stepMapNotes[phase.id][index]=clone(base.stepMapNotes[phase.id][step.baseIndex]);});
      phase.route=original.route.map(point=>({...clone(point),summary:nodeSummary(edit,point.name),guideIndices:edit.steps.flatMap((step,index)=>step.locations.includes(point.name)?[index]:[])})).filter(point=>point.guideIndices.length);
      phase.steps=phase.route.map(point=>[point.name,point.summary,'对应执行步骤']);
      const changedOrder=edit.steps.length!==base.detailGuides[phase.id].length||edit.steps.some((step,index)=>step.baseIndex!==index||step.place!==base.detailGuides[phase.id][index]?.place);
      if(edit.summary===original.summary&&changedOrder)phase.summary=edit.steps.length?`本段从${edit.steps[0].place}开始，推进至${edit.steps.at(-1).place}。以执行清单和阶段完成条件为准。`:'本阶段尚未编排步骤。';
    }
  }
  function hydrateProgress(saved,base){
    const result={completed:saved?.completed&&typeof saved.completed==='object'&&!Array.isArray(saved.completed)?clone(saved.completed):{},completedById:{},current:{phaseId:'u1',index:0,stepId:originalId('u1',0)}};
    for(const phase of base.phases){
      const modern=saved?.completedById?.[phase.id];
      result.completedById[phase.id]=Array.isArray(modern)?modern.filter(id=>typeof id==='string'&&id.length<=160):base.detailGuides[phase.id].flatMap((_,index)=>saved?.completed?.[phase.id]?.[index]?[originalId(phase.id,index)]:[]);
    }
    if(base.phases.some(p=>p.id===saved?.current?.phaseId)){
      const old=saved.current,index=Math.max(0,Number(old.index)||0);
      result.current={phaseId:old.phaseId,index,stepId:typeof old.stepId==='string'?old.stepId:originalId(old.phaseId,index)};
    }
    return result;
  }
  function progressForStorage(progress,base){
    const result=clone(progress);
    for(const phase of base.phases)result.completed[phase.id]=base.detailGuides[phase.id].map((_,index)=>(result.completedById[phase.id]||[]).includes(originalId(phase.id,index)));
    const phaseId=result.current.phaseId,index=base.detailGuides[phaseId]?.findIndex((_,i)=>originalId(phaseId,i)===result.current.stepId);
    result.current.index=index>=0?index:0;
    return result;
  }
  function move(phase,id,offset){const from=phase.steps.findIndex(s=>s.id===id),to=from+offset;if(from<0||to<0||to>=phase.steps.length)return false;[phase.steps[from],phase.steps[to]]=[phase.steps[to],phase.steps[from]];return true;}
  function insert(phase,afterId){const after=phase.steps.findIndex(s=>s.id===afterId);const step={id:newId(),baseIndex:null,place:'新步骤',action:'',npc:'',gain:'',locations:[],shots:[],maps:[],visualOrder:[]};phase.steps.splice(afterId?after+1:phase.steps.length,0,step);return step;}
  const api={clone,originalId,newId,imageAsset,create,validate,apply,hydrateProgress,progressForStorage,move,insert,normalizeImages,orderedImages,moveImage,reorderImage,mapLandmarks,autoNodeSummary,nodeSummary};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GuideEditCore=api;
})(typeof window==='object'?window:this);

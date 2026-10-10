(function(){
  'use strict';
  const M=window.ImageMarkupCore,clone=x=>JSON.parse(JSON.stringify(x)),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let dialog,state,stage,viewport,tool='arrow',zoom=1,baseWidth=0,gesture,pendingRoute=[],undo=[],redo=[],selected=-1,returnFocus,inline,lastTextPointer;
  const clamp=x=>Math.max(0,Math.min(1,x));
  function remember(){undo.push(clone(state.annotation));if(undo.length>30)undo.shift();redo=[];}
  function status(text){dialog.querySelector('[data-markup-status]').textContent=text;}
  function positionInline(){
    if(!inline)return;const e=inline.element,w=stage.clientWidth,h=stage.clientHeight,boxWidth=Math.min(280,Math.max(140,w*(1-e.x)),w);
    inline.box.style.left=Math.min(e.x*w,Math.max(0,w-boxWidth))+'px';inline.box.style.width=boxWidth+'px';
    inline.input.style.fontSize=Math.max(16,e.size*w/900)+'px';inline.input.style.color=e.color;
    inline.box.style.top=Math.min(e.y*h,Math.max(0,h-inline.box.offsetHeight))+'px';
  }
  function finishInline(commit=true){
    if(!inline)return true;const current=inline,text=current.input.value.trim();
    if(commit&&text){
      if(text.split('\n').length>20){status('文字最多 20 行，请减少行数后完成。');current.input.focus({preventScroll:true});return false;}
      const e={...current.element,text};
      if(current.index<0){if(!add(e))return false;selected=state.annotation.elements.length-1;}
      else if(JSON.stringify(e)!==JSON.stringify(state.annotation.elements[current.index])){remember();state.annotation.elements[current.index]=e;selected=current.index;}
    }else if(commit&&current.index>=0&&!text){status('文字不能为空；按 Esc 可保留原文字。');current.input.focus({preventScroll:true});return false;}
    current.box.remove();inline=null;paint();return true;
  }
  function beginInline(index,p){
    if(!finishInline())return;
    if(index<0&&state.annotation.elements.length>=200){status('最多添加 200 个标注，请先删除不需要的标注。');return;}
    const original=index>=0?state.annotation.elements[index]:null;if(original&&original.type!=='text')return;
    gesture=null;lastTextPointer=null;selected=index;
    const element=original?clone(original):{type:'text',text:'',x:p[0],y:p[1],color:color(),width:width(),size:textSize()};
    const box=document.createElement('div');box.className='markup-inline-editor';box.innerHTML='<textarea data-markup-inline-text aria-label="图片上的文字" maxlength="500" rows="3" placeholder="在这里直接输入文字"></textarea><div><button type="button" data-markup-inline-save>完成</button><button type="button" data-markup-inline-cancel>取消</button></div><small>Enter 完成 · Shift+Enter 换行 · Esc 取消</small>';
    const input=box.querySelector('textarea');input.value=element.text;inline={index,element,box,input,composing:false};stage.append(box);positionInline();paint();
    input.addEventListener('compositionstart',()=>{if(inline?.input===input)inline.composing=true;});input.addEventListener('compositionend',()=>{if(inline?.input===input)inline.composing=false;});
    input.addEventListener('keydown',event=>{if(event.isComposing||event.keyCode===229||inline?.composing)return;if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();event.stopPropagation();if(finishInline())viewport.focus({preventScroll:true});}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();finishInline(false);viewport.focus({preventScroll:true});}});
    box.addEventListener('focusout',()=>{queueMicrotask(()=>{if(inline?.box===box&&!inline.composing&&!box.contains(document.activeElement))finishInline();});});
    input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length);status('直接在图片里输入，Enter 完成，Shift+Enter 换行；Esc 取消本次文字修改。');
  }
  function resetNumber(){dialog.querySelector('[data-markup-number]').value=M.nextNumber(state.annotation);}
  function paint(){
    stage.querySelector('.markup-objects').innerHTML=M.svg(state.annotation,{editable:tool==='select'||tool==='text',selected,hiddenIndex:inline?.index??-1,extra:gesture?.shape?[gesture.shape]:pendingRoute.length>1?[{type:'path',color:color(),width:width(),points:pendingRoute}]:[]});
    dialog.querySelector('[data-markup-undo]').disabled=!undo.length&&!pendingRoute.length;dialog.querySelector('[data-markup-redo]').disabled=!redo.length;
    dialog.querySelector('[data-markup-delete]').disabled=selected<0;dialog.querySelector('[data-markup-clear]').disabled=!state.annotation.elements.length;
    dialog.querySelector('[data-markup-edit-text]').disabled=state.annotation.elements[selected]?.type!=='text';
    dialog.querySelector('[data-markup-finish-route]').hidden=tool!=='route';
    dialog.querySelector('[data-markup-finish-route]').disabled=pendingRoute.length<2;
    dialog.querySelector('[data-markup-number-properties]').hidden=tool!=='number'&&state.annotation.elements[selected]?.type!=='number';
    dialog.querySelector('[data-markup-number-label]').textContent=state.annotation.elements[selected]?.type==='number'?'当前编号':'下一个编号';
    const list=dialog.querySelector('[data-markup-list]');
    list.innerHTML=state.annotation.elements.length?state.annotation.elements.map((e,i)=>`<button type="button" data-pick-markup="${i}" aria-pressed="${selected===i}">${i+1}. ${esc(e.type==='text'?e.text:e.type==='number'?M.numberSymbol(e.number)+' 顺序编号':{arrow:'箭头',path:'路线',line:'直线'}[e.type])}</button>`).join(''):'<p>还没有标注</p>';
  }
  function color(){return dialog.querySelector('[data-markup-color]').value;}
  function width(){return Number(dialog.querySelector('[data-markup-width]').value);}
  function textSize(){return Number(dialog.querySelector('[data-markup-size]').value);}
  function chooseValue(selector,value){const control=dialog.querySelector(selector);if(![...control.options].some(o=>Number(o.value)===value)){const option=document.createElement('option');option.value=value;option.textContent=value;control.append(option);}control.value=value;}
  function setTool(next){if(!finishInline())return;finishRoute();gesture=null;lastTextPointer=null;tool=next;selected=-1;stage.dataset.tool=tool;if(tool==='number')resetNumber();dialog.querySelectorAll('[data-markup-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.markupTool===tool)));paint();status({pan:'用手指或滚动条移动放大后的图片，再选择工具继续标注。',select:'选择标注可移动或删除；双击文字直接修改。',path:'按住图片画线路。',line:'从起点拖到终点画直线。',arrow:'从起点拖到终点画箭头。',route:'依次点击拐点，再点击“完成折线”；也可双击或按 Enter 完成。',text:'点击图片直接输入文字；点击已有文字可继续编辑。',number:'点击图片放置顺序编号，自动按 ①、②、③ 递增。'}[tool]);}
  function resize(){
    const a=state.annotation;baseWidth=Math.max(80,Math.min(viewport.clientWidth-32,(viewport.clientHeight-32)*a.width/a.height));
    stage.style.width=baseWidth*zoom+'px';stage.style.aspectRatio=a.width+'/'+a.height;
    dialog.querySelector('[data-markup-zoom-value]').textContent=Math.round(baseWidth*zoom/a.width*100)+'%';
    positionInline();
  }
  function point(event){const r=stage.getBoundingClientRect();return [clamp((event.clientX-r.left)/r.width),clamp((event.clientY-r.top)/r.height)];}
  function add(shape){if(state.annotation.elements.length>=200){status('最多添加 200 个标注，请先删除不需要的标注。');return false;}remember();state.annotation.elements.push(shape);selected=-1;paint();return true;}
  function finishRoute(){if(pendingRoute.length>1)add({type:'path',color:color(),width:width(),points:clone(pendingRoute)});pendingRoute=[];}
  function select(index){if(!finishInline())return;finishRoute();tool='select';gesture=null;selected=index;stage.dataset.tool=tool;dialog.querySelectorAll('[data-markup-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.markupTool==='select')));const e=state.annotation.elements[index];if(!e)return;dialog.querySelector('[data-markup-color]').value=e.color;chooseValue('[data-markup-width]',e.width);if(e.type==='text')chooseValue('[data-markup-size]',e.size);if(e.type==='number'){dialog.querySelector('[data-markup-number]').value=e.number;chooseValue('[data-markup-number-size]',e.size);}paint();dialog.querySelector(`[data-pick-markup="${index}"]`)?.focus({preventScroll:true});status('已选择标注 '+(index+1)+'，可以移动、修改或删除；双击文字可就地输入。');}
  function ensure(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='image-markup-dialog';dialog.setAttribute('aria-labelledby','imageMarkupTitle');document.body.append(dialog);
    dialog.innerHTML=`<header class="markup-head"><div><h2 id="imageMarkupTitle">编辑图片标注</h2><p data-markup-title></p></div><button type="button" data-markup-cancel aria-label="关闭图片标注">取消</button></header><div class="markup-body"><div class="markup-main"><div class="markup-tools" aria-label="标注工具">${[['pan','移动画布'],['select','选择 / 移动'],['path','画线路'],['route','折线路线'],['line','直线'],['arrow','箭头'],['text','文字'],['number','① 顺序编号']].map(([key,name])=>`<button type="button" data-markup-tool="${key}" aria-pressed="false">${name}</button>`).join('')}<button type="button" data-markup-finish-route hidden>完成折线</button><button type="button" data-markup-undo>撤销</button><button type="button" data-markup-redo>重做</button></div><div class="markup-view-tools"><button type="button" data-markup-zoom="out" aria-label="缩小图片">−</button><output data-markup-zoom-value></output><button type="button" data-markup-zoom="in" aria-label="放大图片">＋</button><button type="button" data-markup-zoom="fit">适合窗口</button><button type="button" data-markup-zoom="actual">原始大小</button><span>放大后滚动查看</span></div><div class="markup-viewport" tabindex="0" aria-label="图片标注画布"><div class="markup-stage"><img draggable="false" alt="标注底图"><div class="markup-objects"></div></div></div><p class="markup-status" data-markup-status role="status"></p></div><aside class="markup-properties"><label>颜色<input type="color" data-markup-color aria-label="标注颜色" value="#ef3340"></label><label>线宽<select data-markup-width aria-label="标注线宽">${[2,4,6,8,12,16,24].map(n=>`<option value="${n}" ${n===6?'selected':''}>${n}</option>`).join('')}</select></label><p class="markup-text-help">选择“文字”后，直接点击图片输入。双击已有文字可修改。</p><div data-markup-number-properties hidden><label><span data-markup-number-label>下一个编号</span><input type="number" data-markup-number aria-label="顺序编号" min="1" max="99" step="1" value="1"></label><label>编号大小<select data-markup-number-size aria-label="顺序编号大小">${[28,36,48,64,80,96].map(n=>`<option value="${n}" ${n===48?'selected':''}>${n}</option>`).join('')}</select></label><p class="markup-text-help">点击图片放置编号，自动递增。</p></div><label>文字大小<select data-markup-size aria-label="标注文字大小">${[18,24,28,36,48,64,96].map(n=>`<option value="${n}" ${n===48?'selected':''}>${n}</option>`).join('')}</select></label><button type="button" data-markup-edit-text>编辑选中文字</button><div class="markup-object-actions"><button type="button" data-markup-delete>删除选中</button><button type="button" data-markup-clear>清空标注</button></div><details open><summary>已有标注</summary><div data-markup-list class="markup-object-list"></div></details></aside></div><footer class="markup-footer"><span>应用后，点击“保存这一步”保存到攻略。</span><button type="button" data-markup-apply>应用标注</button></footer>`;
    stage=dialog.querySelector('.markup-stage');viewport=dialog.querySelector('.markup-viewport');
    stage.addEventListener('pointerdown',event=>{
      if(event.button!==0||!state||tool==='pan'||event.target.closest('.markup-inline-editor'))return;
      if(inline?.composing||!finishInline())return;
      const p=point(event);event.preventDefault();
      if(tool==='select'){
        const target=event.target.closest('[data-markup-element]');if(!target){selected=-1;lastTextPointer=null;paint();return;}const index=Number(target.dataset.markupElement),e=state.annotation.elements[index];
        if(e?.type==='text'&&lastTextPointer?.index===index&&event.timeStamp-lastTextPointer.time<450&&Math.hypot(event.clientX-lastTextPointer.x,event.clientY-lastTextPointer.y)<6){beginInline(index);return;}
        select(index);lastTextPointer=e?.type==='text'?{index,time:event.timeStamp,x:event.clientX,y:event.clientY}:null;stage.setPointerCapture(event.pointerId);gesture={start:p,original:clone(state.annotation.elements[selected]),moved:false};return;
      }
      if(tool==='text'){const target=event.target.closest('[data-markup-element]'),index=target?Number(target.dataset.markupElement):-1;beginInline(state.annotation.elements[index]?.type==='text'?index:-1,p);return;}
      if(tool==='number'){const control=dialog.querySelector('[data-markup-number]'),n=Number(control.value);if(!Number.isInteger(n)||n<1||n>99){status('请输入 1—99 的顺序编号。');control.focus();return;}if(add({type:'number',number:n,x:p[0],y:p[1],size:Number(dialog.querySelector('[data-markup-number-size]').value),color:color(),width:width()}))control.value=Math.min(99,n+1);return;}
      stage.setPointerCapture(event.pointerId);
      if(tool==='route'){if(event.detail<2)pendingRoute.push(p);paint();return;}
      gesture={start:p,shape:{type:tool==='path'?'path':tool,color:color(),width:width(),points:[p,p]}};paint();
    });
    stage.addEventListener('pointermove',event=>{
      if(!gesture)return;const p=point(event);
      if(tool==='select'){
        let dx=p[0]-gesture.start[0],dy=p[1]-gesture.start[1],e=gesture.original;
        const ps=M.anchors(e);
        dx=Math.max(-Math.min(...ps.map(p=>p[0])),Math.min(dx,1-Math.max(...ps.map(p=>p[0]))));dy=Math.max(-Math.min(...ps.map(p=>p[1])),Math.min(dy,1-Math.max(...ps.map(p=>p[1]))));
        if(Math.abs(dx)+Math.abs(dy)<.002&&!gesture.moved)return;if(!gesture.moved){remember();gesture.moved=true;lastTextPointer=null;}
        const next=clone(e);if(next.type==='text'||next.type==='number'){next.x=clamp(e.x+dx);next.y=clamp(e.y+dy);}else next.points=e.points.map(([x,y])=>[clamp(x+dx),clamp(y+dy)]);state.annotation.elements[selected]=next;
      }else if(tool==='path'){const ps=gesture.shape.points,last=ps.at(-1);if(ps.length<5000&&Math.hypot(last[0]-p[0],last[1]-p[1])>.002)ps.push(p);}else gesture.shape.points[1]=p;
      // Redraw only the image while the pointer moves; keep focus in the toolbar.
      stage.querySelector('.markup-objects').innerHTML=M.svg(state.annotation,{editable:tool==='select',selected,extra:gesture.shape?[gesture.shape]:[]});
    });
    const end=()=>{if(!gesture)return;const shape=gesture.shape;gesture=null;if(shape&&shape.points.some(p=>Math.hypot(shape.points[0][0]-p[0],shape.points[0][1]-p[1])>.002))add(shape);else paint();};
    stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',()=>{gesture=null;paint();});stage.addEventListener('dblclick',()=>{if(tool==='route'){finishRoute();paint();status('线路已完成，可继续添加下一条。');}});
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.hasAttribute('data-markup-inline-save')){if(finishInline())viewport.focus({preventScroll:true});return;}
      if(button.hasAttribute('data-markup-inline-cancel')){finishInline(false);viewport.focus({preventScroll:true});return;}
      if(button.hasAttribute('data-markup-cancel')){dialog.close();return;}
      if(!finishInline())return;
      if(button.hasAttribute('data-markup-tool')){setTool(button.dataset.markupTool);return;}
      if(button.hasAttribute('data-markup-finish-route')){finishRoute();paint();status('线路已完成，可继续添加下一条。');return;}
      if(button.hasAttribute('data-pick-markup')){select(Number(button.dataset.pickMarkup));return;}
      if(button.hasAttribute('data-markup-zoom')){const action=button.dataset.markupZoom;zoom=action==='fit'?1:action==='actual'?state.annotation.width/baseWidth:Math.max(.5,Math.min(20,zoom*(action==='in'?1.4:1/1.4)));resize();return;}
      if(button.hasAttribute('data-markup-undo')){if(pendingRoute.length){pendingRoute.pop();paint();return;}if(undo.length){redo.push(clone(state.annotation));state.annotation=undo.pop();selected=-1;resetNumber();paint();}return;}
      if(button.hasAttribute('data-markup-redo')){if(redo.length){undo.push(clone(state.annotation));state.annotation=redo.pop();selected=-1;resetNumber();paint();}return;}
      if(button.hasAttribute('data-markup-delete')){if(selected>=0){remember();state.annotation.elements.splice(selected,1);selected=-1;paint();}return;}
      if(button.hasAttribute('data-markup-clear')){finishRoute();if(state.annotation.elements.length){remember();state.annotation.elements=[];selected=-1;resetNumber();paint();}return;}
      if(button.hasAttribute('data-markup-edit-text')){if(state.annotation.elements[selected]?.type==='text')beginInline(selected);return;}
      if(button.hasAttribute('data-markup-apply')){finishRoute();try{const annotation=M.validate(state.annotation);state.onApply(annotation);dialog.close();}catch(e){status(e.message);}}
    });
    dialog.addEventListener('input',event=>{if(!event.target.matches('[data-markup-number]')||state?.annotation.elements[selected]?.type!=='number')return;const e=state.annotation.elements[selected],n=Number(event.target.value);if(Number.isInteger(n)&&n>=1&&n<=99&&n!==e.number){remember();e.number=n;paint();}});
    dialog.addEventListener('change',event=>{if(selected<0)return;const e=state.annotation.elements[selected];if(event.target.matches('[data-markup-number]')&&e.type==='number'){const n=Number(event.target.value);if(!Number.isInteger(n)||n<1||n>99){event.target.value=e.number;status('编号范围为 1—99。');return;}if(n!==e.number){remember();e.number=n;paint();}return;}if(event.target.matches('[data-markup-color],[data-markup-width],[data-markup-size],[data-markup-number-size]')){remember();e.color=color();e.width=width();if(e.type==='text')e.size=textSize();if(e.type==='number')e.size=Number(dialog.querySelector('[data-markup-number-size]').value);paint();}});
    dialog.addEventListener('keydown',event=>{if(event.target.matches('input,textarea,select'))return;if(event.key==='Enter'&&pendingRoute.length){event.preventDefault();finishRoute();paint();}else if(event.key==='Delete'&&selected>=0){event.preventDefault();dialog.querySelector('[data-markup-delete]').click();}else if(event.key==='Escape'&&pendingRoute.length){event.preventDefault();pendingRoute=[];paint();}else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();dialog.querySelector(event.shiftKey?'[data-markup-redo]':'[data-markup-undo]').click();}else if(event.target.matches('[data-markup-element]')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();select(Number(event.target.dataset.markupElement));}});
    dialog.addEventListener('keydown',event=>{if(selected<0||event.target.matches('input,textarea,select'))return;const e=state.annotation.elements[selected];if(event.key==='F2'&&e.type==='text'){event.preventDefault();beginInline(selected);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const points=M.anchors(e),delta=event.shiftKey?.05:.01;let dx=event.key==='ArrowLeft'?-delta:event.key==='ArrowRight'?delta:0,dy=event.key==='ArrowUp'?-delta:event.key==='ArrowDown'?delta:0;dx=Math.max(-Math.min(...points.map(p=>p[0])),Math.min(dx,1-Math.max(...points.map(p=>p[0]))));dy=Math.max(-Math.min(...points.map(p=>p[1])),Math.min(dy,1-Math.max(...points.map(p=>p[1]))));remember();if(e.type==='text'||e.type==='number'){e.x=clamp(e.x+dx);e.y=clamp(e.y+dy);}else e.points=e.points.map(([x,y])=>[clamp(x+dx),clamp(y+dy)]);paint();dialog.querySelector(`[data-pick-markup="${selected}"]`)?.focus({preventScroll:true});});
    dialog.addEventListener('close',()=>{inline?.box.remove();inline=null;lastTextPointer=null;state=null;gesture=null;pendingRoute=[];returnFocus?.focus({preventScroll:true});});window.addEventListener('resize',()=>{if(dialog.open)resize();});
  }
  async function open({src,title,annotation,onApply,trigger,isCurrent}){
    ensure();const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('图片加载失败，请检查图片是否还在原位置。'));image.src=src;});
    if(isCurrent&&!isCurrent())return;
    state={annotation:annotation?M.validate(annotation):{version:1,width:image.naturalWidth,height:image.naturalHeight,elements:[]},onApply};
    undo=[];redo=[];selected=-1;gesture=null;pendingRoute=[];inline=null;lastTextPointer=null;zoom=1;returnFocus=trigger;stage.querySelector('img').src=src;dialog.querySelector('[data-markup-title]').textContent=title;resetNumber();dialog.showModal();resize();setTool('arrow');dialog.querySelector('[data-markup-tool="arrow"]').focus();
  }
  window.ImageMarkupEditor={open};
})();

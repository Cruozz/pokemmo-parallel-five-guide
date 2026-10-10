// Build an editable Unova catalogue from the existing local guide assets.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);
for(const file of ['data.js','detail-guides.js','route-guides.js','step-visuals.js','map-notes.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const data=context.window.guideData, refs=new Map();
for(const phase of data.phases.filter(p=>p.region==='unova'))for(const step of data.stepVisuals[phase.id])for(const ref of step.maps)if(!data.atlas[ref.id].preAnnotated && !refs.has(ref.id))refs.set(ref.id,ref.title.split(' · ')[0]);
const maps=[...refs].map(([id,title])=>{const a=data.atlas[id];return {id,title,category:/Town|City/.test(a.file)?'城镇':/Gym/.test(a.file)?'道馆':/Route/.test(a.file)?'道路':'其他区域',src:'../'+a.src,width:a.width,height:a.height,source:a.source,markers:[],steps:[],paths:[]};});
const find=id=>maps.find(m=>m.id===id), media=[
 {id:'school-interior',src:'assets/striaton-school-interior.png',title:'学校内部全图',caption:'黑／白共用学校内部地形图。进入学校后与黑连对话并对战；可替换为自己的 PokeMMO 实景截图。'},
 {id:'school-entry',src:'../assets/docx/image9.png',title:'学校入口实景',caption:'原文 PokeMMO 截图：这是学校入口外景。'},
 {id:'gym-entry',src:'../assets/docx/image10.png',title:'道馆入口内景',caption:'原文 PokeMMO 截图：进入三曜道馆后领取美味水。'},
 {id:'fennel',src:'../assets/docx/image11.png',title:'研究所内与真菰对话',caption:'原文 PokeMMO 截图：上楼与真菰交谈。'},
 {id:'dreamyard',src:'../assets/docx/image12.png',title:'梦之遗迹剧情实景',caption:'原文 PokeMMO 截图：梦之遗迹中的梦娜剧情。'}
];
for(const mapId of ['nuvema-town-spring-bw','unova-route-2-spring-bw']){
 const map=find(mapId);map.markers=data.mapNotes[mapId].points.map(p=>({id:mapId+'-'+p.id,label:p.label.split('：')[0].replace('必打','训练家'),kind:p.kind,x:p.x,y:p.y}));
 map.steps=data.mapNotes[mapId].points.map((p,i)=>({id:mapId+'-step-'+p.id,markerId:map.markers[i].id,title:p.label.split('：').pop(),action:p.detail,mediaId:'',interiorMap:''}));
}
const city=find('striaton-city-spring-bw');city.title='三曜市';
city.markers=[{id:'school',label:'三曜学校',kind:'battle',x:52.1,y:35.5,labelSide:'bottom'},{id:'gym',label:'三曜道馆',kind:'goal',x:71.2,y:34,labelSide:'top'},{id:'lab',label:'真菰研究所',kind:'item',x:76.2,y:40.5,labelSide:'bottom'},{id:'dreamyard-exit',label:'梦之遗迹入口',kind:'exit',x:92.5,y:20,labelSide:'top'}];
city.steps=[
 {id:'city-school',markerId:'school',title:'与黑连对战',action:'先进入 PC 左侧的学校，与黑连对话并完成对战。完成后出门，去 PC 右侧的三曜道馆。',mediaId:'school-interior',interiorMap:'striaton-school-interior'},
 {id:'city-gym',markerId:'gym',title:'完成第一馆挑战',action:'进入 PC 右侧的三曜道馆。门口领取美味水，完成馆内机关和馆主挑战。',mediaId:'gym-entry',interiorMap:'striaton-gym-bw'},
 {id:'city-lab-first',markerId:'lab',title:'上楼领取居合斩',action:'馆后跟随真菰，从最右侧房屋的北侧入口进入，上楼领取居合斩。然后出门向东北去梦之遗迹。',mediaId:'fennel',interiorMap:''},
 {id:'city-dreamyard',markerId:'dreamyard-exit',title:'完成等离子团剧情',action:'从东北侧出口进入梦之遗迹，用居合斩开路，完成梦娜与等离子团事件。之后返回真菰研究所。',mediaId:'dreamyard',interiorMap:'dreamyard-ruins-spring-bw'},
 {id:'city-lab-return',markerId:'lab',title:'返回研究所交接',action:'回到刚才的研究所，上楼与真菰交接梦之遗迹剧情。完成后离开，从城市西北侧前往 3 号路。',mediaId:'fennel',interiorMap:''}
];
find('striaton-gym-bw').title='三曜道馆';find('dreamyard-ruins-spring-bw').title='梦之遗迹';
const schoolSource=JSON.parse(fs.readFileSync(path.join(root,'interactive-map/assets/school-source.json'),'utf8'));
maps.push({id:'striaton-school-interior',title:'三曜学校内部',category:'室内',src:'assets/striaton-school-interior.png',width:256,height:256,source:schoolSource.descriptionurl,markers:[],steps:[],paths:[]});
const region=data.regions.find(r=>r.id==='unova'), [width,height]=region.ratio.split('/').map(Number), cities=new Map();
for(const phase of data.phases.filter(p=>p.region==='unova'))for(const p of phase.route){const target=maps.find(m=>m.category==='城镇' && m.title.startsWith(p.name));if(target&&!cities.has(p.name))cities.set(p.name,{id:'town-'+target.id,label:p.name,x:p.x,y:p.y,kind:'exit',targetMap:target.id});}
maps.unshift({id:'unova-overview',title:'合众总览',category:'总览',src:'../'+region.map,width,height,source:'https://pokemmo.info/maps',markers:[...cities.values()],steps:[],paths:[]});
const preferred=['unova-overview','striaton-city-spring-bw','striaton-school-interior','striaton-gym-bw','dreamyard-ruins-spring-bw','nuvema-town-spring-bw','unova-route-2-spring-bw'];maps.sort((a,b)=>(preferred.includes(a.id)?preferred.indexOf(a.id):999)-(preferred.includes(b.id)?preferred.indexOf(b.id):999));
const demo={version:1,title:'合众路线地图模板',initialMap:city.id,maps,media,completed:[]};
fs.writeFileSync(path.join(root,'interactive-map/demo-data.js'),'// Local example assets; only curated maps contain authored steps.\nwindow.MAP_TEMPLATE_DATA = '+JSON.stringify(demo,null,2)+';\n');
console.log(`模板地图库：${maps.length} 张地图，${city.steps.length} 个三曜市步骤，${cities.size} 个总览城市入口。`);

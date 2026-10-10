const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),C=require('../interactive-map/core.js'),context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'interactive-map/demo-data.js'),'utf8'),context);
const project=C.validate(context.window.MAP_TEMPLATE_DATA),city=project.maps.find(m=>m.id==='striaton-city-spring-bw');
assert.equal(project.maps.length,52);assert.equal(city.markers.length,4);assert.equal(city.steps.length,5);
assert.equal(city.steps[2].markerId,city.steps[4].markerId,'Return trip must reuse the research building');
assert.equal(city.steps[0].mediaId,'school-interior','An entrance photo must not be labelled as an interior battle');
assert.equal(city.steps[0].interiorMap,'striaton-school-interior');
for(const item of [...project.maps,...project.media]){
 const file=path.resolve(root,'interactive-map',item.src);assert.ok(file.startsWith(root+path.sep)&&fs.existsSync(file),`Missing or escaped asset: ${item.src}`);
 if(item.width&&file.endsWith('.png')){const bytes=fs.readFileSync(file);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),item.width);assert.equal(bytes.readUInt32BE(20),item.height);}
}
const school=project.maps.find(m=>m.id==='striaton-school-interior');assert.equal(school.width,256);assert.equal(school.height,256);
// Reordering must keep location and image associations, including repeated visits.
const returnId=city.steps[4].id;assert.ok(C.reorder(city,returnId,-1));assert.equal(city.steps[3].id,returnId);assert.equal(city.steps[3].markerId,city.steps[2].markerId);
const added=C.addMarker(city,62.5,43);added.title='领取补给';added.action='先检查补给，再出发';added.mediaId='school-entry';
const repeated=C.revisit(city,added.id);C.removeStep(city,added.id);assert.ok(city.markers.some(p=>p.id===repeated.markerId),'Removing one visit must retain the shared location');C.removeStep(city,repeated.id);assert.ok(!city.markers.some(p=>p.id===repeated.markerId),'Last removed visit must not leave an orphan marker');
assert.doesNotThrow(()=>C.validate(JSON.parse(JSON.stringify(project))));
const wrong=C.clone(project);wrong.maps[1].src='javascript:alert(1)';assert.throws(()=>C.validate(wrong));
const missing=C.clone(project);missing.maps.find(m=>m.id===city.id).steps[0].markerId='missing';assert.throws(()=>C.validate(missing));
const outside=C.clone(project);outside.maps.find(m=>m.id===city.id).markers[0].x=101;assert.throws(()=>C.validate(outside));
const escaped=C.clone(project);escaped.media[0].src='../assets/../../private.png';assert.throws(()=>C.validate(escaped));
const progress=C.clone(project);progress.completed=['foreign-step',city.steps[0].id];assert.deepEqual(C.validate(progress).completed,[city.steps[0].id]);
assert.ok(!C.asset('https://example.com/picture.png'));assert.ok(C.asset('data:image/png;base64,aGVsbG8='));
console.log('通过：52 张模板地图、内部图关联、重复到访、顺序修改、删除保留共享地点、备份校验及本地素材尺寸。');

// Offline integrity checks for route coordinates, step links, and local assets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
for (const file of ['data.js', 'detail-guides.js', 'docx-screenshots.js', 'route-guides.js', 'key-shots.js', 'route-plans.js', 'step-visuals.js', 'map-notes.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const data = context.window.guideData;
assert.equal(data.phases.length, 26);
assert.equal(new Set(data.phases.map(p => p.id)).size, 26);
assert.deepEqual(Array.from(data.phases, p => p.order).sort((a,b) => a-b), Array.from({length:26}, (_,i) => i+1));
const cityPositions = new Map();
const localAsset = src => assert.ok(fs.existsSync(path.join(root, src)), `Missing asset: ${src}`);
for (const region of data.regions) { localAsset(region.map); assert.ok(data.travelPorts[region.id]); }
let stepCount = 0;
let shotCount = 0;
for (const phase of data.phases) {
  const items = data.detailGuides[phase.id];
  const plan = data.routePlans[phase.id];
  assert.ok(items?.length && plan?.start && plan.finish && plan.arrival, `Incomplete phase ${phase.id}`);
  stepCount += items.length;
  const visuals = data.stepVisuals[phase.id];
  assert.equal(visuals?.length, items.length, `Illustration coverage: ${phase.id}`);
  visuals.forEach((visual, index) => {
    assert.ok(visual.maps.length, `No full map: ${phase.id}/${index}`);
    assert.equal(new Set(visual.maps.map(ref => ref.id)).size, visual.maps.length, `Duplicate map: ${phase.id}/${index}`);
    for (const ref of visual.maps) {
      assert.ok(data.atlas[ref.id] && ref.title, `Broken map reference: ${phase.id}/${index}/${ref.id}`);
    }
    for (const shot of visual.shots) {
      localAsset(shot.src);
      assert.ok((data.docxScreenshots[phase.id] || []).includes(shot.src), `Wrong screenshot phase: ${phase.id}/${shot.src}`);
      assert.ok(shot.kind && shot.caption);
      shotCount++;
    }
  });
  for (const key of plan.sources) assert.ok(data.contentSources[key], `Missing source ${key}`);
  const usedPositions = new Set();
  for (const point of phase.route) {
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100, `Invalid position: ${phase.id}/${point.name}`);
    const position = `${point.x},${point.y}`;
    assert.ok(!usedPositions.has(position), `Overlapping markers: ${phase.id}/${point.name}`);
    usedPositions.add(position);
    const key = `${phase.region}/${point.name}`;
    if (cityPositions.has(key)) assert.equal(position, cityPositions.get(key), `Inconsistent city ${key}`);
    cityPositions.set(key, position);
    assert.ok(point.guideIndices.length);
    for (const index of point.guideIndices) assert.ok(Number.isInteger(index) && items[index], `Broken step link: ${phase.id}/${point.name}/${index}`);
  }
  for (const src of data.docxScreenshots[phase.id] || []) localAsset(src);
  for (const [index, shots] of Object.entries(data.keyShots[phase.id] || {})) {
    assert.ok(items[index], `Key shot index changed: ${phase.id}/${index}`);
    for (const shot of shots) localAsset(shot.src);
  }
  for (const guide of data.routeGuides[phase.id] || []) for (const map of guide.maps) localAsset(map.src);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/atlas/manifest.json'), 'utf8'));
for (const map of Object.values(data.atlas)) {
  localAsset(map.src);
  assert.ok(map.width > 0 && map.height > 0 && /^https:\/\//.test(map.source), `Incomplete map metadata: ${map.id}`);
}
for (const map of Object.values(manifest)) {
  assert.equal(data.atlas[map.id].src, map.src);
  const bytes = fs.readFileSync(path.join(root, map.src));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `Not a PNG: ${map.src}`);
  assert.equal(bytes.readUInt32BE(16), map.width, `Wrong width: ${map.id}`);
  assert.equal(bytes.readUInt32BE(20), map.height, `Wrong height: ${map.id}`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), map.sha256, `Map bytes changed: ${map.id}`);
}
const coordinate = value => Number.isFinite(value) && value >= 0 && value <= 100;
for (const [id, note] of Object.entries(data.mapNotes)) {
  assert.ok(data.atlas[id], `Annotation without map: ${id}`);
  assert.equal(new Set(note.points.map(point => point.id)).size, note.points.length, `Duplicate annotation: ${id}`);
  for (const point of note.points) {
    assert.ok(coordinate(point.x) && coordinate(point.y), `Invalid annotation: ${id}/${point.id}`);
    for (const key of ['labelX', 'labelY']) if (point[key] !== undefined) assert.ok(coordinate(point[key]), `Invalid label: ${id}/${point.id}`);
    assert.ok(point.label && point.detail && ['entry','exit','story','heal','item','goal','battle','switch'].includes(point.kind));
  }
  for (const route of note.paths || []) {
    assert.ok(route.points.length >= 2);
    for (const [x,y] of route.points) assert.ok(coordinate(x) && coordinate(y), `Invalid path: ${id}`);
  }
}
for (const [phaseId, steps] of Object.entries(data.stepMapNotes || {})) {
  for (const [index, maps] of Object.entries(steps)) {
    assert.ok(data.detailGuides[phaseId]?.[index], `Annotation without step: ${phaseId}/${index}`);
    for (const [id, note] of Object.entries(maps)) {
      assert.ok(data.stepVisuals[phaseId][index].maps.some(ref => ref.id === id), `Scoped annotation without map: ${phaseId}/${index}/${id}`);
      assert.equal(new Set(note.points.map(point => point.id)).size, note.points.length, `Duplicate scoped annotation: ${phaseId}/${index}/${id}`);
      for (const point of note.points) {
        const original = data.mapNotes[id].points.find(candidate => candidate.id === point.id);
        assert.deepEqual(point, original, `Place changed between steps: ${phaseId}/${index}/${id}/${point.id}`);
      }
    }
  }
}
// Building regions were checked against the user's corrected map, not nearby apartments.
const cityId = 'striaton-city-spring-bw';
const cityPoints = data.mapNotes[cityId].points;
assert.equal(cityPoints.length, 4);
const cityRegions = [
  [50,55,32,38,/学校/], [69,74,30,38,/道馆/],
  [74,79,44,55,/研究所/], [90,99,17,24,/梦之遗迹/]
];
cityPoints.forEach((point, index) => {
  const [left,right,top,bottom,label] = cityRegions[index];
  assert.equal(point.id, String(index + 1));
  assert.ok(point.x >= left && point.x <= right && point.y >= top && point.y <= bottom, `Wrong Striaton building: ${point.label}`);
  assert.match(point.label, label);
});
assert.deepEqual(Array.from(data.mapNotes['nuvema-town-spring-bw'].points, point => point.label.split('：')[0]), ['玩家家','白露家','博士实验室','1 号路']);
const route2 = data.mapNotes['unova-route-2-spring-bw'].points;
assert.equal(route2.length, 2);
assert.ok(route2.every(point => point.kind === 'battle' && point.label.startsWith('必打')));
assert.match(route2[0].detail, /NPC 4/);
assert.match(route2[1].detail, /NPC 5/);
const cityScopes = [[3,['1']], [4,['2']], [5,['3','4']]];
for (const [index, ids] of cityScopes) assert.deepEqual(Array.from(data.stepMapNotes.u1[index][cityId].points, point => point.id), ids);
assert.match(data.detailGuides.u1[3].place, /学校/);
assert.ok(!data.stepVisuals.u1[3].maps.some(ref => /dreamyard/.test(ref.id)), 'Optional pre-gym visit returned to main route');
assert.ok(!data.stepVisuals.u1[3].shots.some(shot => shot.src === 'assets/docx/image8.png'));
assert.ok(data.docxScreenshots.u1.includes('assets/docx/image8.png'), 'Original reference screenshot must remain');
assert.match(data.routePlans.u1.requirements.join(' '), /研究所领取，再去梦之遗迹/);
// Verify the shared renderer exposes actions and removes the old generic paragraph.
context.document = { addEventListener() {} };
context.window.addEventListener = () => {};
vm.runInContext(fs.readFileSync(path.join(root, 'step-visual-renderer.js'), 'utf8'), context);
for (const phase of data.phases) {
  data.stepVisuals[phase.id].forEach((visual, index) => {
    const html = context.window.guideVisuals.renderStep(phase, index);
    assert.doesNotMatch(html, /对照本步的剧情顺序寻找入口|未标注的支路与训练家不代表/);
    for (const ref of visual.maps) {
      const note = data.stepMapNotes?.[phase.id]?.[index]?.[ref.id] || data.mapNotes[ref.id];
      for (const point of note?.points || []) {
        assert.ok(html.includes(point.label) && html.includes(point.detail), `Node action hidden: ${phase.id}/${index}/${ref.id}/${point.id}`);
        assert.match(html, /<ol class="atlas-landmarks" aria-label="地图节点动作顺序">/);
      }
    }
  });
}
// The complete Icirrus example must retain six trainers and three switches.
assert.equal(data.mapNotes['icirrus-gym-bw'].points.filter(point => point.kind === 'battle').length, 6);
assert.equal(data.mapNotes['icirrus-gym-bw'].points.filter(point => point.kind === 'switch').length, 3);
assert.ok(data.mapNotes['icirrus-city-spring-bw'].paths.length);
assert.equal(data.mapNotes['community-u5-0'].walkthrough.length, 3);
// Regressions found during the content review.
assert.equal(data.phases.find(p => p.id === 'j3').cap, '39 → 46');
assert.match(data.detailGuides.h1[10].place, /第六馆/);
assert.match(data.detailGuides.k3[2].action, /挑战金黄道馆/);
assert.match(data.detailGuides.j2[2].action, /领取飞翔/);
assert.match(data.detailGuides.h4[0].action, /攀瀑/);
assert.match(data.detailGuides.s5[0].action, /攀瀑/);
assert.match(data.detailGuides.h1[7].place, /烟囱山/);
assert.match(data.detailGuides.u1[6].place, /山洞/);
assert.deepEqual(Array.from(data.phases.find(p => p.id === 'j6').route, p => p.name), ['若叶镇']);
assert.equal(cityPositions.get('kanto/红莲岛'), '22.7,91.7');
assert.equal(cityPositions.get('kanto/真新镇'), '22.7,74.7');
assert.equal(cityPositions.get('hoenn/釜炎镇'), '20,27.5');
assert.equal(cityPositions.get('hoenn/茵郁市'), '42,12.5');
assert.equal(stepCount, 132);
console.log(`通过：26 个阶段、${stepCount} 步均有全图、${shotCount} 张场景图、${Object.keys(manifest).length} 张新增地图；本地资源、图片尺寸、校验值和标记关联完整。`);

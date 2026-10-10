// Verify the exported content without opening or modifying the desktop profile.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const core=require('../guide-edit-core.js');
const root=path.resolve(__dirname,'..');
const context={window:{}};vm.createContext(context);
for(const file of ['data.js','detail-guides.js','docx-screenshots.js','route-guides.js','key-shots.js','route-plans.js','step-visuals.js','map-notes.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const info=JSON.parse(fs.readFileSync(path.join(root,'backups/latest-info.json'),'utf8'));
assert.ok(/^[^/\\]+\.json$/.test(info.file));
const latest=fs.readFileSync(path.join(root,'backups/latest.json'));
assert.deepEqual(latest,fs.readFileSync(path.join(root,'backups',info.file)));
assert.equal(crypto.createHash('sha256').update(latest).digest('hex'),info.sha256);
const base=context.window.guideData,project=core.validate(JSON.parse(latest.toString('utf8').replace(/^\uFEFF/,'')),base);
assert.equal(project.phases.length,info.phases);
assert.equal(project.phases.reduce((n,p)=>n+p.steps.length,0),info.steps);
const resume=project.phases.find(p=>p.id===info.resume.phaseId);
assert.equal(resume.title,info.resume.phaseTitle);
assert.equal(base.phases.find(p=>p.id===resume.id).order,info.resume.phaseOrder);
for(const phase of project.phases)for(const step of phase.steps){
  for(const image of step.shots)if(!image.src.startsWith('data:'))assert.ok(fs.existsSync(path.join(root,decodeURIComponent(image.src))),image.src);
}
const applied=core.clone(base);core.apply(project,applied,base);
for(const phase of project.phases){
  assert.deepEqual(applied.detailGuides[phase.id].map(s=>s.id),phase.steps.map(s=>s.id));
  for(const node of applied.phases.find(p=>p.id===phase.id).route){
    assert.equal(node.summary,core.nodeSummary(phase,node.name));
    assert.deepEqual(node.guideIndices,phase.steps.flatMap((s,index)=>s.locations.includes(node.name)?[index]:[]));
  }
}
console.log(`通过：已导出的 ${info.phases} 阶段 / ${info.steps} 步备份、日期副本和 SHA256 校验、摘要与图片关联，以及第 ${info.resume.phaseOrder} 阶段“${resume.title}”的接续入口。`);

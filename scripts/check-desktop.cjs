// Package integrity and async close/save protocol. This is not a GUI click test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const record = JSON.parse(fs.readFileSync(path.join(root,'release','平行五通攻略-build.json'),'utf8').replace(/^\uFEFF/,''));
const exe = fs.readFileSync(path.join(root,'release','平行五通攻略.exe'));
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256(exe),record.exeSha256);
assert.equal(exe.toString('ascii',0,2),'MZ');
const pe = exe.readUInt32LE(0x3c);
assert.equal(exe.toString('ascii',pe,pe+4),'PE\0\0');
assert.equal(exe.readUInt16LE(pe+4),0x8664,'Expected Windows x64');
assert.equal(exe.readUInt16LE(pe+24+68),2,'Expected GUI subsystem, without a console');
assert.equal(record.assetFiles,688);
assert.equal(record.files.length,record.bundleFiles);
const entries = new Set(record.files.map(file=>file.path));
assert.equal(entries.size,record.files.length);
for(const name of ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll']) assert.ok(entries.has('runtime/'+name));
for(const file of record.files)assert.ok(!/\.git\/|interactive-map\/|\.build\//.test(file.path));
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))(?:\?[^" ]*)?"/g)) assert.ok(entries.has('site/'+match[1]),`Not packaged: ${match[1]}`);
const extractionRecord = path.join(root,'desktop-app','.build','extracted-content-path.txt');
if(fs.existsSync(extractionRecord)){
  const extracted=fs.readFileSync(extractionRecord,'utf8').replace(/^\uFEFF/,'').trim();
  for(const file of record.files){const bytes=fs.readFileSync(path.join(extracted,file.path));assert.equal(bytes.length,file.bytes);assert.equal(sha256(bytes),file.sha256,file.path);}
}
const bridgeSource = fs.readFileSync(path.join(root,'desktop-app','desktop-bridge.js'),'utf8');
async function checkBridge(){
  let handler;
  const messages=[];
  const editor={ready:Promise.resolve(),flush:async()=>true};
  const context={window:{guideEditor:editor,chrome:{webview:{addEventListener:(name,fn)=>{assert.equal(name,'message');handler=fn;},postMessage:value=>messages.push(value)}}}};
  vm.createContext(context);vm.runInContext(bridgeSource,context);
  await handler({data:{type:'unrelated',request:'ignored'}});assert.equal(messages.length,0);
  let completeSave, notifyStarted;
  const started=new Promise(resolve=>notifyStarted=resolve);
  editor.flush=()=>{notifyStarted();return new Promise(resolve=>completeSave=resolve);};
  const pending=handler({data:{type:'save-before-close',request:'first'}});
  await started;assert.equal(messages.length,0,'Must wait until saving completes');
  completeSave(true);await pending;
  assert.equal(messages[0].type,'save-complete');assert.equal(messages[0].request,'first');assert.equal(messages[0].ok,true);
  editor.flush=async()=>false;await handler({data:{type:'save-before-close',request:'quota-failure'}});assert.equal(messages.at(-1).ok,false);
  editor.flush=async()=>{throw new Error('storage failed');};await handler({data:{type:'save-before-close',request:'error'}});assert.equal(messages.at(-1).ok,false);
  delete context.window.guideEditor;await handler({data:{type:'save-before-close',request:'image-window'}});assert.equal(messages.at(-1).ok,true);
  console.log(`通过：x64 窗口程序、${record.bundleFiles} 个内置文件、688 个素材、解包文件校验与等待保存完成的关闭协议。`);
}
checkBridge().catch(error=>{console.error(error);process.exitCode=1;});

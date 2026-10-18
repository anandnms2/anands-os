import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';import {createRequire} from 'node:module';
const root='/home/claude/anands-os';let chromium;for(const b of [root+'/','/opt/npm-tools/node_modules/']){try{chromium=createRequire(b)('playwright').chromium;break}catch{}}
const data=fs.mkdtempSync(path.join(os.tmpdir(),'aos-s-')),port=31000+Math.floor(Math.random()*9000),B=`http://127.0.0.1:${port}`;
const {start,EMAIL,PASSWORD}=await import(root+'/test/fixtures/fake-joplin.mjs');await start(port+1);
const srv=spawn('node',['server/index.js'],{cwd:root,stdio:'ignore',env:{...process.env,PORT:String(port),DATA_DIR:data,SUITE_DIR:root+'/test/fixtures/suite',APP_PASSWORD:'pw'}});
for(let i=0;i<50;i++){try{if((await fetch(B+'/healthz')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
const br=await chromium.launch({args:['--no-sandbox']});const ctx=await br.newContext({viewport:{width:1280,height:800}});
await ctx.request.post(B+'/auth/password',{data:{password:'pw'},headers:{'x-aos':'1'}});
await ctx.request.put(B+'/api/settings',{data:{joplin:{url:'http://127.0.0.1:'+(port+1),email:EMAIL,pass:PASSWORD}},headers:{'x-aos':'1'}});
const p=await ctx.newPage();await p.goto(B+'/#notes');await p.waitForTimeout(2000);
const fr=p.frames().find(f=>/notes/.test(f.url())&&f!==p.mainFrame())||p.mainFrame();
await fr.locator('.nt-item').nth(1).click();await p.waitForTimeout(800);await p.screenshot({path:'/tmp/n3.png'});
const q=await ctx.newPage();await q.setViewportSize({width:900,height:600});await q.goto(B+'/tools/notes.html');await q.waitForTimeout(1500);await q.locator('.nt-item').nth(1).click();await q.waitForTimeout(800);await q.screenshot({path:'/tmp/n4.png'});
console.log(await q.evaluate(()=>[...document.querySelectorAll('#mn,#mmain,.nt-wrap,.nt-list,.nt-ed')].map(e=>e.className+' '+e.getBoundingClientRect().height).join('|')));
await br.close();srv.kill();process.exit(0);

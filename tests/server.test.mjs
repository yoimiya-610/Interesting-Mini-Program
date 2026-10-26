import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../scripts/serve.mjs';
function request(url,method='GET'){return new Promise((resolve,reject)=>{const req=http.request(url,{method},res=>{let text='';res.setEncoding('utf8');res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));});req.on('error',reject);req.end();});}
test('本地入口、001 和无效路由；私有文件不可访问',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const url of ['/','/apps/001-orbit-garden/']){const r=await request(base+url);assert.equal(r.status,200);assert.match(r.headers['content-type'],/text\/html/);assert.match(r.text,/<title>/);}
    for(const url of ['/missing','/programs.json','/package.json','/.git/config','/%2e%2e%5cpackage.json','/%E0%A4%A']){const r=await request(base+url);assert([400,403,404].includes(r.status),url);}
    const post=await request(base,'POST');assert.equal(post.status,405);
  }finally{await new Promise(r=>server.close(r));}
});

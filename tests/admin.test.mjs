import test from 'node:test';
import assert from 'node:assert/strict';
import { validateItem, decodeUpload, publishItem } from '../netlify/lib/content.mjs';

test('admin validates required content, unsafe references, dates and unknown collections',()=>{
  const item={id:'person',published:true,name:{ko:'연구원'},role:{ko:'연구원'}};
  assert.deepEqual(validateItem('members',item).name,{ko:'연구원',en:'연구원'});
  assert.throws(()=>validateItem('members',{...item,url:'javascript:alert(1)'}));
  assert.throws(()=>validateItem('members',{...item,image:'assets/../secrets'}));
  assert.throws(()=>validateItem('members',{...item,name:{ko:''}}));
  assert.throws(()=>validateItem('site',item));
  assert.throws(()=>validateItem('notices',{id:'n',published:true,title:{ko:'공지'},date:'2026-02-30',category:'notice',body:{ko:'본문'}}));
});
test('admin rejects disguised or oversized image uploads',()=>{
  assert.throws(()=>decodeUpload({type:'image/png',base64:Buffer.from('<script>bad</script>').toString('base64')}));
  assert.throws(()=>decodeUpload({type:'image/svg+xml',base64:'AAAA'}));
  assert.throws(()=>decodeUpload({type:'image/jpeg',base64:Buffer.alloc(2097153).toString('base64')}));
});
test('concurrent edits are rejected before any GitHub mutation',async()=>{
  let writes=0;const github=async(path,options)=>{if(options)writes++;if(path.startsWith('git/ref/'))return{object:{sha:'b'.repeat(40)}};return{content:Buffer.from('[]').toString('base64')};};
  await assert.rejects(()=>publishItem(github,{collection:'members',revision:'a'.repeat(40)}),error=>error.status===409);assert.equal(writes,0);
});
test('publishing writes image and JSON to one tree and updates main without force',async()=>{
  const revision='a'.repeat(40), calls=[];
  const github=async(path,options)=>{calls.push({path,options});
    if(path==='git/ref/heads/main')return{object:{sha:revision}};
    if(path.startsWith('contents/'))return{content:Buffer.from('[]').toString('base64')};
    if(path===`git/commits/${revision}`)return{tree:{sha:'tree0'}};
    return{sha:path==='git/commits'?'newcommit':'blobortree'};
  };
  const upload={type:'image/png',base64:Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]).toString('base64')};
  await publishItem(github,{collection:'gallery',revision,create:true,upload,item:{id:'g1',published:true,title:{ko:'활동'},alt:{ko:'사진'},date:'2026-10-13'}});
  const tree=calls.find(c=>c.path==='git/trees').options.body.tree;assert.equal(tree.length,2);assert.match(tree[0].content,/assets\/images\/uploads\//);
  assert.deepEqual(calls.at(-1),{path:'git/refs/heads/main',options:{method:'PATCH',body:{sha:'newcommit',force:false}}});
});


test('content endpoint rejects anonymous users, non-admins, cross-origin requests and preview writes', async()=>{
  const { createHandler } = await import('../netlify/functions/admin-content.mjs');
  const url='https://core.example/.netlify/functions/admin-content?collection=members';
  const invoke=async(user,method='GET',origin='https://core.example',context='production')=>createHandler({userForRequest:async()=>user,checkOrigin:()=>{},environment:{CONTEXT:context},request:()=>{throw new Error('Must not contact GitHub');}})(new Request(url,{method,headers:{origin}}));
  assert.equal((await invoke(null)).status,401);
  assert.equal((await invoke({roles:[]})).status,403);
  assert.equal((await invoke({roles:['admin']},'POST','https://evil.example')).status,403);
  assert.equal((await invoke({roles:['admin']},'POST','https://core.example','deploy-preview')).status,403);
  assert.equal((await invoke({roles:['admin']})).status,503);
});

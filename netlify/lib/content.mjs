import { randomUUID } from 'node:crypto';
export const collections = ['members', 'notices', 'gallery'];
export function fail(message, status = 400) { return Object.assign(new Error(message), { status }); }
const text = (value, required = false, max = 10000) => {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw fail('필수 항목과 글자 수를 확인해 주세요.');
  return value.trim();
};
const bilingual = (value, required = false) => {
  const ko = text(value?.ko, required), en = text(value?.en);
  return { ko, en: en || ko };
};
function reference(value) {
  const path = text(value, false, 1000);
  if (!path) return '';
  if (/^assets\/[a-zA-Z0-9_./-]+$/.test(path) && !path.split('/').includes('..')) return path;
  try { if (new URL(path).protocol === 'https:') return path; } catch {}
  throw fail('이미지와 링크는 assets 경로 또는 HTTPS 주소를 사용해 주세요.');
}
export function validateItem(collection, input) {
  if (!collections.includes(collection) || !input || typeof input !== 'object') throw fail('지원하지 않는 콘텐츠입니다.');
  const id = text(input.id, true, 100);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) throw fail('ID 형식이 올바르지 않습니다.');
  if (typeof input.published !== 'boolean') throw fail('공개 여부를 선택해 주세요.');
  const result = { id, published: input.published };
  if (collection === 'members') {
    for (const field of ['name', 'role', 'affiliation', 'bio']) result[field] = bilingual(input[field], ['name', 'role'].includes(field));
    result.image = reference(input.image); result.url = reference(input.url);
  } else {
    result.title = bilingual(input.title, true);
    result.date = text(input.date, true, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date) || !Number.isFinite(Date.parse(result.date)) || new Date(result.date).toISOString().slice(0,10) !== result.date) throw fail('날짜가 올바르지 않습니다.');
    if (collection === 'notices') {
      if (!['notice', 'event', 'press'].includes(input.category)) throw fail('공지 분류를 선택해 주세요.');
      result.category = input.category; result.pinned = input.pinned === true;
      result.summary = bilingual(input.summary); result.body = bilingual(input.body, true);
    } else {
      result.image = reference(input.image);
      if (!result.image) throw fail('갤러리 사진을 선택해 주세요.');
      result.alt = bilingual(input.alt, true); result.description = bilingual(input.description);
    }
  }
  // Empty optional bilingual values are omitted so the public data validator stays strict.
  for (const [key, value] of Object.entries(result)) if (value && typeof value === 'object' && !value.ko) delete result[key];
  return result;
}
export function decodeUpload(upload) {
  if (!upload) return null;
  if (!['image/png','image/jpeg','image/webp'].includes(upload.type) || typeof upload.base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(upload.base64)) throw fail('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
  const bytes = Buffer.from(upload.base64, 'base64');
  if (bytes.length > 2 * 1024 * 1024 || bytes.length < 12) throw fail('이미지는 2MB 이하로 선택해 주세요.');
  const valid = upload.type === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : upload.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!valid) throw fail('이미지 파일 형식이 올바르지 않습니다.');
  const extension = { 'image/png':'png','image/jpeg':'jpg','image/webp':'webp' }[upload.type];
  return { path:`assets/images/uploads/${randomUUID()}.${extension}`, content:bytes.toString('base64') };
}

export async function readCollection(github, collection) {
  if (!collections.includes(collection)) throw fail('지원하지 않는 콘텐츠입니다.');
  const head = await github('git/ref/heads/main');
  const revision = head.object.sha;
  const file = await github(`contents/data/${collection}.json?ref=${revision}`);
  return { revision, items: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) };
}

export async function publishItem(github, body) {
  const { collection, revision } = body;
  if (!collections.includes(collection) || !/^[a-f0-9]{40}$/.test(revision || '')) throw fail('목록을 새로 불러온 뒤 다시 시도해 주세요.');
  const current = await readCollection(github, collection);
  if (current.revision !== revision) throw fail('다른 변경이 먼저 저장되었습니다. 작성 내용은 유지됩니다. 목록을 새로 불러온 뒤 내용을 비교해 주세요.', 409);
  const upload = decodeUpload(body.upload);
  if (upload && collection === 'notices') throw fail('공지사항은 사진 업로드를 지원하지 않습니다.');
  const item = validateItem(collection, { ...body.item, ...(upload ? { image:upload.path } : {}) });
  const index = current.items.findIndex(row => row.id === item.id);
  if (body.create && index !== -1) throw fail('이미 사용 중인 ID입니다.', 409);
  if (!body.create && index === -1) throw fail('수정할 항목이 없습니다.', 409);
  if (index === -1) current.items.push(item); else current.items[index] = item;
  // Both the JSON record and its new image are published in one atomic commit.
  const base = await github(`git/commits/${revision}`);
  const tree = [{ path:`data/${collection}.json`, mode:'100644', type:'blob', content:JSON.stringify(current.items,null,2)+'\n' }];
  if (upload) {
    const blob = await github('git/blobs', { method:'POST', body:{ content:upload.content, encoding:'base64' } });
    tree.push({ path:upload.path, mode:'100644', type:'blob', sha:blob.sha });
  }
  const nextTree = await github('git/trees', { method:'POST', body:{ base_tree:base.tree.sha, tree } });
  const commit = await github('git/commits', { method:'POST', body:{ message:`Update ${collection}: ${item.id}`, tree:nextTree.sha, parents:[revision] } });
  await github('git/refs/heads/main', { method:'PATCH', body:{ sha:commit.sha, force:false } });
  return { revision:commit.sha, item, message:'저장되었습니다. 사이트 반영은 Netlify 배포 완료 후 확인해 주세요.' };
}

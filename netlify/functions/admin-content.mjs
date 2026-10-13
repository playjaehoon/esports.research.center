import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { fail, readCollection, publishItem } from '../lib/content.mjs';
const json = (body, status=200) => Response.json(body, { status, headers:{ 'Cache-Control':'no-store' } });
export function createHandler({ userForRequest = getUser, checkOrigin = verifyRequestOrigin, environment = process.env, request = fetch } = {}) {
return async function handler(req) {
  try {
    if (!['GET','POST'].includes(req.method)) return json({ error:'허용되지 않는 요청입니다.' },405);
    if (req.method === 'POST') {
      if (req.headers.get('origin') !== new URL(req.url).origin) return json({ error:'허용되지 않는 요청 출처입니다.' },403);
      checkOrigin(req);
    }
    const user = await userForRequest();
    if (!user) return json({ error:'로그인이 필요합니다.' },401);
    if (!user.roles?.includes('admin')) return json({ error:'관리자 권한이 필요합니다. 사이트 담당자에게 문의해 주세요.' },403);
    if (req.method === 'POST' && environment.CONTEXT !== 'production') return json({ error:'미리보기 환경에서는 게시할 수 없습니다.' },403);
    const token = environment.CMS_GITHUB_TOKEN;
    if (!token) return json({ error:'콘텐츠 저장 연결을 아직 설정하지 않았습니다.' },503);
    const github = async (path, options={}) => {
      const response = await request(`https://api.github.com/repos/playjaehoon/esports.research.center/${path}`, {
        method:options.method || 'GET', headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'Content-Type':'application/json' },
        body:options.body ? JSON.stringify(options.body) : undefined, signal:AbortSignal.timeout(15000)
      });
      if (!response.ok) throw fail(response.status === 422 || response.status === 409 ? '다른 변경과 충돌했습니다. 목록을 새로 불러와 주세요.' : '저장소 연결에 실패했습니다. 설정과 권한을 확인해 주세요.', [409,422].includes(response.status) ? 409 : 502);
      return response.json();
    };
    if (req.method === 'GET') return json(await readCollection(github, new URL(req.url).searchParams.get('collection')));
    if (!req.headers.get('content-type')?.startsWith('application/json')) return json({ error:'JSON 요청이 필요합니다.' },415);
    const raw = await req.text();
    if (raw.length > 3000000) return json({ error:'사진 또는 글의 크기가 너무 큽니다.' },413);
    let body; try { body=JSON.parse(raw); } catch { throw fail('요청 형식이 올바르지 않습니다.'); }
    return json(await publishItem(github, body));
  } catch (error) {
    return json({ error:error.status ? error.message : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' },error.status || 500);
  }
}

}
export default createHandler();

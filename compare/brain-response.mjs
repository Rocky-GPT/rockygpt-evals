// The Brain's reply (POST /v1/chat answers {answer, status, citations, ...}) as the text the grader
// reads, with the pages it cited listed under it, so a grader can tell a cited page from none.
export default function brainResponse(json) {
  const answer = String(json?.answer ?? '');
  const pages = (json?.citations ?? []).map(c => c?.url).filter(Boolean);
  return pages.length ? `${answer}\n\n[cited: ${pages.join(' ; ')}]` : answer;
}

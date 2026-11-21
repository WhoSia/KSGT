'use strict';

const { createHash } = require('node:crypto');
const { buildPlan: buildPreviousPlan } = require('./r931_scene_paragraphs_v01.cjs');
const { executePlan } = require('./r928_scope_and_prose_v01.cjs');
const { planReceipt } = require('./r929_global_writing_v01.cjs');
const { resolveProvider } = require('./provider_client_v01.cjs');
const drafts = require('./fixtures/r932_r931_replays_v01.json');

const sha = (value) => createHash('sha256').update(value).digest('hex');

function splitEnding(text) {
  const boundaries = [...text.matchAll(/[.!?。！？][ \t\n\r]+(?=\S)/gu)];
  const boundary = boundaries.at(-2);
  if (!boundary) throw new Error('NEED_AT_LEAST_THREE_SENTENCES');
  const index = boundary.index + boundary[0].length;
  return { prefix: text.slice(0, index), ending: text.slice(index) };
}

function buildPlan() {
  const sources = new Map(buildPreviousPlan().map((cell) => [cell.id, cell]));
  return drafts.flatMap((draft, index) => {
    const source = sources.get(draft.id);
    if (!source || sha(draft.text) !== draft.textSha256 ||
        draft.promptSha256 !== source.promptSha256) throw new Error('R931_INPUT_MISMATCH');
    const scene = JSON.parse(source.prompt[1].content);
    const { prefix, ending } = splitEnding(draft.text);
    const order = index % 2 ? ['suffix', 'whole'] : ['whole', 'suffix'];
    return order.map((condition) => {
      const suffix = condition === 'suffix';
      const system = '한국어 단편 장면을 편집한다. 어색한 문장을 바로잡고, 원천 사건의 순서와 행위자를 지킨다. 마지막 사건 뒤에 시선이나 의미를 해설하는 문장은 필요한 경우 덜어낸다. 원천에 없는 내용이나 행동을 넣지 않는다. 이미 자연스럽고 충실한 글은 그대로 둔다.';
      const instruction = suffix
        ? '바꿀 수 있는 범위는 마지막 두 문장뿐이다. 고친 마지막 부분만 출력한다. 수정할 필요가 없으면 editableEnding을 그대로 출력한다. 앞부분을 되풀이하지 않는다.'
        : '글 전체에서 필요한 부분을 고칠 수 있다. 완성한 글 전체만 출력한다. 수정할 필요가 없으면 draft를 그대로 출력한다.';
      const input = { scene, draft: draft.text, editableEnding: ending, instruction };
      const prompt = [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(input) }];
      return {
        id: `${draft.id.replace('R931', 'R932')}_${condition}`,
        sourceWork: source.sourceWork,
        condition,
        draftSha256: draft.textSha256,
        prefixSha256: sha(prefix),
        promptSha256: sha(JSON.stringify(prompt)),
        prompt,
      };
    });
  });
}

async function main([mode, directory]) {
  const plan = buildPlan();
  if (mode === '--plan' && !directory) {
    console.log(JSON.stringify(planReceipt(plan), null, 2));
    return;
  }
  if (mode !== '--execute' || !directory) throw new Error('USAGE: --plan | --execute NEW_DIR');
  resolveProvider('groq');
  const result = await executePlan(plan, directory);
  if (result.rows.some(({ outcome }) => outcome !== 'GENERATED')) process.exitCode = 1;
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { splitEnding, buildPlan };

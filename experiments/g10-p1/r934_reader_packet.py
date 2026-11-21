import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parent
CONDITIONS = {'direct', 'rich', 'guided'}
PRESENTATIONS = (('guided', 'direct'), ('direct', 'guided'),
                 ('guided', 'rich'), ('rich', 'guided'))


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def verified_results(plan_path, result_dir):
    plan = read_json(plan_path)
    summary = read_json(result_dir / 'summary.json')
    expected = {cell['id']: cell for cell in plan['cells']}
    expected_ids = set(expected)
    if len(expected_ids) != 36 or len(plan['cells']) != 36:
        raise ValueError('Expected 36 unique cells')
    if summary['planHash'] != plan['planHash']:
        raise ValueError('Run does not match plan')
    for suffix in ('.attempt.json', '.result.json'):
        observed = {p.name.removesuffix(suffix) for p in result_dir.glob('*' + suffix)}
        if observed != expected_ids:
            raise ValueError('Missing or extra receipts for ' + suffix)
    results = defaultdict(dict)
    for cell_id, cell in expected.items():
        attempt = read_json(result_dir / (cell_id + '.attempt.json'))
        result = read_json(result_dir / (cell_id + '.result.json'))
        if (attempt['id'] != cell_id or result['id'] != cell_id
                or attempt['planHash'] != plan['planHash']
                or attempt['promptSha256'] != cell['promptSha256']
                or result['promptSha256'] != cell['promptSha256']):
            raise ValueError('Receipt or prompt does not match plan: ' + cell_id)
        if (result['outcome'] != 'GENERATED' or result['finishReason'] != 'stop'
                or sha(result['text']) != result['textSha256']):
            raise ValueError('Incomplete or corrupted generation: ' + cell_id)
        work, arm = cell['sourceWork'], cell['condition']
        if result['sourceWork'] != work or result['condition'] != arm or arm in results[work]:
            raise ValueError('Changed or duplicate identity: ' + cell_id)
        results[work][arm] = result
    return results


def packets(works, results):
    if set(results) != {work['id'] for work in works}:
        raise ValueError('Results do not match cohort')
    if any(set(group) != CONDITIONS for group in results.values()):
        raise ValueError('The three arms are required for each work')
    for form in range(4):
        slots = Counter()
        cards = []
        for index, work in enumerate(works):
            a, b = PRESENTATIONS[(index + form) % 4]
            group = results[work['id']]
            slots[a, b] += 1
            reader = {k: work[k] for k in ('request', 'audience', 'question')}
            reader.update(A=group[a]['text'], B=group[b]['text'])
            key = {'work': work['id'], 'A': group[a]['id'],
                   'B': group[b]['id'], 'answer': work['key']}
            cards.append((reader, key))
        if any(slots[p] != 3 for p in PRESENTATIONS):
            raise ValueError('Unbalanced placements')
        random.Random(934 + form).shuffle(cards)
        yield form + 1, cards


def write_form(out, form, cards):
    markdown = [
        f'# 한국어 글 읽기 · {form}형',
        '제시된 상황과 글 두 편을 읽고, 각 글만으로 질문에 답할 수 있는지 살펴보세요. '
        '두 글의 답이 같다면 그대로 적어도 됩니다. 어느 글을 그대로 쓰거나 전달하고 싶은지도 골라 주세요.',
        '선택지는 A, B, 비슷함, 어느 쪽도 쓰기 어려움, 판단하기 어려움입니다. '
        '고치고 싶은 첫 대목이 있다면 글자나 문장을 짚고 이유를 적어 주세요.',
    ]
    key = []
    for number, (reader, record) in enumerate(cards, 1):
        markdown += [f'## {number}', reader['request'], '**독자** ' + reader['audience'],
                     '### 글 A', reader['A'], '### 글 B', reader['B'], '**읽기 질문** ' + reader['question'],
                     '- 글 A에서 읽은 답 / 알기 어려움',
                     '- 글 B에서 읽은 답 / 알기 어려움',
                     '- 선택과 가장 먼저 고칠 대목']
        key.append({'number': number, **record})
    (out / f'form-{form}.md').write_text('\n\n'.join(markdown) + '\n', encoding='utf-8')
    return key


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('plan', type=Path)
    parser.add_argument('results', type=Path)
    parser.add_argument('new_directory', type=Path)
    args = parser.parse_args()
    works = read_json(ROOT / 'fixtures' / 'r934_reader_cohort_v01.json')
    results = verified_results(args.plan, args.results)
    forms = list(packets(works, results))
    args.new_directory.mkdir(mode=0o700)
    reader_path = args.new_directory / 'reader'
    reader_path.mkdir(mode=0o700)
    keys = {form: write_form(reader_path, form, cards) for form, cards in forms}
    write_json(args.new_directory / 'investigator-key.json', keys)
    by_arm = defaultdict(Counter)
    for group in results.values():
        for arm, result in group.items():
            by_arm[arm]['texts'] += 1
            for field in ('prompt_tokens', 'completion_tokens'):
                by_arm[arm][field] += result['usage'][field]
    write_json(args.new_directory / 'generation-receipt.json', by_arm)


if __name__ == '__main__':
    main()

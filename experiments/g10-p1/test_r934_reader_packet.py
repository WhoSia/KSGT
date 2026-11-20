import tempfile
import unittest
from collections import Counter
from pathlib import Path

from r934_reader_packet import packets, read_json, write_form


class ReaderPacketTest(unittest.TestCase):
    def setUp(self):
        self.works = read_json(Path(__file__).parent / 'fixtures' / 'r934_reader_cohort_v01.json')
        self.arms = ('direct', 'rich', 'guided')
        self.candidates = {
            w['id']: {arm: {'text': f'본문 {i}', 'id': f"{w['id']}_{arm}"}
                      for i, arm in enumerate(self.arms)}
            for w in self.works
        }

    def test_each_work_has_four_distinct_comparison_orientations(self):
        seen = {w['id']: Counter() for w in self.works}
        for _, cards in packets(self.works, self.candidates):
            self.assertEqual(len(cards), 12)
            self.assertEqual(len({key['work'] for _, key in cards}), 12)
            for _, key in cards:
                order = tuple(key[label].rsplit('_', 1)[1] for label in 'AB')
                seen[key['work']][order] += 1
        expected = Counter([('guided', 'direct'), ('direct', 'guided'),
                            ('guided', 'rich'), ('rich', 'guided')])
        for counts in seen.values():
            self.assertEqual(counts, expected)

    def test_reader_file_keeps_texts_but_has_no_scoring_key_or_condition(self):
        with tempfile.TemporaryDirectory() as folder:
            form, cards = next(packets(self.works, self.candidates))
            key = write_form(Path(folder), form, cards)
            output = (Path(folder) / 'form-1.md').read_text()
            self.assertEqual(output.count('### 글 A'), 12)
            self.assertEqual(output.count('### 글 B'), 12)
            for row in key:
                self.assertNotIn(row['A'], output)
                self.assertNotIn(row['B'], output)
                self.assertNotIn(row['answer'], output)

    def test_missing_arm_rejected_before_packet_generation(self):
        del self.candidates[self.works[0]['id']]['guided']
        with self.assertRaisesRegex(ValueError, 'three arms'):
            next(packets(self.works, self.candidates))

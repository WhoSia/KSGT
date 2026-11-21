import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile

from r925_replay_paragraph_archives import paired_crossfamily, replay_archive


class ParagraphReplayTest(unittest.TestCase):
    def raw(self, folder, rows, members=("ksgt-groq-development.json",)):
        path = Path(folder) / "pilot.zip"
        with ZipFile(path, "w") as zipped:
            for member in members:
                zipped.writestr(member, json.dumps({"model": "example", "provider": "groq", "rows": rows}))
        return path

    def row(self, **overrides):
        return {"sourceWork": "W", "arm": "A", "promptSha256": "f" * 64,
                "outcome": "GENERATED", "text": "가\n\n나", "finishReason": "stop", **overrides}

    def test_raw_text_is_hashed_and_paragraphs_are_observed(self):
        with TemporaryDirectory() as folder:
            archive = replay_archive(self.raw(folder, [self.row()] * 5), "PILOT002")
        self.assertEqual(5, len(archive["rows"]))
        self.assertNotIn("text", archive["rows"][0])
        self.assertEqual(2, archive["rows"][0]["paragraphs_by_blank_line"])
        self.assertEqual(64, len(archive["rows"][0]["text_sha256"]))

    def test_failed_pilot_rows_have_no_text_or_paragraph_count(self):
        row = self.row(outcome="FAILED", text=None, finishReason=None, failureClass="PROVIDER_HTTP_404")
        with TemporaryDirectory() as folder:
            archive = replay_archive(self.raw(folder, [row] * 5), "PILOT001")
        self.assertTrue(all(item["text_sha256"] is None for item in archive["rows"]))
        self.assertTrue(all(item["paragraphs_by_blank_line"] is None for item in archive["rows"]))

    def test_empty_or_incomplete_success_is_rejected(self):
        with TemporaryDirectory() as folder:
            for row in [self.row(text=" "), self.row(finishReason="length")]:
                with self.assertRaisesRegex(ValueError, "missing completed prose"):
                    replay_archive(self.raw(folder, [row] * 5), "PILOT002")

    def test_ambiguous_raw_member_is_rejected(self):
        with TemporaryDirectory() as folder:
            duplicate = self.raw(folder, [self.row()] * 5,
                                 ("ksgt-groq-development.json", "crossfamily-private-raw.json"))
            with self.assertRaisesRegex(ValueError, "ambiguous"):
                replay_archive(duplicate, "PILOT002")

    def test_paired_repeats_report_prompt_and_text_identity_separately(self):
        a = {"model": "A", "work_label": "W", "arm": "1", "prompt_sha256": "p1", "text_sha256": "t1"}
        b = {**a, "text_sha256": "t2"}
        runs = [{"cohort": "CROSSFAM001", "rows": [a]}, {"cohort": "CROSSFAM002", "rows": [b]}]
        self.assertEqual({"paired_cells": 1, "same_prompt_sha256": 1,
                          "same_text_sha256_among_same_prompt": 0}, paired_crossfamily(runs))
        with self.assertRaisesRegex(ValueError, "paired uniquely"):
            paired_crossfamily([runs[0], {**runs[1], "rows": [b, b]}])


if __name__ == "__main__":
    unittest.main()

import unittest

from paired import report, tally


def row(qid, side, answer, passed):
    return {"provider": {"label": side}, "testCase": {"vars": {"id": qid, "area": "campus"}},
            "response": {"output": answer}, "success": passed}


class PairedGradesTest(unittest.TestCase):
    def test_an_identical_reply_with_conflicting_grades_cannot_move_either_score(self):
        results = [
            row("faculty", "old", "The same answer [1]", False),
            row("faculty", "new", "The same answer [1]", True),
            row("office", "old", "An unrelated office [1]", False),
            row("office", "new", "The requested office [2]", True),
        ]
        for ordered in (results, list(reversed(results))):
            summary = tally({"results": ordered}, "old", "new")
            self.assertEqual(summary["disputed"], ["faculty"])
            self.assertEqual(summary["areas"]["ALL"]["questions"], 1)
            self.assertEqual(summary["areas"]["ALL"]["only_new"], 1)
            self.assertIn("faculty", report(summary))

    def test_repeats_keep_their_votes_and_different_keys_and_citations_stay_separate(self):
        results = [
            row("a", "old", "Yes [1]", True),
            row("a", "old", "Yes [1]", True),
            row("a", "new", "Yes [1]", True),
            row("a", "new", "Yes [2]", False),
            row("b", "old", "Yes [1]", False),
            row("b", "new", "Yes [1]", False),
            row("unpaired", "old", "Yes [1]", True),
        ]
        summary = tally({"results": {"results": results}}, "old", "new")
        self.assertEqual(summary["disputed"], [])
        self.assertEqual(summary["missing"], ["unpaired"])
        self.assertEqual(summary["areas"]["ALL"]["only_old"], 1)
        self.assertEqual(summary["areas"]["ALL"]["neither"], 1)


if __name__ == "__main__":
    unittest.main()

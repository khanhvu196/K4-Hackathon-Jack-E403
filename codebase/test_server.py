import os
import unittest
from unittest.mock import patch

from codebase import server


class ServerTestCase(unittest.TestCase):
    def setUp(self):
        self.client = server.app.test_client()

    def test_index_is_served(self):
        response = self.client.get("/")
        self.addCleanup(response.close)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"VLearn Mindmap Prototype", response.data)

    def test_empty_content_is_rejected(self):
        response = self.client.post("/api/mindmap", json={"content": "  "})

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.get_json()["ok"])

    def test_real_pdf_slides_are_extracted(self):
        response = self.client.get("/api/slides")
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["document"]["filename"], "slide_4.pdf")
        self.assertEqual(payload["document"]["pages"], 26)
        self.assertFalse(payload["slides"][1]["has_text"])
        self.assertTrue(payload["slides"][4]["has_text"])
        self.assertGreater(len(payload["slides"][4]["text"]), 30)

    def test_real_pdf_is_served(self):
        response = self.client.get("/api/document")
        self.addCleanup(response.close)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/pdf")

    def test_real_pdf_page_image_is_rendered(self):
        response = self.client.get("/api/slide-image/5")
        self.addCleanup(response.close)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "image/png")
        self.assertGreater(len(response.data), 10_000)

    @patch.dict(os.environ, {}, clear=True)
    def test_missing_api_key_is_reported(self):
        response = self.client.post(
            "/api/mindmap",
            json={"content": "Nội dung đủ dài để tạo một mindmap kiểm thử."},
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn("GEMINI_API_KEY", response.get_json()["error"])

    @patch("codebase.server.write_trace")
    @patch("codebase.server.generate_mindmap")
    @patch("codebase.server.configured_provider", return_value="gemini")
    def test_valid_ai_output_is_returned(
        self,
        _provider_mock,
        generate_mock,
        trace_mock,
    ):
        generate_mock.return_value = """```mermaid
mindmap
  root((Machine Learning))
    (Supervised Learning)
      [Data requires labels]
      [Classification]
    (Unsupervised Learning)
      [Find hidden patterns]
```"""

        response = self.client.post(
            "/api/mindmap",
            json={"content": "Machine Learning gồm nhiều phương pháp học khác nhau."},
        )
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload["ok"])
        self.assertTrue(payload["mermaid"].startswith("mindmap"))
        self.assertEqual(payload["structure"]["center"], "Machine Learning")
        self.assertEqual(len(payload["structure"]["branches"]), 2)
        self.assertEqual(
            payload["structure"]["branches"][0]["leaves"],
            ["Data requires labels", "Classification"],
        )
        self.assertEqual(
            payload["structure"]["branches"][0]["nodes"],
            [
                {"label": "Data requires labels", "depth": 1},
                {"label": "Classification", "depth": 1},
            ],
        )
        trace_mock.assert_called_once()


if __name__ == "__main__":
    unittest.main()

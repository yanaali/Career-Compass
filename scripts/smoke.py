"""Exercise the running local stack without making any AI-provider calls.

Run after `docker compose up --build -d` with APP_USERNAME and APP_PASSWORD
exported. Only the random test records created by this script are deleted.
"""
import base64
import http.cookiejar
import json
import os
import time
import urllib.request
import uuid

base = os.getenv("COMPASS_API_URL", "http://localhost:8080")
username = os.getenv("APP_USERNAME", "compass")
password = os.environ["APP_PASSWORD"]
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
auth = "Basic " + base64.b64encode(f"{username}:{password}".encode()).decode()
csrf = {}


def request(path, method="GET", data=None, content_type="application/json"):
    headers = {"Authorization": auth}
    if method != "GET":
        headers.update(csrf)
    if data is not None:
        headers["Content-Type"] = content_type
        if not isinstance(data, bytes):
            data = json.dumps(data).encode()
    with opener.open(urllib.request.Request(base + path, data=data, headers=headers, method=method), timeout=30) as response:
        body = response.read()
        return json.loads(body) if body else None


for attempt in range(60):
    try:
        request("/actuator/health")
        break
    except Exception:
        if attempt == 59:
            raise
        time.sleep(2)

token = request("/api/applications/csrf")
csrf = {token["headerName"]: token["token"]}
application_id = str(uuid.uuid4())
document_id = None
text = b"Career Compass smoke test: Java and AWS experience."
try:
    request(f"/api/applications/{application_id}", "PUT", {
        "id": application_id, "company": "Smoke test", "role": "Engineer", "status": "Applied",
        "createdAt": "2020-01-01T00:00:00Z"
    })
    assert any(row["id"] == application_id for row in request("/api/applications"))
    boundary = "compass-" + uuid.uuid4().hex
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\nresume\r\n'
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="smoke.txt"\r\n'
            'Content-Type: text/plain\r\n\r\n').encode() + text + f"\r\n--{boundary}--\r\n".encode()
    document = request("/api/documents", "POST", body, f"multipart/form-data; boundary={boundary}")
    document_id = document["id"]
    assert any(row["id"] == document_id for row in request("/api/documents"))
    download = request(f"/api/documents/{document_id}/download")
    # Separate client: the signed URL needs no app credentials or session cookie.
    with urllib.request.urlopen(download["url"], timeout=30) as response:
        assert response.read() == text
    print("Application persistence, authenticated upload, S3 storage, and signed download passed.")
finally:
    if document_id:
        request(f"/api/documents/{document_id}", "DELETE")
        assert not any(row["id"] == document_id for row in request("/api/documents"))
    request(f"/api/applications/{application_id}", "DELETE")
    assert not any(row["id"] == application_id for row in request("/api/applications"))
print("Test-record cleanup passed.")

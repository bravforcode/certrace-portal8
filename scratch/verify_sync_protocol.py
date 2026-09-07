import urllib.request
import urllib.parse
import uuid
import json

SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmtLgdrSopZUGpUG69LHjYNq30OHdgqUpdPXGmv-KX7GEarQm0d5gORGKe-010pQ4S/exec'

class RedirectFollower(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return urllib.request.Request(newurl, headers={'User-Agent': 'Mozilla/5.0'})

opener = urllib.request.build_opener(RedirectFollower)

# 1. Test multipart/form-data (FormData in browser)
boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
fields = {
    'sheet': 'Newsletter',
    'email': 'multipart_test@certrace.co',
    'source': 'multipart_test'
}

parts = []
for k, v in fields.items():
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n')
parts.append(f'--{boundary}--\r\n')
body_mp = ''.join(parts).encode('utf-8')

print('--- Testing 1: multipart/form-data (Browser FormData) ---')
req_mp = urllib.request.Request(
    SCRIPT_URL,
    data=body_mp,
    headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'User-Agent': 'Mozilla/5.0'
    }
)
try:
    with opener.open(req_mp, timeout=25) as res:
        raw = res.read().decode('utf-8')
        print('Status:', res.status)
        print('Body:', raw[:300])
except Exception as e:
    print('Error:', e)

# 2. Test application/x-www-form-urlencoded
print('\n--- Testing 2: application/x-www-form-urlencoded ---')
body_urlenc = urllib.parse.urlencode({
    'sheet': 'Newsletter',
    'email': 'urlenc_test@certrace.co',
    'source': 'urlenc_test'
}).encode('utf-8')

req_enc = urllib.request.Request(
    SCRIPT_URL,
    data=body_urlenc,
    headers={
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
    }
)
try:
    with opener.open(req_enc, timeout=25) as res:
        raw = res.read().decode('utf-8')
        print('Status:', res.status)
        print('Body:', raw[:300])
except Exception as e:
    print('Error:', e)

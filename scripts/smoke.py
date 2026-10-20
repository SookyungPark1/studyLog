"""Integration smoke check. Requires running backend + MySQL; records today's completion."""
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = 'http://localhost:8080/api'
def request(path, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = Request(BASE + path, data=data, headers={'Content-Type': 'application/json'})
    with urlopen(req, timeout=10) as response:
        return json.load(response)

lesson = request('/lesson')
assert len(lesson['questions']) == 2
before = request('/progress')
try:
    request('/lessons/cafe-1/complete', {'answers': [0, 0]})
    raise AssertionError('Wrong answers were accepted')
except HTTPError as error:
    assert error.code == 400
assert request('/progress') == before
for _ in range(2):
    assert request('/lessons/cafe-1/complete', {'answers': [1, 2]})['completed']
after = request('/progress')
assert after['todayCompleted']
assert after['totalDays'] == before['totalDays'] + (0 if before['todayCompleted'] else 1)
assert after['week'][-1]['completed']
assert after['streak'] >= 1
print('PASS: lesson, invalid answers, MySQL completion, daily deduplication, progress')

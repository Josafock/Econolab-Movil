"""Execute the existing UI plan through Appium/ADB, never application internals."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

MODE = os.environ['VARIANT']
assert MODE in ['debug', 'release']
APP = 'com.econolab.mobile.qa'
OUT = Path('reports/native') / MODE
OUT.mkdir(parents=True, exist_ok=True)
SESSION = None
FIELD = None
RESULTS = []
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def adb(*args):
    return subprocess.run(['adb', '-s', os.environ.get('ANDROID_SERIAL', 'emulator-5554'), *args],
                          check=True, capture_output=True, timeout=60).stdout


def request(method, route, body=None):
    raw = None if body is None else json.dumps(body).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:4723' + route, data=raw, method=method,
                                 headers={'Content-Type': 'application/json'})
    try:
        with OPENER.open(req, timeout=120) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError('Appium rejected the requested UI action') from error
    value = result.get('value')
    if isinstance(value, dict) and value.get('error'):
        raise RuntimeError('Appium did not complete the UI action')
    return value


def command(method, route, body=None):
    return request(method, '/session/' + SESSION + route, body)


def expand(value):
    return re.sub(r'\$\{([A-Z_]+)\}', lambda match: os.environ[match.group(1)], str(value))


def bounds(node):
    values = re.findall(r'-?\d+', node.get('bounds', ''))
    return tuple(map(int, values)) if len(values) == 4 else (0, 0, 0, 0)


def nodes(selector):
    selector = {'text': selector} if isinstance(selector, str) else selector
    pattern = expand(selector.get('text', '.*'))
    tree = ET.fromstring(command('GET', '/source'))
    matches = []
    for node in tree.iter():
        if node.get('displayed', 'true') == 'false':
            continue
        left, top, right, bottom = bounds(node)
        if right <= left or bottom <= top or right <= 0 or bottom <= 0:
            continue
        if not any(re.fullmatch(pattern, node.get(attribute, ''), re.S) for attribute in ['text', 'content-desc']):
            continue
        if any(str(selector[key]).lower() != node.get(key, '').lower() for key in ['checked', 'enabled'] if key in selector):
            continue
        matches.append(node)
    if selector.get('below'):
        fields = [node for node in matches if node.get('class') == 'android.widget.EditText']
        if fields:
            matches = fields
    return sorted(matches, key=lambda node: (node.get('clickable') != 'true', bounds(node)[1]))


def wait_visible(selector, timeout=60):
    deadline = time.monotonic() + timeout
    while True:
        found = nodes(selector)
        if found:
            return found[0]
        if time.monotonic() >= deadline:
            raise AssertionError('Expected UI control is not visible: ' + str(selector))
        time.sleep(.6)


def scroll_visible(selector, direction, timeout):
    deadline = time.monotonic() + timeout
    while True:
        found = nodes(selector)
        if found:
            return found[0]
        if time.monotonic() >= deadline:
            raise AssertionError('Required UI control could not be scrolled into view: ' + str(selector))
        rect = command('GET', '/window/rect')
        x = int(rect['width'] * .5)
        first, last = (.76, .27) if direction == 'DOWN' else (.27, .76)
        adb('shell', 'input', 'swipe', str(x), str(int(rect['height'] * first)),
            str(x), str(int(rect['height'] * last)), '350')
        time.sleep(.4)


def screenshot(name):
    raw = adb('exec-out', 'screencap', '-p')
    if raw[:8] != b'\x89PNG\r\n\x1a\n' or len(raw) < 24 or raw[12:16] != b'IHDR':
        raise RuntimeError('Android did not return a valid PNG screenshot')
    (OUT / (name + '.png')).write_bytes(raw)


def tap(selector):
    global FIELD
    node = wait_visible(selector)
    label = node.get('content-desc')
    if node.get('class') == 'android.widget.EditText':
        if not label or '"' in label:
            raise RuntimeError('Cannot identify the native input safely')
        selector = {'using': 'xpath', 'value':
                    '//android.widget.EditText[@content-desc="' + label + '"]'}
    elif label:
        selector = {'using': 'accessibility id', 'value': label}
    else:
        selector = {'using': '-android uiautomator', 'value':
                    'new UiSelector().text(' + json.dumps(node.get('text', ''), ensure_ascii=False) + ')'}
    value = command('POST', '/element', selector)
    element = next(value[key] for key in value if key.startswith('element-'))
    command('POST', '/element/' + element + '/click', {})
    if node.get('class') == 'android.widget.EditText':
        FIELD = element


def execute(commands):
    for item in commands:
        name, value = (item, None) if isinstance(item, str) else next(iter(item.items()))
        if name == 'launchApp':
            if (value or {}).get('clearState'):
                adb('shell', 'am', 'force-stop', APP)
                adb('shell', 'pm', 'clear', APP)
            adb('shell', 'am', 'start', '-n', APP + '/.MainActivity')
        elif name == 'stopApp':
            adb('shell', 'am', 'force-stop', APP)
        elif name == 'extendedWaitUntil':
            wait_visible(value['visible'], value.get('timeout', 60000) / 1000)
        elif name == 'assertVisible':
            wait_visible(value)
        elif name == 'scrollUntilVisible':
            scroll_visible(value['element'], value.get('direction', 'DOWN'), value.get('timeout', 30000) / 1000)
        elif name == 'tapOn':
            tap(value)
        elif name == 'eraseText':
            if not FIELD:
                raise RuntimeError('No native field selected')
            command('POST', '/element/' + FIELD + '/clear', {})
        elif name == 'inputText':
            if not FIELD:
                raise RuntimeError('No native field selected')
            command('POST', '/element/' + FIELD + '/value', {'text': expand(value)})
        elif name == 'hideKeyboard':
            if command('GET', '/appium/device/is_keyboard_shown'):
                command('POST', '/appium/device/hide_keyboard', {})
        elif name == 'takeScreenshot':
            screenshot(expand(value))
        elif name == 'back':
            command('POST', '/back', {})
        elif name == 'setAirplaneMode':
            enabled = value == 'enabled'
            adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'enable' if enabled else 'disable')
            adb('shell', 'svc', 'wifi', 'disable' if enabled else 'enable')
            adb('shell', 'svc', 'data', 'disable' if enabled else 'enable')
            time.sleep(3)
        elif name == 'runFlow':
            if value.get('when', {}).get('visible') is None or nodes(value['when']['visible']):
                execute(value['commands'])
        else:
            raise RuntimeError('Unsupported UI command: ' + name)


def main():
    global SESSION
    deadline = time.monotonic() + 60
    while True:
        try:
            request('GET', '/status')
            break
        except (OSError, RuntimeError):
            if time.monotonic() >= deadline:
                raise RuntimeError('Appium server unavailable')
            time.sleep(1)
    result = request('POST', '/session', {'capabilities': {'alwaysMatch': {
        'platformName': 'Android', 'appium:automationName': 'UiAutomator2',
        'appium:deviceName': 'Android QA', 'appium:appPackage': APP,
        'appium:appActivity': '.MainActivity', 'appium:appWaitActivity': '*',
        'appium:autoLaunch': False, 'appium:noReset': True,
        'appium:newCommandTimeout': 240, 'appium:adbExecTimeout': 60000,
        'appium:uiautomator2ServerInstallTimeout': 120000,
    }}})
    SESSION = result['sessionId']
    try:
        for case in json.loads(Path('reports/native/blackbox-plan.json').read_text(encoding='utf-8')):
            start = time.monotonic()
            try:
                execute(case['commands'])
                RESULTS.append({'id': case['id'], 'name': case['name'], 'passed': True, 'seconds': time.monotonic() - start})
                print(MODE + ' ' + case['id'] + ' approved', flush=True)
            except Exception as error:
                RESULTS.append({'id': case['id'], 'name': case['name'], 'passed': False,
                                'seconds': time.monotonic() - start, 'error': type(error).__name__, 'detail': str(error)})
                try:
                    screenshot(case['id'] + '-fallo')
                    hierarchy = command('GET', '/source')
                    for key in ['SECURITY_QA_UI_PASSWORD', 'PASSWORD', 'JWT_SECRET', 'DATABASE_PASS']:
                        if os.environ.get(key):
                            hierarchy = hierarchy.replace(os.environ[key], '[REDACTED]')
                    (OUT / (case['id'] + '-fallo.xml')).write_text(hierarchy, encoding='utf-8')
                except Exception:
                    pass
                raise
    finally:
        request('DELETE', '/session/' + SESSION)


failed = False
try:
    main()
except Exception as error:
    failed = True
    if not RESULTS:
        RESULTS.append({'id': 'SETUP', 'name': 'Preparacion Android Appium', 'passed': False,
                        'seconds': 0, 'error': type(error).__name__, 'detail': str(error)})
    print(MODE + ' failed; inspect the sanitized evidence.', flush=True)
finally:
    result = {'tool': 'Appium 3 UiAutomator2', 'captureTool': 'adb exec-out screencap -p', 'variant': MODE, 'cases': RESULTS}
    text = json.dumps(result, ensure_ascii=False, indent=2)
    for key in ['SECURITY_QA_UI_PASSWORD', 'PASSWORD', 'JWT_SECRET', 'DATABASE_PASS']:
        if os.environ.get(key):
            text = text.replace(os.environ[key], '[REDACTED]')
    (OUT / 'results.json').write_text(text + '\n', encoding='utf-8')
    suite = ET.Element('testsuite', name='Appium caja negra ' + MODE, tests=str(len(RESULTS)),
                       failures=str(sum(not case['passed'] for case in RESULTS)))
    for case in RESULTS:
        node = ET.SubElement(suite, 'testcase', name=case['id'] + ' ' + case['name'], time=str(round(case['seconds'], 3)))
        if not case['passed']:
            ET.SubElement(node, 'failure', message=case.get('error', 'Failure'))
    ET.ElementTree(suite).write('reports/native/appium-' + MODE + '.xml', encoding='utf-8', xml_declaration=True)
raise SystemExit(1 if failed else 0)

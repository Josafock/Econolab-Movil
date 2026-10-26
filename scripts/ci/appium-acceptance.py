"""Acceptance on a compiled Android app and the disposable NestJS/PostgreSQL API.

Uses Appium's W3C HTTP API directly; no credentials or business data are exported.
"""
import base64
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

SERVER = "http://127.0.0.1:4723"
OUT = Path("reports/native/appium")
OUT.mkdir(parents=True, exist_ok=True)
SESSION = None
CASES = []


def request(method, route, body=None):
    raw = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(SERVER + route, data=raw, method=method,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        # Driver logs are retained separately and redacted before upload.
        raise RuntimeError("Appium rejected the requested action") from exc
    value = result.get("value")
    if isinstance(value, dict) and value.get("error"):
        raise RuntimeError("Appium did not complete the requested action")
    return value


def command(method, route, body=None):
    return request(method, f"/session/{SESSION}{route}", body)


def find(label, timeout=40, field=False):
    deadline = time.monotonic() + timeout
    while True:
        try:
            if field:
                value = command("POST", "/element", {"using": "xpath", "value":
                    f'//android.widget.EditText[@content-desc="{label}"]'})
            else:
                value = command("POST", "/element", {"using": "accessibility id", "value": label})
            return next(v for k, v in value.items() if k.startswith("element-"))
        except (RuntimeError, StopIteration):
            if time.monotonic() >= deadline:
                raise AssertionError(f"Required control is not available: {label}")
            time.sleep(1)


def click(label, timeout=40):
    command("POST", f"/element/{find(label, timeout)}/click", {})


def scroll_to(label):
    value = 'new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(12).scrollIntoView(new UiSelector().description(' + json.dumps(label, ensure_ascii=False) + '))'
    command("POST", "/element", {"using": "-android uiautomator", "value": value})


def type_text(label, value):
    element = find(label, field=True)
    command("POST", f"/element/{element}/click", {})
    command("POST", f"/element/{element}/value", {"text": value})


def screenshot(name):
    OUT.joinpath(name + ".png").write_bytes(base64.b64decode(command("GET", "/screenshot")))


def source_contains(text, timeout=40):
    deadline = time.monotonic() + timeout
    while text not in command("GET", "/source"):
        if time.monotonic() >= deadline:
            raise AssertionError(f"Expected screen text is not available: {text}")
        time.sleep(1)


def login_and_consent():
    source_contains("Bienvenido", 90)
    type_text("Correo electrónico", "native-debug@example.test")
    type_text("Contraseña", os.environ["SECURITY_QA_UI_PASSWORD"])
    try:
        command("POST", "/appium/device/hide_keyboard", {})
    except RuntimeError:
        pass  # A closed keyboard is already the requested state.
    click("Iniciar sesión")
    source_contains("Privacidad y mis datos", 90)
    label = "He leído y acepto el aviso de privacidad de mi cuenta"
    scroll_to(label)
    element = find(label)
    checked = command("GET", f"/element/{element}/attribute/checked")
    if str(checked).lower() != "false":
        raise AssertionError("Initial consent must be unchecked")
    screenshot("01-consentimiento-inicial")
    click(label)
    scroll_to("Guardar mis decisiones")
    click("Guardar mis decisiones")
    find("Estudios", 90)


def studies():
    click("Estudios")
    type_text("Buscar estudio", "Estudio QA")
    try:
        command("POST", "/appium/device/hide_keyboard", {})
    except RuntimeError:
        pass
    source_contains("Estudio QA seguro")
    screenshot("02-busqueda")
    value = 'new UiSelector().descriptionContains("Estudio QA seguro")'
    element = command("POST", "/element", {"using": "-android uiautomator", "value": value})
    key = next(v for k, v in element.items() if k.startswith("element-"))
    command("POST", f"/element/{key}/click", {})
    source_contains("Información del estudio")
    screenshot("03-detalle")
    command("POST", "/back", {})


def profile_and_logout():
    click("Perfil")
    source_contains("Mi perfil")
    screenshot("04-perfil")
    click("Inicio")
    scroll_to("Cerrar sesión")
    click("Cerrar sesión")
    click("Salir")
    source_contains("Bienvenido", 90)
    screenshot("05-sesion-cerrada")


def main():
    global SESSION
    deadline = time.monotonic() + 45
    while True:
        try:
            request("GET", "/status")
            break
        except (OSError, RuntimeError):
            if time.monotonic() >= deadline:
                raise RuntimeError("Appium server is unavailable")
            time.sleep(1)
    session = request("POST", "/session", {"capabilities": {"alwaysMatch": {
        "platformName": "Android", "appium:automationName": "UiAutomator2",
        "appium:deviceName": "Android QA", "appium:appPackage": "com.econolab.mobile.qa",
        "appium:appActivity": ".MainActivity", "appium:appWaitActivity": "*",
        "appium:noReset": False, "appium:newCommandTimeout": 180,
        "appium:adbExecTimeout": 60000, "appium:uiautomator2ServerInstallTimeout": 120000,
    }}})
    SESSION = session["sessionId"]
    try:
        for name, action in [("Login y consentimiento explícito", login_and_consent),
                             ("Búsqueda y detalle del estudio QA", studies),
                             ("Perfil y cierre de sesión", profile_and_logout)]:
            start = time.monotonic()
            try:
                action()
                CASES.append({"name": name, "passed": True, "seconds": time.monotonic() - start})
            except Exception as exc:
                CASES.append({"name": name, "passed": False, "seconds": time.monotonic() - start,
                              "error": type(exc).__name__})
                try:
                    screenshot("fallo")
                except Exception:
                    pass
                raise
    finally:
        request("DELETE", f"/session/{SESSION}")


if __name__ == "__main__":
    failed = False
    try:
        main()
    except Exception as failure:
        failed = True
        if not CASES:
            CASES.append({"name": "Preparación del dispositivo o Appium", "passed": False,
                          "seconds": 0, "error": type(failure).__name__})
        print("Acceptance did not pass; inspect the redacted report and driver logs.")
    finally:
        OUT.joinpath("results.json").write_text(json.dumps({"tool": "Appium 3 UiAutomator2", "scope": "Android QA with real isolated API", "cases": CASES}, ensure_ascii=False, indent=2), encoding="utf-8")
        suite = ET.Element("testsuite", name="Appium acceptance", tests=str(len(CASES)), failures=str(sum(not c["passed"] for c in CASES)))
        for case in CASES:
            element = ET.SubElement(suite, "testcase", name=case["name"], time=str(round(case["seconds"], 3)))
            if not case["passed"]:
                ET.SubElement(element, "failure", message=case.get("error", "Failure"))
        ET.ElementTree(suite).write(OUT / "junit.xml", encoding="utf-8", xml_declaration=True)
    raise SystemExit(1 if failed else 0)

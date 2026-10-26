"""Reject cached, absent or failed results for the live isolated TLS fixture."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

REQUIRED = {
    "validQaPinAcceptsTrustedServer",
    "issuerBackupAcceptsASecondCertificateFromTheQaCA",
    "wrongPinRejectsOtherwiseTrustedServer",
    "platformTrustDoesNotAcceptThePrivateQaCA",
    "hostnameVerificationRemainsRequired",
}


def verify(root):
    log = (root / "gradle.log").read_text(encoding="utf-8")
    markers = [line for line in log.splitlines() if line.startswith("> Task :app:testReleaseUnitTest")]
    if not markers or any(word in line for line in markers for word in
                          ["FROM-CACHE", "UP-TO-DATE", "NO-SOURCE", "SKIPPED", "FAILED"]):
        raise ValueError("Gradle no ejecutó las pruebas TLS del entorno actual.")
    suite = ET.parse(root / "test-results/testReleaseUnitTest/TEST-com.econolab.security.PinningTest.xml").getroot()
    if not REQUIRED.issubset({case.attrib.get("name") for case in suite.findall("testcase")}):
        raise ValueError("Faltan casos TLS obligatorios.")
    if int(suite.attrib.get("tests", 0)) < len(REQUIRED) or any(
            int(suite.attrib.get(key, 0)) != 0 for key in ["failures", "errors", "skipped"]):
        raise ValueError("Las pruebas TLS no aprobaron por completo.")
    started = datetime.fromisoformat((root / "tls-started-at.txt").read_text().strip().replace("Z", "+00:00"))
    executed = datetime.fromisoformat(suite.attrib["timestamp"].replace("Z", "+00:00"))
    if executed.tzinfo is None:
        executed = executed.replace(tzinfo=timezone.utc)
    if not started <= executed <= datetime.now(timezone.utc):
        raise ValueError("El JUnit TLS no pertenece a la ejecución actual.")
    result = {"passed": True, "tests": int(suite.attrib["tests"]), "cached": False,
              "startedAt": started.isoformat(), "executedAt": executed.isoformat(),
              "commit": os.environ.get("GITHUB_SHA"), "requiredCases": sorted(REQUIRED)}
    (root / "tls-verification.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("Pruebas TLS verificadas: cinco casos obligatorios y JUnit nuevo, sin caché.")


if __name__ == "__main__":
    try:
        verify(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("reports/native"))
    except (OSError, ValueError, KeyError, ET.ParseError) as error:
        print("::error::" + str(error), file=sys.stderr)
        raise SystemExit(1)

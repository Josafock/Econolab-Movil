const fs = require('node:fs');
const { Buffer } = require('node:buffer');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const tools = {
  maestro: { url: 'https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.11.0/maestro.zip',
    sha256: '5384593cb4e7a106489e75a821d157dd43f4e438df6bc308b72e82c685e1283a', bytes: 314886578 },
  jadx: { url: 'https://github.com/skylot/jadx/releases/download/v1.5.6/jadx-1.5.6.zip',
    sha256: '545ea2be9c242511bc145755cf4bda2485ade42966e096f8b4d3da2a230e8974', bytes: 72646741 },
};
async function digest(file) {
  const hash = createHash('sha256');
  for await (const bytes of fs.createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}
async function main() {
  const name = process.argv[2];
  const tool = tools[name];
  if (!tool) throw new Error('Choose maestro or jadx.');
  const directory = path.join(os.tmpdir(), 'econolab-verified-tools');
  fs.mkdirSync(directory, { recursive: true });
  const target = path.join(directory, name + '.zip');
  if (fs.existsSync(target) && await digest(target) === tool.sha256) {
    process.stdout.write(JSON.stringify({ tool: name, cached: true, sha256Verified: true }) + '\n');
    return;
  }
  const partial = target + '.part';
  for (let attempt = 1; attempt <= 3; attempt++) {
    // Fresh query avoids reusing an expired signed redirect. TLS verification stays enabled.
    const url = tool.url + '?ci=' + Date.now() + '-' + attempt;
    const response = spawnSync('curl', ['--ipv4', '--http1.1', '--proto', '=https', '--proto-redir', '=https',
      '--location', '--silent', '--show-error', '--connect-timeout', '15', '--max-time', '240',
      '--output', partial, '--write-out', '%{http_code}', url], { encoding: 'utf8', timeout: 250000, maxBuffer: 1024 * 1024 });
    const status = Number((response.stdout || '').trim());
    if (response.status === 0 && status === 200) {
      if (fs.statSync(partial).size !== tool.bytes || await digest(partial) !== tool.sha256) {
        throw new Error('Tool size or SHA-256 mismatch; refusing to execute it.');
      }
      fs.renameSync(partial, target);
      process.stdout.write(JSON.stringify({ tool: name, attempt, bytes: tool.bytes, sha256Verified: true }) + '\n');
      return;
    }
    let reason = 'network-or-service-error';
    if (fs.existsSync(partial)) {
      const buffer = Buffer.alloc(4096), descriptor = fs.openSync(partial, 'r');
      const length = fs.readSync(descriptor, buffer, 0, buffer.length, 0); fs.closeSync(descriptor);
      const body = buffer.subarray(0, length).toString('utf8');
      if (/JWT expired|Request has expired|ExpiredToken/i.test(body)) reason = 'expired-download-redirect';
      else if (/rate limit/i.test(body)) reason = 'rate-limit';
      else if (/blocked by policy|policy restriction/i.test(body)) throw new Error('Download explicitly blocked by network policy.');
      else if (/Forbidden|AccessDenied/i.test(body)) reason = 'download-forbidden';
    }
    process.stdout.write(JSON.stringify({ tool: name, attempt, httpStatus: status, curlExit: response.status, reason }) + '\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error('Could not download the verified official tool after three attempts.');
}
main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });

import test from 'node:test';
import assert from 'node:assert/strict';
import { safeExternalUrl } from '../src/lib/urls.ts';
import desktopSecurity from '../electron/src/security.ts';
const { isInternalUrl, safeExternalUrl: desktopUrl } = desktopSecurity;

test('external URLs allow web links and reject executable or credential-bearing schemes', () => {
  for (const validate of [safeExternalUrl, desktopUrl]) {
    assert.equal(validate('https://example.com/test'), 'https://example.com/test');
    for (const bad of ['javascript:alert(1)', 'file:///C:/Windows/System32/cmd.exe', 'data:text/html,test', 'ms-settings:privacy', 'https://user:password@example.com', 'not a URL']) assert.equal(validate(bad), undefined);
  }
});

test('desktop navigation requires the exact local application origin', () => {
  assert.equal(isInternalUrl('capacitor-electron://-/schedule', 'capacitor-electron'), true);
  for (const url of ['https://example.com/capacitor-electron', 'capacitor-electron://evil/schedule', 'http://localhost.evil.test', 'file:///tmp/app.html', 'capacitor-electron://user@-/']) assert.equal(isInternalUrl(url, 'capacitor-electron'), false);
});

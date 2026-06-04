import { getClientIp } from './request-client-ip';

describe('getClientIp', () => {
  it('usa o primeiro IP de X-Forwarded-For', () => {
    expect(
      getClientIp({
        headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
      }),
    ).toBe('203.0.113.1');
  });

  it('cai para req.ip', () => {
    expect(getClientIp({ ip: '127.0.0.1', headers: {} })).toBe('127.0.0.1');
  });

  it('retorna unknown sem IP', () => {
    expect(getClientIp({ headers: {} })).toBe('unknown');
  });
});

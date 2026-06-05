import { resolveNestLogLevels } from './log-level';

describe('resolveNestLogLevels', () => {
  it('default log inclui error, warn e log', () => {
    expect(resolveNestLogLevels(undefined)).toEqual(['error', 'warn', 'log']);
  });

  it('debug inclui debug', () => {
    expect(resolveNestLogLevels('debug')).toEqual([
      'error',
      'warn',
      'log',
      'debug',
    ]);
  });

  it('warn só inclui error e warn', () => {
    expect(resolveNestLogLevels('warn')).toEqual(['error', 'warn']);
  });

  it('valor inválido cai no default log', () => {
    expect(resolveNestLogLevels('invalid')).toEqual(['error', 'warn', 'log']);
  });
});

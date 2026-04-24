import { hashPassword, comparePassword } from '../../utils/hash';

describe('hashPassword / comparePassword', () => {
  it('gera hash diferente da senha original', async () => {
    const hash = await hashPassword('minha_senha');
    expect(hash).not.toBe('minha_senha');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('comparePassword retorna true para senha correta', async () => {
    const hash = await hashPassword('senha_correta');
    const result = await comparePassword('senha_correta', hash);
    expect(result).toBe(true);
  });

  it('comparePassword retorna false para senha errada', async () => {
    const hash = await hashPassword('senha_correta');
    const result = await comparePassword('senha_errada', hash);
    expect(result).toBe(false);
  });

  it('dois hashes da mesma senha são diferentes (salt)', async () => {
    const h1 = await hashPassword('mesma');
    const h2 = await hashPassword('mesma');
    expect(h1).not.toBe(h2);
  });
});

import { generateToken, verifyToken } from '../../utils/jwt';

process.env.JWT_SECRET = 'test_secret_unit';

describe('generateToken / verifyToken', () => {
  it('gera token e verifica com sucesso', () => {
    const token = generateToken('user-1', 'admin', 'org-1', 'clinica');
    const payload = verifyToken(token);

    expect(payload.userId).toBe('user-1');
    expect(payload.role).toBe('admin');
    expect(payload.organizationId).toBe('org-1');
    expect(payload.plan).toBe('clinica');
  });

  it('token sem plano tem plan=null', () => {
    const token = generateToken('user-2', 'admin', 'org-1', null);
    const payload = verifyToken(token);
    expect(payload.plan).toBeNull();
  });

  it('token para portal não tem plan', () => {
    const token = generateToken('client-1', 'client_portal', 'org-1', null, { clientId: 'pet-owner-1' });
    const payload = verifyToken(token);
    expect(payload.clientId).toBe('pet-owner-1');
  });

  it('lança erro com token inválido', () => {
    expect(() => verifyToken('token.invalido.mesmo')).toThrow();
  });

  it('lança erro com token expirado', () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign({ userId: 'x' }, 'test_secret_unit', { expiresIn: '-1s' });
    expect(() => verifyToken(expired)).toThrow();
  });
});

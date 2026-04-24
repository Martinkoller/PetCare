import { describe, it, expect } from 'vitest';

// Lógica de plano que será usada pelo frontend para esconder módulos
const PLAN_MODULES: Record<string, string[]> = {
  essencial: ['agenda', 'grooming', 'clients', 'pets', 'inventory', 'whatsapp'],
  hotel:     ['agenda', 'grooming', 'clients', 'pets', 'inventory', 'whatsapp', 'boarding', 'portal'],
  clinica:   ['agenda', 'grooming', 'clients', 'pets', 'inventory', 'whatsapp', 'boarding', 'portal', 'medical', 'hospitalization'],
};

function hasModule(plan: string, module: string): boolean {
  return (PLAN_MODULES[plan] ?? PLAN_MODULES['essencial']).includes(module);
}

describe('Lógica de módulos por plano', () => {
  describe('Plano Essencial', () => {
    it('tem acesso à agenda', () => expect(hasModule('essencial', 'agenda')).toBe(true));
    it('tem acesso a banho e tosa', () => expect(hasModule('essencial', 'grooming')).toBe(true));
    it('NÃO tem acesso à hospedagem', () => expect(hasModule('essencial', 'boarding')).toBe(false));
    it('NÃO tem acesso ao prontuário', () => expect(hasModule('essencial', 'medical')).toBe(false));
    it('NÃO tem acesso à internação', () => expect(hasModule('essencial', 'hospitalization')).toBe(false));
  });

  describe('Plano Hotel', () => {
    it('tem acesso à hospedagem', () => expect(hasModule('hotel', 'boarding')).toBe(true));
    it('tem acesso ao portal do tutor', () => expect(hasModule('hotel', 'portal')).toBe(true));
    it('NÃO tem acesso ao prontuário', () => expect(hasModule('hotel', 'medical')).toBe(false));
    it('NÃO tem acesso à internação', () => expect(hasModule('hotel', 'hospitalization')).toBe(false));
  });

  describe('Plano Clínica', () => {
    it('tem acesso ao prontuário', () => expect(hasModule('clinica', 'medical')).toBe(true));
    it('tem acesso à internação', () => expect(hasModule('clinica', 'hospitalization')).toBe(true));
    it('tem acesso a todos os outros módulos', () => {
      const all = PLAN_MODULES['clinica'];
      PLAN_MODULES['essencial'].forEach(m => expect(all).toContain(m));
    });
  });

  describe('Plano desconhecido', () => {
    it('cai no plano essencial por padrão', () => {
      expect(hasModule('premium_inexistente', 'boarding')).toBe(false);
      expect(hasModule('premium_inexistente', 'agenda')).toBe(true);
    });
  });
});

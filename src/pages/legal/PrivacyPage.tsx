export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Política de Privacidade</h1>
            <p className="text-slate-500 mt-2 text-sm">Última atualização: 17 de maio de 2026</p>
          </div>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">1. Responsável pelo Tratamento</h2>
            <p>
              A <strong>AgiliPet</strong> é responsável pelo tratamento dos dados pessoais coletados
              através deste sistema, nos termos da Lei Geral de Proteção de Dados Pessoais (Lei nº
              13.709/2018 — LGPD).
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">2. Dados Coletados</h2>
            <p>Coletamos os seguintes dados para a prestação do serviço:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome, e-mail, telefone e CPF do titular</li>
              <li>Dados do estabelecimento (nome, CNPJ, endereço)</li>
              <li>Informações de pets cadastrados</li>
              <li>Histórico de agendamentos e serviços</li>
              <li>Dados financeiros de vendas e pagamentos</li>
            </ul>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">3. Finalidade do Tratamento</h2>
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prestação dos serviços de gestão do estabelecimento</li>
              <li>Envio de notificações e lembretes de agendamentos</li>
              <li>Comunicações operacionais via e-mail e WhatsApp</li>
              <li>Cumprimento de obrigações legais</li>
              <li>Melhoria contínua da plataforma</li>
            </ul>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados a terceiros. Podemos compartilhá-los apenas com prestadores de
              serviço essenciais à operação da plataforma (infraestrutura em nuvem, envio de e-mails),
              sob acordos de confidencialidade e nas mesmas bases legais desta política.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">5. Retenção de Dados</h2>
            <p>
              Os dados são armazenados durante a vigência do contrato e pelo período mínimo exigido
              pela legislação fiscal e trabalhista aplicável. Após esse prazo, são anonimizados ou
              excluídos de forma segura.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">6. Seus Direitos</h2>
            <p>Nos termos da LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmar a existência e acessar seus dados</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portar seus dados para outro fornecedor</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato pelo e-mail{' '}
              <a href="mailto:privacidade@agilipet.com.br" className="text-orange-500 hover:underline">
                privacidade@agilipet.com.br
              </a>
              .
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">7. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
              acesso não autorizado, perda ou divulgação indevida, incluindo criptografia em trânsito
              (HTTPS/TLS) e controle de acesso por autenticação.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">8. Contato</h2>
            <p>
              Dúvidas sobre esta política? Fale com nosso Encarregado de Dados (DPO) pelo e-mail{' '}
              <a href="mailto:privacidade@agilipet.com.br" className="text-orange-500 hover:underline">
                privacidade@agilipet.com.br
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

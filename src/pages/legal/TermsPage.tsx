export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Termos de Uso e Condições Gerais</h1>
            <p className="text-slate-500 mt-2 text-sm">Última atualização: 17 de maio de 2026</p>
          </div>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta na plataforma <strong>AgiliPet</strong>, o usuário declara ter lido,
              compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com
              alguma disposição, não utilize o serviço.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">2. Descrição do Serviço</h2>
            <p>
              O AgiliPet é um sistema SaaS de gestão para petshops e clínicas veterinárias, oferecendo
              funcionalidades de agendamento, controle de clientes, financeiro, estoque, hospedagem e
              comunicação via WhatsApp.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">3. Período de Trial e Assinatura</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Novos usuários têm direito a <strong>15 dias gratuitos</strong> (trial) para
                avaliação da plataforma, sem necessidade de cartão de crédito.
              </li>
              <li>
                Após o trial, a continuidade do acesso está condicionada à contratação de um dos
                planos disponíveis (Essencial, Hotel ou Clínica).
              </li>
              <li>
                O não pagamento acarreta na suspensão do acesso sem exclusão imediata dos dados,
                que serão mantidos por 90 dias para possibilitar a reativação.
              </li>
            </ul>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">4. Responsabilidades do Usuário</h2>
            <p>O usuário é responsável por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manter suas credenciais de acesso em sigilo</li>
              <li>Garantir a veracidade dos dados cadastrados</li>
              <li>Utilizar o sistema de acordo com a legislação aplicável</li>
              <li>Obter consentimento dos seus clientes para comunicações via WhatsApp e e-mail</li>
              <li>Realizar backups regulares dos seus dados críticos</li>
            </ul>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">5. Limitação de Responsabilidade</h2>
            <p>
              O AgiliPet não se responsabiliza por perdas de dados decorrentes de falhas de
              infraestrutura fora de seu controle, uso indevido da plataforma ou ações de terceiros.
              Recomendamos que o usuário mantenha backups independentes de dados críticos.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, marca, código-fonte e interfaces do AgiliPet são propriedade exclusiva
              da empresa e protegidos pela legislação de propriedade intelectual. É vedada a
              reprodução, engenharia reversa ou redistribuição sem autorização expressa.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">7. Cancelamento</h2>
            <p>
              O usuário pode cancelar sua assinatura a qualquer momento. Após o cancelamento, o acesso
              permanece ativo até o fim do período já pago. Os dados serão mantidos por 30 dias e
              excluídos definitivamente após esse prazo, salvo obrigação legal de retenção.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">8. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de alterar estes Termos a qualquer momento, com notificação
              prévia por e-mail. A continuidade do uso após a notificação implica na aceitação dos
              novos termos.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">9. Foro</h2>
            <p>
              As partes elegem o foro da comarca de Chapecó/SC para dirimir quaisquer controvérsias
              decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className="space-y-4 text-slate-700 leading-relaxed">
            <h2 className="text-xl font-semibold text-slate-800">10. Contato</h2>
            <p>
              Para questões sobre estes Termos:{' '}
              <a href="mailto:contato@agilipet.com.br" className="text-orange-500 hover:underline">
                contato@agilipet.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

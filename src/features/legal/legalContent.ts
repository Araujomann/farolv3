import { PRIVACY_CONTACT } from "./legalConfig";

/**
 * Textos dos Termos de Uso e da Política de Privacidade.
 *
 * Ficam só em português: regem o uso no Brasil, sob a LGPD (Lei nº
 * 13.709/2018). Ao alterar qualquer texto, atualize `TERMS_VERSION` em
 * `legalConfig.ts` para que as contas aceitem a nova versão.
 */

export type LegalBlock =
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] };

export type LegalSection = {
    title: string;
    blocks: LegalBlock[];
};

export type LegalDocument = {
    title: string;
    intro: string;
    sections: LegalSection[];
};

const p = (text: string): LegalBlock => ({ type: "paragraph", text });
const list = (...items: string[]): LegalBlock => ({ type: "list", items });

const CONTROLLER =
    "Farol, projeto acadêmico (Trabalho de Conclusão de Curso) desenvolvido no Instituto Federal do Maranhão (IFMA), Campus Imperatriz";

const CONTACT_TEXT = PRIVACY_CONTACT
    ? `Para exercer seus direitos ou tirar dúvidas sobre seus dados, escreva para ${PRIVACY_CONTACT}.`
    : "Você pode exercer os principais direitos diretamente no aplicativo, em Perfil > Configurações > Privacidade e dados (exportar e excluir seus dados).";

export const TERMS_OF_USE: LegalDocument = {
    title: "Termos de Uso",
    intro: `Estes Termos regem o uso do aplicativo Farol, mantido pelo ${CONTROLLER}. Ao criar uma conta, você declara que leu e concorda com eles e com a Política de Privacidade.`,
    sections: [
        {
            title: "1. O que é o Farol",
            blocks: [
                p(
                    "O Farol é uma plataforma colaborativa para registrar e visualizar acidentes de trânsito em Imperatriz (MA). O mapa reúne relatos enviados pelos usuários, revisados por uma equipe de moderação, e dados abertos da Polícia Rodoviária Federal (PRF).",
                ),
            ],
        },
        {
            title: "2. Não é um serviço de emergência",
            blocks: [
                p(
                    "O Farol não aciona socorro nem substitui os serviços públicos. Em uma emergência, ligue para:",
                ),
                list(
                    "192: SAMU",
                    "193: Corpo de Bombeiros",
                    "190: Polícia Militar",
                    "191: Polícia Rodoviária Federal",
                ),
            ],
        },
        {
            title: "3. Sua conta",
            blocks: [
                list(
                    "Para criar uma conta, você deve ter 18 anos ou mais, ou contar com a autorização dos seus responsáveis legais.",
                    "Informe dados verdadeiros e mantenha sua senha em sigilo; você responde pelas ações feitas com a sua conta.",
                    "É preciso confirmar o e-mail para enviar relatos e interagir com eles.",
                ),
            ],
        },
        {
            title: "4. Uso permitido",
            blocks: [
                p("Ao usar o Farol, você se compromete a não:"),
                list(
                    "enviar relatos falsos, duplicados de propósito ou que não correspondam a acidentes de trânsito;",
                    "publicar conteúdo ofensivo, discriminatório, violento ou ilegal;",
                    "expor dados pessoais de terceiros, como nomes, documentos, placas legíveis ou rostos identificáveis em fotos;",
                    "tentar acessar contas de outras pessoas, sobrecarregar o serviço ou contornar suas medidas de segurança.",
                ),
            ],
        },
        {
            title: "5. Seus relatos e o que fica público",
            blocks: [
                list(
                    "Você é responsável pelo conteúdo que envia (relatos, fotos e comentários) e autoriza o Farol a exibi-lo no aplicativo para cumprir a finalidade do serviço.",
                    "Todo relato passa pela moderação, que pode aprová-lo, rejeitá-lo ou corrigir o título e a descrição. Relatos aprovados aparecem no mapa público sem o seu nome; comentários exibem o seu nome.",
                    "Você pode editar ou apagar um relato enquanto ele aguarda moderação. Depois da decisão, ele não pode mais ser alterado pelo autor.",
                ),
            ],
        },
        {
            title: "6. Moderação e suspensão",
            blocks: [
                p(
                    "A equipe de moderação pode remover conteúdo e suspender contas que descumpram estes Termos. As ações da equipe ficam registradas em auditoria.",
                ),
            ],
        },
        {
            title: "7. Limites do serviço",
            blocks: [
                list(
                    "As informações do mapa vêm de relatos de usuários e de dados oficiais que podem estar incompletos ou desatualizados. Use-as como apoio, não como fonte única para decisões.",
                    "O Farol é um projeto acadêmico hospedado em serviços gratuitos: pode ficar lento ou indisponível e pode ser encerrado.",
                ),
            ],
        },
        {
            title: "8. Encerramento da conta",
            blocks: [
                p(
                    "Você pode excluir sua conta a qualquer momento em Perfil > Configurações. O que acontece com seus dados está descrito na Política de Privacidade.",
                ),
            ],
        },
        {
            title: "9. Alterações e lei aplicável",
            blocks: [
                p(
                    "Estes Termos podem ser atualizados. Quando isso acontecer, o aplicativo pedirá que você leia e aceite a nova versão antes de continuar. Aplica-se a legislação brasileira.",
                ),
            ],
        },
    ],
};

export const PRIVACY_POLICY: LegalDocument = {
    title: "Política de Privacidade",
    intro: `Esta Política explica quais dados pessoais o Farol trata, para quê e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD). O controlador dos dados é o ${CONTROLLER}.`,
    sections: [
        {
            title: "1. Dados que tratamos",
            blocks: [
                list(
                    "Conta: nome, e-mail, senha (guardada apenas em forma cifrada, sem possibilidade de leitura), confirmação do e-mail e a versão destes textos que você aceitou, com a data.",
                    "Relatos: tipo de acidente, se houve vítima, condição do tempo, gravidade, descrição, data e hora, o ponto do acidente no mapa (latitude e longitude), fotos e legendas.",
                    "Interações: comentários e votos de confiança nos relatos.",
                    "Notificações: um identificador do aparelho para envio de notificações e o sistema (Android ou iOS), se você permitir notificações.",
                    "Dados técnicos: endereço IP e registros de acesso, usados para segurança.",
                ),
                p(
                    "A localização do seu aparelho é usada somente no próprio aparelho, para centralizar o mapa ao registrar um relato. O Farol não acompanha sua posição: só é enviado o ponto do acidente que você confirma.",
                ),
            ],
        },
        {
            title: "2. Para que usamos os dados",
            blocks: [
                list(
                    "Criar e manter sua conta e permitir o envio de relatos (execução do serviço que você contratou ao se cadastrar, art. 7º, V).",
                    "Exibir o mapa público de acidentes e apoiar a segurança viária na cidade (legítimo interesse, art. 7º, IX).",
                    "Moderar relatos, prevenir abusos, limitar tentativas de acesso e manter registros de auditoria (legítimo interesse e segurança, art. 7º, IX).",
                    "Enviar e-mails de confirmação de conta e de recuperação de senha (execução do serviço).",
                    "Enviar notificações de novos acidentes aprovados (consentimento dado pela permissão do aparelho, que você pode revogar a qualquer momento).",
                ),
                p("O Farol não vende dados e não os usa para publicidade."),
            ],
        },
        {
            title: "3. O que fica visível para outras pessoas",
            blocks: [
                list(
                    "Relatos aprovados aparecem no mapa público, com fotos e descrição, mas sem o seu nome.",
                    "Comentários exibem o seu nome.",
                    "Relatos pendentes ou rejeitados são vistos apenas por você e pela equipe de moderação.",
                    "A equipe de moderação vê o nome e o e-mail do autor de cada relato, para poder analisá-lo.",
                ),
            ],
        },
        {
            title: "4. Com quem compartilhamos",
            blocks: [
                p(
                    "Para funcionar, o Farol usa serviços de terceiros que tratam dados em nosso nome (operadores):",
                ),
                list(
                    "Render: servidores da API.",
                    "Neon: banco de dados.",
                    "Cloudinary: armazenamento das fotos dos relatos.",
                    "Brevo: envio de e-mails.",
                    "Expo: envio de notificações.",
                    "Mapbox: mapas e busca de endereços (recebe a área do mapa exibida e os termos buscados).",
                    "Vercel e Cloudflare: hospedagem do painel de moderação e rede.",
                ),
                p(
                    "Alguns desses serviços mantêm servidores fora do Brasil, principalmente nos Estados Unidos. A transferência internacional ocorre para a execução do serviço, conforme o art. 33 da LGPD.",
                ),
            ],
        },
        {
            title: "5. Por quanto tempo guardamos",
            blocks: [
                list(
                    "Dados da conta: enquanto a conta existir.",
                    "Sessões: expiram após 30 dias sem uso, ou quando você sai do aplicativo.",
                    "Códigos de confirmação de e-mail: 1 hora. Códigos de recuperação de senha: 5 minutos.",
                    "Ao excluir a conta, apagamos seus dados pessoais, comentários, fotos, votos e notificações. Relatos já enviados permanecem no mapa sem qualquer vínculo com você, porque fazem parte do registro coletivo de acidentes.",
                    "Contas da equipe de moderação com decisões registradas são anonimizadas em vez de apagadas, para preservar o histórico da moderação.",
                ),
            ],
        },
        {
            title: "6. Seus direitos",
            blocks: [
                p("Pela LGPD (art. 18), você pode:"),
                list(
                    "confirmar que tratamos seus dados e acessá-los: use Exportar meus dados em Perfil > Configurações > Privacidade e dados;",
                    "levar seus dados para outro serviço (portabilidade): a exportação gera um arquivo em formato JSON;",
                    "corrigir dados incompletos ou desatualizados: seu nome pode ser corrigido em Perfil > Configurações > Privacidade e dados;",
                    "excluir seus dados: use Excluir conta nas Configurações;",
                    "revogar o consentimento das notificações nas configurações do aparelho;",
                    "obter informações sobre o compartilhamento dos seus dados (seção 4);",
                    "apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).",
                ),
                p(CONTACT_TEXT),
            ],
        },
        {
            title: "7. Segurança",
            blocks: [
                p(
                    "A comunicação com o Farol é criptografada (HTTPS). Senhas e identificadores de sessão são guardados em forma cifrada, os códigos enviados por e-mail expiram e as ações da equipe de moderação ficam registradas. Nenhum sistema é totalmente imune a falhas; em caso de incidente relevante, os titulares afetados serão comunicados.",
                ),
            ],
        },
        {
            title: "8. Alterações desta Política",
            blocks: [
                p(
                    "Quando esta Política mudar, o aplicativo mostrará a nova versão e pedirá o seu aceite antes de continuar.",
                ),
            ],
        },
    ],
};

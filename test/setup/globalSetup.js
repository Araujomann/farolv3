/**
 * Fixa o fuso horário do processo para que datas e horários calculados no
 * fuso do aparelho sejam reproduzíveis em qualquer máquina ou runner de CI.
 * America/Sao_Paulo é o fuso de Imperatriz (MA), onde o app é usado.
 */
module.exports = async () => {
    process.env.TZ = "America/Sao_Paulo";
};

/**
 * Variáveis de ambiente fictícias usadas pelos testes. Nenhuma aponta para
 * um serviço real: as requisições HTTP são interceptadas antes da rede.
 */
process.env.EXPO_PUBLIC_API_URL = "http://api.farol.test";
process.env.EXPO_PUBLIC_MAPBOX_TOKEN = "pk.test-token";

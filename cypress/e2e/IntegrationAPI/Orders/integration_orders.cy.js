import { data } from '../../../fixtures/IntegrationAPI/Orders/integration_orders.json';
import { data as env_data } from '../../../fixtures/IntegrationAPI/integration-environment-data.json';
import { ENV_CONTEXT, STATUS_CODES, setSCHeaders } from '../../../support/Utility/common-utility';
const { clientId } = env_data[ENV_CONTEXT];

describe('Orders', () => {
  it('Retrieve Orders - [GET] /orders', () => {
    setSCHeaders(data.retrieveOrders, clientId);
    cy.api_request(data.retrieveOrders).verifyStatusCode(STATUS_CODES.OK).validateResponseBody(data.retrieveOrders);
  });
});

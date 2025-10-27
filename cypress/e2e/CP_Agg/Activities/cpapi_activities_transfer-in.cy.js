import { data } from '../../../fixtures/CP_Agg/Activities/cpapi_activities_transfer-in.json';
import { data as env_data } from '../../../fixtures/CP_Agg/cp-environment-data.json';
import { data as activities_data } from '../../../fixtures/CP_Agg/Activities/cpapi_activities.json';
import { ENV_CONTEXT, STATUS_CODES, setRequestApiUrl, setCpHeaders } from '../../../support/Utility/common-utility';
const { serviceEntityId } = env_data[ENV_CONTEXT];
let fiatId, cryptoId;

describe('Dashboard --> Transfer In Activity', () => {
  it('Retrieve activities for a Client by Transfer-In Type - [GET] /activities?_filter=type=in=(transfer-in)', () => {
    setCpHeaders(activities_data.retrieveActivitiesByTransferIn, serviceEntityId);
    const requestData = {
      ...activities_data.retrieveActivitiesByTransferIn,
      requestQS: {
        ...activities_data.retrieveActivitiesByTransferIn.requestQS,
        _pageSize: 500,
      },
    };
    cy.api_request(requestData)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        const body = response.body.data;
        fiatId = body.find(
          (item) =>
            item.referenceNumber.startsWith('CMR-') && item.assetClass === 'cash' && item.amount.assetSymbol === 'USD'
        )?.id;
        cryptoId = body.find(
          (item) => item.referenceNumber.startsWith('CMR-') && item.assetClass === 'cryptocurrency'
        )?.id;
      });
  });

  it('Retrieve fiat transfer-in activity by Id - [GET] /activities/transfer-in/fiat/{id}', () => {
    setCpHeaders(data.retrieveFiatTransferInById, serviceEntityId);
    setRequestApiUrl(data.retrieveFiatTransferInById, '{id}', fiatId);

    cy.api_request(data.retrieveFiatTransferInById)
      .verifyStatusCode(STATUS_CODES.OK)
      .verifyResponseSchema(data.retrieveFiatTransferInById);
  });

  it('Retrieve crypto transfer-in activity by Id - [GET] /activities/transfer-in/crypto/{id}', () => {
    setCpHeaders(data.retrieveCryptoTransferInById, serviceEntityId);
    setRequestApiUrl(data.retrieveCryptoTransferInById, '{id}', cryptoId);

    cy.api_request(data.retrieveCryptoTransferInById)
      .verifyStatusCode(STATUS_CODES.OK)
      .verifyResponseSchema(data.retrieveCryptoTransferInById);
  });

  context('Forbidden Validation - 403', () => {
    it('Expect Forbidden Error without ServiceEntity ID - [GET] /activities/transfer-in/crypto/{id}', () => {
      cy.verifyForbiddenApiRequest(data.retrieveCryptoTransferInById);
    });

    it('Expect Forbidden Error without ServiceEntity ID - [GET] /activities/transfer-in/fiat/{id}', () => {
      cy.verifyForbiddenApiRequest(data.retrieveFiatTransferInById);
    });
  });
});

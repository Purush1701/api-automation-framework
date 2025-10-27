import { data } from '../../../fixtures/PartnerAPI/AMS/partner-Transactions.json';
import { ENV_CONTEXT, STATUS_CODES, setRequestApiUrl } from '../../../support/Utility/common-utility';

describe('Retrieve Transactions', () => {
  it('Retrieve list of Transactions by assetaccountId - [GET] /ams/transactions?aaId={id}', () => {
    const { assetAccountId } = data.retrieveListoftransactions_aaId[ENV_CONTEXT].responseBody;
    data.retrieveListoftransactions_aaId.requestQS.aaId = assetAccountId;
    cy.api_request(data.retrieveListoftransactions_aaId)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        response.body.results.forEach((item) => {
          if (data.retrieveListoftransactions_aaId[ENV_CONTEXT].responseBody.id === item.id) {
            expect(item).to.deep.eq(data.retrieveListoftransactions_aaId[ENV_CONTEXT].responseBody);
          }
        });
      });
  });

  it('Retrieve Transactions details by Id - [GET] /ams/transactions/{Id}', () => {
    setRequestApiUrl(
      data.retrieveTransactionDetails,
      '{Id}',
      data.retrieveTransactionDetails[ENV_CONTEXT].responseBody.id
    );
    cy.api_request(data.retrieveTransactionDetails)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveTransactionDetails[ENV_CONTEXT]);
  });
});

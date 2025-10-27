import { data } from '../../../fixtures/PartnerAPI/AMS/partner-AssetAccounts.json';
import { ENV_CONTEXT, STATUS_CODES, setRequestApiUrl } from '../../../support/Utility/common-utility';

describe('Retrieve AssetAccount Details', () => {
  it('Retrieve AssetAccount Details - GET /ams/accounts/{aaId}', () => {
    setRequestApiUrl(
      data.retrieveAssetDetailsbyAssetId,
      '{aaId}',
      data.retrieveAssetDetailsbyAssetId[ENV_CONTEXT].responseBody.id
    );
    cy.api_request(data.retrieveAssetDetailsbyAssetId)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveAssetDetailsbyAssetId[ENV_CONTEXT]);
  });

  it('Retrieve - List of All AssetAccounts by cId and seId - GET /ams/accounts?cId={cId}&seId={seId}', () => {
    const { clientId, serviceEntityId } = data.retrieveAssetDetailsby_cId_seId[ENV_CONTEXT].responseBody;
    data.retrieveAssetDetailsby_cId_seId.requestQS.cId = clientId;
    data.retrieveAssetDetailsby_cId_seId.requestQS.seId = serviceEntityId;

    cy.api_request(data.retrieveAssetDetailsby_cId_seId)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        // Iterate the response body to match with the ID and validate the JSON array list
        response.body.forEach((item) => {
          if (data.retrieveAssetDetailsby_cId_seId[ENV_CONTEXT].responseBody.id === item.id) {
            // Ignores the below fields before the deep comparison as these fields are dynamically generated
            const fieldsToIgnore = [
              'balance',
              'acb',
              'avgAcb',
              'lastPrice',
              'lastPriceTimestamp',
              'marketRate',
              'marketRateTimestamp',
              'marketValue',
            ];
            cy.assertDeepEqualIgnoringFields(
              item,
              data.retrieveAssetDetailsby_cId_seId[ENV_CONTEXT].responseBody,
              fieldsToIgnore
            );
          }
        });
      });
  });
});

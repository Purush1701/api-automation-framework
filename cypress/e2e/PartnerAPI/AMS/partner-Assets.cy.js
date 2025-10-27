/**
 * @fileoverview Test suite for Asset Management System (AMS) API endpoints.
 * This file contains tests for retrieving assets by class and symbol.
 */

import { data } from '../../../fixtures/PartnerAPI/AMS/partner-Assets.json';
import { ENV_CONTEXT, STATUS_CODES, setRequestApiUrl } from '../../../support/Utility/common-utility';

/**
 * Asset class enumeration
 * @enum {number}
 */
const ASSET_CLASSES = {
  CASH: 0,
  CRYPTOCURRENCY: 1,
  STOCK: 2,
  BOND: 3,
  REAL_ESTATE: 4,
  PRIVATE_EQUITY: 5,
  COMMODITY: 6,
  NFT: 7,
};

describe('Assets', () => {
  context('Retrieve List of Assets', () => {
    it('Retrieve List of Assets - [GET] /ams/assets/', () => {
      validateAssetByAssetClass(data.retrieveAllAsset);
    });

    it('Retrieve List of Assets by assetClass - [GET] /ams/assets/?assetClass=0 Cash', () => {
      validateAssetByAssetClass(data.retrieveAssetbyassetClass_Cash);
    });

    it('Retrieve List of Assets - [GET] /ams/assets/?assetClass=1 Cryptocurrency', () => {
      validateAssetByAssetClass(data.retrieveAssetbyassetClass_Cryptocurrency);
    });

    it('Retrieve List of Assets - [GET] /ams/assets/?assetClass=2 Stock', () => {
      validateAssetByAssetClass(data.retrieveAssetbyassetClass_Stock);
    });

    it('Retrieve List of Assets - [GET] /ams/assets/?assetClass=3 Bond', () => {
      validateAssetByAssetClass(data.retrieveAssetbyassetClass_Bond);
    });

    it('Retrieve List of Assets - [GET] /ams/assets/?assetClass=4 RealEstate', () => {
      validateAssetByAssetClass(data.retrieveAssetbyassetClass_RealEstate);
    });

    it('Retrieve List of Assets - [GET] /ams/assets/?assetClass=5 PrivateEquity', () => {
      cy.api_request(data.retrieveAssetbyassetClass_PrivateEquity).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Retrieve List of Assets - [GET] /ams/assets/?assetClass=6 Commodity', () => {
      cy.api_request(data.retrieveAssetbyassetClass_Commodity).verifyStatusCode(STATUS_CODES.OK);
    });

    it('Retrieve List of Assets - [GET] /ams/assets/?assetClass=7 NFT', () => {
      cy.api_request(data.retrieveAssetbyassetClass_NFT).verifyStatusCode(STATUS_CODES.OK);
    });

    /**
     * Helper function to validate assets by asset class
     * @param {Object} fixtureData - Test data from fixture
     */
    const validateAssetByAssetClass = (fixtureData) => {
      cy.api_request(fixtureData)
        .verifyStatusCode(STATUS_CODES.OK)
        .then((response) => {
          // Iterate the expected response body in the fixture and compare each JSON array list with the actual response body list
          fixtureData[ENV_CONTEXT].responseBody.forEach((expectedList, index) => {
            expect(response.body[index]).to.deep.eq(expectedList);
          });
        });
    };
  });

  /**
   * Context for retrieving assets by symbol
   */
  context('Retrieve Asset By Symbol', () => {
    it('Retrieve Asset By Symbol - [GET] /ams/assets/{symbol} - HKD', () => {
      validateAssetBySymbol(data.retrieveAssetbySymbol_Cash);
    });

    it('Retrieve Asset By Symbol - [GET] /ams/assets/{symbol} - Cryptocurrency', () => {
      validateAssetBySymbol(data.retrieveAssetbySymbol_CryptoCurrency);
    });

    it('Retrieve Asset By Symbol - [GET] /ams/assets/{symbol} - Stock Asset', () => {
      validateAssetBySymbol(data.retrieveAssetbySymbol_StockAsset);
    });

    it('Retrieve Asset By Symbol - [GET] /ams/assets/{symbol} - Bond Asset', () => {
      validateAssetBySymbol(data.retrieveAssetbySymbol_BondAsset);
    });

    /**
     * Helper function to validate assets by symbol
     * @param {Object} fixtureData - Test data from fixture
     */
    const validateAssetBySymbol = (fixtureData) => {
      const { symbol } = fixtureData[ENV_CONTEXT].responseBody;
      setRequestApiUrl(fixtureData, '{symbol}', symbol);
      cy.api_request(fixtureData).verifyStatusCode(STATUS_CODES.OK).validateResponseBody(fixtureData[ENV_CONTEXT]);
    };
  });
});

import { data } from '../../../fixtures/BO_Scos/Applications/scos_clients_applications.json';
import { generateRandomData } from '../../../support/Utility/generateData.js';
import { setRequestApiUrl, STATUS_CODES } from '../../../support/Utility/common-utility.js';

describe('Applications', () => {
  let applicationId = '';
  let documentId = '';
  let documentName = '';
  let authorizedUsersId = '';
  let bankAccountId = '';
  let accountId = '';
  let walletId = '';

  it('Retrieve applications (archived=false) - [GET] applications', () => {
    data.retrieveApplications.requestQS.archived = 'false';
    cy.api_request(data.retrieveApplications).verifyStatusCode(STATUS_CODES.OK);
  });

  it('Retrieve applications (archived=true) - [GET] applications', () => {
    data.retrieveApplications.requestQS.archived = 'true';
    cy.api_request(data.retrieveApplications).verifyStatusCode(STATUS_CODES.OK);
  });

  it('Retrieve countries - [GET] lookup/countries', () => {
    cy.api_request(data.retrieveCountries)
      .verifyStatusCode(STATUS_CODES.OK)
      .validateResponseBody(data.retrieveCountries);
  });

  it('Upload document - [POST] file-storage/upload-temp', () => {
    cy.api_request(data.uploadDocument)
      .verifyStatusCode(STATUS_CODES.OK)
      .then((response) => {
        documentId = response.body.id;
        documentName = response.body.name;
      });
  });

  context('Create new Application and approve it', () => {
    it('Create application - [POST] applications', () => {
      const { requestBody } = data.createApplication;
      requestBody.legalEntityName = generateRandomData().companyName;
      cy.api_request(data.createApplication)
        .verifyStatusCode(STATUS_CODES.OK)
        .then((response) => {
          applicationId = response.body.id;
        });
    });

    context('New Application submission with Application Id', () => {
      before(() => {
        expect(applicationId, 'Application Id is undefined, skipping all the cases in the spec file').to.be.ok;
      });

      it('Add application entity particulars - [POST] applications/{applicationId}/entity-particulars', () => {
        setRequestApiUrl(data.updateApplicationEntityParticulars, '{applicationId}', applicationId);
        const { requestBody } = data.updateApplicationEntityParticulars;
        // Upload document and get documentId and documentName, then build and send the request
        cy.api_request(data.uploadDocument)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            const documentId = response.body.id;
            const documentName = response.body.name;

            // Build request body with random data and uploaded document info
            requestBody.companyParticulars.legalStructure = 'public-limited-company';
            requestBody.companyParticulars.structureDetails = '';
            requestBody.companyParticulars.registrationNumber = `${Cypress._.random(1000000000)}`;
            requestBody.companyParticulars.dateOfInc = generateRandomData().date;
            requestBody.companyParticulars.countryOfInc = generateRandomData().country;
            requestBody.companyParticulars.documents = [
              {
                fileId: documentId,
                documentType: 'Certificate of Incumbency',
                fileName: documentName,
              },
            ];
            requestBody.registrationAddress.street = generateRandomData().address;
            requestBody.registrationAddress.postalCode = generateRandomData().postalCode;
            requestBody.registrationAddress.city = generateRandomData().city;
            requestBody.registrationAddress.state = generateRandomData().state;
            requestBody.registrationAddress.country = generateRandomData().country;
            requestBody.companyContact.email = generateRandomData().email;
            requestBody.companyContact.phone = `${Cypress._.random(1000000000)}`;

            cy.api_request(data.updateApplicationEntityParticulars).verifyStatusCode(STATUS_CODES.OK);
          });
      });

      it('Add application authorized user - [POST] applications/{applicationId}/authorized-users', () => {
        setRequestApiUrl(data.createApplicationAuthorizedUser, '{applicationId}', applicationId);
        const [requestBody] = data.createApplicationAuthorizedUser.requestBody;
        // Set random values for all parameters
        requestBody.firstName = generateRandomData().firstName;
        requestBody.lastName = generateRandomData().lastName;
        requestBody.userId = generateRandomData().email;
        // Upload for personalVerification
        cy.api_request(data.uploadDocument)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((personalResponse) => {
            const personalId = personalResponse.body.id;
            const personalName = personalResponse.body.name;
            requestBody.personalVerification.fileId = personalId;
            requestBody.personalVerification.fileName = personalName;
            // Upload for proofOfAddress
            cy.api_request(data.uploadDocument)
              .verifyStatusCode(STATUS_CODES.OK)
              .then((addressResponse) => {
                const addressId = addressResponse.body.id;
                const addressName = addressResponse.body.name;
                requestBody.proofOfAddress.fileId = addressId;
                requestBody.proofOfAddress.fileName = addressName;
                cy.api_request(data.createApplicationAuthorizedUser).verifyStatusCode(STATUS_CODES.OK);
              });
          });
      });

      it('Add application business info - [POST] applications/{applicationId}/business-info', () => {
        setRequestApiUrl(data.updateApplicationBusinessInfo, '{applicationId}', applicationId);
        const { requestBody } = data.updateApplicationBusinessInfo;
        // Upload document and get documentId and documentName, then build and send the request
        cy.api_request(data.uploadDocument)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            const documentId = response.body.id;
            const documentName = response.body.name;
            // Set random values for all relevant fields
            requestBody.sourcesOfWealth.furtherInformation = generateRandomData().description;
            requestBody.sourcesOfWealth.documents = [
              {
                fileId: documentId,
                documentType: 'Business Registration',
                fileName: documentName,
              },
            ];
            requestBody.linesOfBusiness.businessEntityType = 'subsidiary-undertaking';
            requestBody.businessActivities.annualNetTurnover = `${Cypress._.random(10000, 99999)}`;
            requestBody.businessActivities.description = generateRandomData().description;
            requestBody.projectedOrders.maxAnticipatedAmountForSingleMint = `${Cypress._.random(10000, 99999)}`;
            requestBody.projectedOrders.expectedIrregularMintsFirstYear = `${Cypress._.random(10000, 99999)}`;

            cy.api_request(data.updateApplicationBusinessInfo).verifyStatusCode(STATUS_CODES.OK);
          });
      });

      it('Add application bank account - [POST] applications/{applicationId}/bank-accounts', () => {
        setRequestApiUrl(data.createApplicationBankAccount, '{applicationId}', applicationId);
        const [requestBody] = data.createApplicationBankAccount.requestBody;
        // Upload document and get documentId and documentName, then build and send the request
        cy.api_request(data.uploadDocument)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            const documentId = response.body.id;
            const documentName = response.body.name;

            // Set random values for all relevant fields
            requestBody.beneficiary = generateRandomData().firstName;
            requestBody.iban = `${Cypress._.random(100000000000)}`;
            requestBody.bankName = generateRandomData().companyName;
            requestBody.swift = generateRandomData().swiftCode;
            requestBody.alias = generateRandomData().lastName;
            requestBody.sampleOwnBankId = `${Cypress._.random(100000)}`;
            requestBody.sampleThirdPartyBankId = `${Cypress._.random(10000)}`;
            requestBody.street = generateRandomData().address;
            requestBody.postalCode = generateRandomData().postalCode;
            requestBody.city = generateRandomData().city;
            requestBody.state = generateRandomData().state;
            requestBody.country = generateRandomData().country;
            requestBody.documents = [
              {
                fileId: documentId,
                documentType: 'Deposit Slip',
                fileName: documentName,
              },
            ];

            cy.api_request(data.createApplicationBankAccount).verifyStatusCode(STATUS_CODES.OK);
          });
      });

      it('Add application wallet - [POST] applications/{applicationId}/wallets', () => {
        setRequestApiUrl(data.createApplicationWallet, '{applicationId}', applicationId);
        const [requestBody] = data.createApplicationWallet.requestBody;
        requestBody.address = generateRandomData().walletAddress;
        cy.api_request(data.createApplicationWallet).verifyStatusCode(STATUS_CODES.OK);
      });

      it('Add application account - [POST] applications/{applicationId}/accounts', () => {
        setRequestApiUrl(data.createApplicationAccount, '{applicationId}', applicationId);
        const [requestBody] = data.createApplicationAccount.requestBody;
        requestBody.clientName = generateRandomData().companyName;
        requestBody.accountNumber = `${Cypress._.random(10000000000000)}`;
        cy.api_request(data.createApplicationAccount).verifyStatusCode(STATUS_CODES.OK);
      });

      it('Add application document - [POST] applications/{applicationId}/documents', () => {
        setRequestApiUrl(data.createApplicationDocument, '{applicationId}', applicationId);
        const { requestBody } = data.createApplicationDocument;
        // List of document keys and their types as per fixture
        const docMap = [
          { key: 'memorandumOfAssociation', type: 'Articles of Association' },
          { key: 'bankStatement', type: 'Bank Statement' },
          { key: 'certificateOfIncumbency', type: 'Certificate of Incumbency' },
          { key: 'groupOwnershipAndStructure', type: 'Group Ownership And Structure' },
          { key: 'certificateOfIncAndNameChange', type: 'Certificate of Incorporation' },
          { key: 'registerOfShareholder', type: 'Register of Shareholder' },
          { key: 'registerOfDirectors', type: 'Register of Directors' },
          {
            key: 'boardResolutionAppointingAdditionalUsers',
            type: 'Company Board Resolution Appointing Additional Users',
          },
        ];
        const uploadAndAssign = (index) => {
          if (index >= docMap.length) {
            cy.api_request(data.createApplicationDocument).verifyStatusCode(STATUS_CODES.OK);
            return;
          }
          cy.api_request(data.uploadDocument)
            .verifyStatusCode(STATUS_CODES.OK)
            .then((response) => {
              requestBody[docMap[index].key] = {
                fileId: response.body.id,
                documentType: docMap[index].type,
                fileName: response.body.name,
              };
              uploadAndAssign(index + 1);
            });
        };
        uploadAndAssign(0);
      });

      it('Retrieve application authorized users - [GET] applications/{applicationId}/authorized-users', () => {
        setRequestApiUrl(data.retrieveApplicationAuthorizedUsers, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationAuthorizedUsers)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            authorizedUsersId = response.body.items[0].id;
          });
      });

      it('Retrieve application bank accounts - [GET] applications/{applicationId}/bank-accounts', () => {
        setRequestApiUrl(data.retrieveApplicationBankAccounts, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationBankAccounts)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            bankAccountId = response.body.items[0].id;
          });
      });

      it('Retrieve application business info - [GET] applications/{applicationId}/business-info', () => {
        setRequestApiUrl(data.retrieveApplicationBusinessInfo, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationBusinessInfo).verifyStatusCode(STATUS_CODES.OK);
      });

      it('Retrieve application documents - [GET] applications/{applicationId}/documents', () => {
        setRequestApiUrl(data.retrieveApplicationDocuments, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationDocuments).verifyStatusCode(STATUS_CODES.OK);
      });

      it('Retrieve application entity particulars - [GET] applications/{applicationId}/entity-particulars', () => {
        setRequestApiUrl(data.retrieveApplicationEntityParticulars, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationEntityParticulars).verifyStatusCode(STATUS_CODES.OK);
      });

      it('Retrieve application accounts - [GET] applications/{applicationId}/accounts', () => {
        setRequestApiUrl(data.retrieveApplicationAccounts, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationAccounts)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            accountId = response.body.items[0].id;
          });
      });

      it('Retrieve application metadata - [GET] applications/{applicationId}/metadata', () => {
        setRequestApiUrl(data.retrieveApplicationMetadata, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationMetadata).verifyStatusCode(STATUS_CODES.OK);
      });

      it('Retrieve application wallets - [GET] applications/{applicationId}/wallets', () => {
        setRequestApiUrl(data.retrieveApplicationWallets, '{applicationId}', applicationId);
        cy.api_request(data.retrieveApplicationWallets)
          .verifyStatusCode(STATUS_CODES.OK)
          .then((response) => {
            walletId = response.body.items[0].id;
          });
      });

      it('Submit application - [PUT] applications/{applicationId}/submit', () => {
        setRequestApiUrl(data.updateApplicationSubmit, '{applicationId}', applicationId);
        cy.api_request(data.updateApplicationSubmit).verifyStatusCode(STATUS_CODES.OK);
      });

      it('Verify application - [PUT] applications/{applicationId}/verify', () => {
        setRequestApiUrl(data.verifyApplication, '{applicationId}', applicationId);
        // Build the request body array with dynamic ids
        const verifyPayload = [
          { form: 'entity-particulars', record: 'company-particulars', id: null },
          { form: 'entity-particulars', record: 'registration-address', id: null },
          { form: 'entity-particulars', record: 'company-contact', id: null },
          { form: 'authorized-users', record: null, id: authorizedUsersId },
          { form: 'business-info', record: 'sources-of-wealth', id: null },
          { form: 'business-info', record: 'politically-exposed-person', id: null },
          { form: 'business-info', record: 'lines-of-business', id: null },
          { form: 'business-info', record: 'business-activities', id: null },
          { form: 'business-info', record: 'projected-orders', id: null },
          { form: 'bank-accounts', record: null, id: bankAccountId },
          { form: 'wallets', record: null, id: walletId },
          { form: 'accounts', record: null, id: accountId },
          { form: 'documents', record: 'due-diligence-documents', id: null },
        ];
        cy.wrap(verifyPayload).each((payload) => {
          const verifyReq = { ...data.verifyApplication, requestBody: payload };
          cy.api_request(verifyReq).verifyStatusCode(STATUS_CODES.OK);
        });
      });

      it('Approve application - [PUT] applications/{applicationId}/approve', () => {
        setRequestApiUrl(data.approveApplication, '{applicationId}', applicationId);
        cy.api_request(data.approveApplication).verifyStatusCode(STATUS_CODES.OK);
      });
    });
  });

  context('Create new Application and Reject it', () => {
    it('Create application - [POST] applications', () => {
      const { requestBody } = data.createApplication;
      requestBody.legalEntityName = generateRandomData().companyName;
      cy.api_request(data.createApplication)
        .verifyStatusCode(STATUS_CODES.OK)
        .then((response) => {
          applicationId = response.body.id;
        });
    });

    context('New Application submission with Application Id', () => {
      before(() => {
        expect(applicationId, 'Application Id is undefined, skipping all the cases in the spec file').to.be.ok;
      });

      it('Reject application - [PUT] applications/{applicationId}/reject', () => {
        setRequestApiUrl(data.rejectApplication, '{applicationId}', applicationId);
        cy.api_request(data.rejectApplication).verifyStatusCode(STATUS_CODES.OK);
      });
    });
  });

  context('Create new Application and archive it', () => {
    it('Create application - [POST] applications', () => {
      const { requestBody } = data.createApplication;
      requestBody.legalEntityName = generateRandomData().companyName;
      cy.api_request(data.createApplication)
        .verifyStatusCode(STATUS_CODES.OK)
        .then((response) => {
          applicationId = response.body.id;
        });
    });

    context('New Application submission with Application Id', () => {
      before(() => {
        expect(applicationId, 'Application Id is undefined, skipping all the cases in the spec file').to.be.ok;
      });

      it('Archive application - [PUT] applications/{applicationId}/archive', () => {
        setRequestApiUrl(data.archiveApplication, '{applicationId}', applicationId);
        cy.api_request(data.archiveApplication).verifyStatusCode(STATUS_CODES.OK);
      });
    });
  });

  it.skip('Require additional info application - [PUT] applications/{applicationId}/additional-info-required', () => {
    setRequestApiUrl(data.requireAdditionalInfoApplication, '{applicationId}', applicationId);
    cy.api_request(data.requireAdditionalInfoApplication).verifyStatusCode(STATUS_CODES.OK);
  });
});

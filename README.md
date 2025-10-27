# 🚀 API Test Automation Framework

[![Cypress Tests](https://img.shields.io/badge/tests-cypress-17202C.svg)](https://www.cypress.io/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/javascript-ES6%2B-yellow.svg)](https://www.javascript.com/)

A comprehensive, enterprise-grade API test automation framework built with Cypress, designed for testing complex microservices architectures across multiple environments.

## 🏗️ Architecture Overview

This framework provides robust API testing capabilities for:
- **Client Portal Aggregators (CP_Agg)** - Customer-facing API endpoints
- **Back Office Aggregators (BO_Agg)** - Internal business operations APIs
- **Back Office BFF (BO_Bff)** - Backend for Frontend services
- **Back Office SCOS (BO_Scos)** - Service-oriented architecture APIs
- **Partner APIs** - Third-party integration endpoints
- **Integration APIs** - Cross-service communication testing

## ✨ Key Features

### 🔧 **Multi-Environment Support**
- **Staging Environment** - Pre-production testing
- **UAT Environment** - User acceptance testing
- **Configurable Environments** - Easy environment switching

### 📊 **Advanced Reporting**
- **Mochawesome Reports** - Beautiful HTML test reports
- **Multi-Reporter Support** - JUnit, JSON, and custom reporters
- **Coverage Analysis** - API endpoint coverage tracking
- **CI/CD Integration** - Automated report generation

### 🛠️ **Rich Utility Library**
- **Common Utilities** - Date operations, HTTP status codes, document management
- **Crypto Utilities** - Blockchain transaction testing (Ethereum, Solana)
- **Data Generation** - Faker.js integration for test data
- **Token Management** - MSAL authentication bypass
- **File Processing** - Excel workbook manipulation

### 🔐 **Security & Authentication**
- **MSAL Token Injection** - Azure AD SSO bypass
- **Multi-Auth Support** - Various authentication methods
- **Encrypted Keys** - AES encryption for sensitive data
- **Environment Variables** - Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (optional)

### Installation
```bash
# Clone the repository
git clone https://github.com/Purush1701/API-automation-repo.git
cd API-automation-repo

# Install dependencies
npm install

# Configure environment
cp .env.staging.sample .env.staging
cp .env.uat.sample .env.uat
```

### Running Tests

#### Interactive Mode
```bash
# Open Cypress Test Runner
npm run cy:open:staging
npm run cy:open:uat
```

#### Headless Mode
```bash
# Run all tests in staging
npm run cy:run:staging

# Run specific API groups
npm run cy:run:staging:CP      # Client Portal APIs
npm run cy:run:staging:BO      # Back Office APIs
npm run cy:run:staging:PartnerAPI  # Partner APIs
```

## 📁 Project Structure

```
cypress/
├── e2e/                    # Test specifications
│   ├── BO_Agg/            # Back Office Aggregator tests
│   ├── CP_Agg/            # Client Portal Aggregator tests
│   ├── PartnerAPI/        # Partner API tests
│   └── IntegrationAPI/    # Integration API tests
├── fixtures/              # Test data and configurations
├── support/               # Custom commands and utilities
│   └── Utility/          # Reusable utility functions
└── reports/              # Generated test reports
```

## 🔧 Configuration

### Environment Configuration
- **Staging**: `cypress.config.staging.js`
- **UAT**: `cypress.config.uat.js`
- **Common**: `cypress.common.js`

### Test Data Management
- **Fixtures**: JSON-based test data
- **Dynamic Data**: Faker.js generated data
- **Environment-Specific**: Separate configs per environment

## 📊 Reporting & Analytics

### Test Reports
- **HTML Reports** - Comprehensive test results
- **Coverage Reports** - API endpoint coverage analysis
- **Performance Metrics** - Response time tracking

### CI/CD Integration
- **GitHub Actions** - Automated test execution
- **Docker Support** - Containerized test runs
- **AWS Integration** - S3 report storage

## 🛡️ Security Features

- **Data Sanitization** - No sensitive data in repository
- **Encrypted Credentials** - Secure key management
- **Environment Isolation** - Separate test environments
- **Audit Logging** - Comprehensive test audit trails

## 🚀 Advanced Features

### Blockchain Testing
- **Ethereum Integration** - Alchemy SDK support
- **Solana Testing** - SPL token operations
- **Multi-Signature Workflows** - Complex transaction testing

### File Processing
- **Excel Manipulation** - XLSX file processing
- **Document Upload** - Multi-format file testing
- **Base64 Encoding** - File encoding utilities

## 📈 Performance & Scalability

- **Parallel Execution** - Multi-threaded test runs
- **Resource Optimization** - Efficient memory usage
- **Docker Support** - Scalable containerized testing
- **Cloud Integration** - AWS ECR image support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your tests following the established patterns
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:
- Create an issue in this repository
- Check the documentation in the `docs/` folder
- Review the utility functions in `cypress/support/Utility/`

---

**Built with ❤️ using Cypress, Node.js, and modern testing practices**

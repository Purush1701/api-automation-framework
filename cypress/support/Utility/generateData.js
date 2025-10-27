import { faker } from '@faker-js/faker';

export function generateRandomData() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.number(),
    country: getRandomCountry(),
    city: faker.location.city(),
    state: faker.location.state(),
    postalCode: faker.location.zipCode(),
    address: faker.location.streetAddress(),
    date: generateDOB(),
    companyName: faker.company.name(),
    swiftCode: faker.finance.bic(),
    walletAddress: faker.finance.ethereumAddress(),
    amount: faker.number.int({ min: 10, max: 1000 }),
    description: faker.lorem.sentence(),
    url: faker.internet.url(),
  };
}

function generateDOB() {
  const dob = faker.date.past({
    years: 50,
    refDate: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
  });
  return dob.toISOString().split('T')[0]; // Format as yyyy-mm-dd
}

function getRandomCountry() {
  return countrycode[Math.floor(Math.random() * countrycode.length)];
}

export const countrycode = ['AUS', 'CAN', 'CYM', 'EST', 'DEU', 'GIB', 'HKG', 'MYS', 'IRL', 'GBR', 'USA'];

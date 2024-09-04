// Importiere benötigte Module
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const readline = require('readline');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoose = require('mongoose');

// Definiere die API-Endpunkte
const registrationUrl = 'http://localhost:3000/auth/register';
const loginUrl = 'http://localhost:3000/auth/login';

// Globale Variablen für die Access Tokens
let userAccessToken = '';
let userRefreshToken = '';
let ownerRefreshToken = '';
let ownerAccessToken = '';
let companyId = '';

// Benutzerdaten
const userData = {
  email: 'test.test@hotmail.ch',
  password: '123456',
};

// Funktion zum Registrieren des Benutzers
async function registerUser() {
  try {
    const response = await axios.post(registrationUrl, userData);
    console.log('Registration Response:', response.data);

    // Weiter zum Einloggen nach erfolgreicher Registrierung
    if (response.data.email) {
      await loginUser();
    }
  } catch (error) {
    console.error(
      'Registration Error:',
      error.response ? error.response.data : error,
    );
  }
}

// Funktion zum Einloggen des Benutzers
async function loginUser() {
  try {
    const response = await axios.post(loginUrl, userData);
    console.log('Login Response:', response.data);

    if (response.data.accessToken) {
      userAccessToken = response.data.accessToken;
      userRefreshToken = response.data.refreshToken;
    }
  } catch (error) {
    console.error('Login Error:', error.response ? error.response.data : error);
  }
}

// Generiere zufällige Koordinaten in der Nähe eines bestimmten Punktes
function generateNearbyCoordinates(baseLongitude, baseLatitude) {
  // Geringfügige Abweichung, um verschiedene Standorte in der Nähe zu simulieren
  const longitude = baseLongitude + Math.random() * 0.01 - 0.005;
  const latitude = baseLatitude + Math.random() * 0.01 - 0.005;
  return [longitude, latitude];
}

// Funktion zum Registrieren von 20 Owners
async function registerMultipleOwners() {
  for (let i = 0; i < 20; i++) {
    // Erzeuge für jeden Owner eine einzigartige E-Mail und leicht unterschiedliche Koordinaten
    const uniqueEmail = `owner${i}@example.com`;
    const [longitude, latitude] = generateNearbyCoordinates(
      -73.856077,
      40.848447,
      i,
    );

    const ownerData = {
      email: uniqueEmail,
      password: '123456',
      company: {
        employeesAppUsersIds: [],
        companyName: `Example Company ${i}`,
        legalForm: 'GmbH',
        dateOfEstablishment: '2023-01-01T00:00:00.000Z',
        headquartersAddress: `${i} Example St, City, Country`,
        revenue: 1000000,
        numberOfEmployees: 50,
        managingDirectorCEO: `John Doe ${i}`,
        contactInformation: `contact${i}@example.com`,
        description: `Example Company Description ${i}`,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        subIndustry: 'Forestry',
      },
    };

    try {
      const response = await axios.post(registrationUrl, ownerData);
      console.log(`Owner ${i} Registration Response:`, response.data);
    } catch (error) {
      console.error(
        `Owner ${i} Registration Error:`,
        error.response ? error.response.data : error,
      );
    }
  }
}

const ownerData = {
  email: 'test2.test2@hotmail.ch',
  password: '123456',
  company: {
    uId: 'CHE-101.318.942',
    employeesAppUsersIds: [],
    companyName: 'Example Company',
    legalForm: 'GmbH',
    dateOfEstablishment: '2023-01-01T00:00:00.000Z',
    headquartersAddress: '123 Example St, City, Country',
    revenue: 1000000,
    numberOfEmployees: 50,
    managingDirectorCEO: 'John Doe',
    contactInformation: 'contact@example.com',
    description: 'Example Company Description',
    location: {
      type: 'Point',
      coordinates: [-73.856077, 40.848447],
    },
    subIndustry: 'Forestry',
  },
};

// Funktion zum Registrieren des Owners
async function registerOwner() {
  try {
    const response = await axios.post(registrationUrl, ownerData);
    console.log('Owner Registration Response:', response.data);

    // Weiter zum Einloggen nach erfolgreicher Registrierung
    if (response.data.email) {
      await loginOwner();
    }
  } catch (error) {
    console.error(
      'Owner Registration Error:',
      error.response ? error.response.data : error,
    );
  }
}

// Funktion zum Einloggen des Owners
async function loginOwner() {
  try {
    const loginData = {
      email: ownerData.email,
      password: ownerData.password,
    };
    const response = await axios.post(loginUrl, loginData);
    console.log('Owner Login Response:', response.data);

    if (response.data.accessToken) {
      ownerAccessToken = response.data.accessToken;
      ownerRefreshToken = response.data.refreshToken;
    }
  } catch (error) {
    console.error(
      'Owner Login Error:',
      error.response ? error.response.data : error,
    );
  }
}

// Funktion zur Löschung aller Daten aus der Datenbank
async function clearDatabase() {
  await mongoose.connect('mongodb://root:root@localhost:8081/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

// Funktion zur Bestätigungsabfrage
function confirmAction(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, function (input) {
      rl.close();
      resolve(input);
    });
  });
}
const createPointCardUrl = 'http://localhost:3000/business-point-card';

// Daten für die Pointcard
const pointCardData = {
  name: 'ownerBurgers',
  maxpoints: 10,
  discount: 25,
  description: '25% Rabatt auf alle Burger',
};

let pointCardId = ''; // Variable, um die ID der erstellten Pointcard zu speichern

async function createPointCard() {
  try {
    const response = await axios.post(createPointCardUrl, pointCardData, {
      headers: {
        Authorization: `Bearer ${ownerAccessToken}`, // Verwende den Access Token des Owners
      },
    });
    console.log('PointCard Created:', response.data);
    pointCardId = response.data._id; // Speichere die _id für späteren Gebrauch
  } catch (error) {
    console.error(
      'Error creating PointCard:',
      error.response ? error.response.data : error,
    );
  }
}

const createCustomerPointCardUrl = 'http://localhost:3000/customer-point-card';

async function createCustomerPointCard() {
  try {
    const customerPointCardData = {
      pointCardID: pointCardId,
    };

    const response = await axios.post(
      createCustomerPointCardUrl,
      customerPointCardData,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`, // Verwende den Access Token des Users
        },
      },
    );
    console.log('Customer PointCard Created:', response.data);
  } catch (error) {
    console.error(
      'Error creating Customer PointCard:',
      error.response ? error.response.data : error,
    );
  }
}

async function fetchPrincipal() {
  const principalUrl = 'http://localhost:3000/auth/principal';

  try {
    const response = await axios.get(principalUrl, {
      headers: {
        Authorization: `Bearer ${ownerAccessToken}`, // Verwende den Owner JWT Token
      },
    });
    console.log('Principal Data:', response.data);

    // Extrahiere die Company ID aus der Antwort, wenn vorhanden
    if (response.data.company && response.data.company.length > 0) {
      companyID = await response.data.company; // Angenommen, es ist das erste Element im Array
      companyId = companyID;
    } else {
      console.log('No company ID found in principal data');
    }
  } catch (error) {
    console.error(
      'Error fetching principal data:',
      error.response ? error.response.data : error,
    );
  }
}

const addEmployeeUrl = 'http://localhost:3000/auth/addEmployee';

let newEmployeeData = {
  email: 'test3.test3@hotmail.ch',
  password: '123456',
  isNew: true,
  companyId: companyId,
};

async function addEmployee() {
  newEmployeeData.companyId = companyId;

  try {
    const response = await axios.post(addEmployeeUrl, newEmployeeData, {
      headers: {
        Authorization: `Bearer ${ownerAccessToken}`, // Verwende den Owner JWT Token
      },
    });
    console.log('Employee Added:', response.data);
  } catch (error) {
    console.error(
      'Error adding employee:',
      error.response ? error.response.data : error,
    );
  }
}

// Hauptlogik
async function main() {
  const answer = await confirmAction(
    'WARNING: This will DELETE ALL data in the database and create new mock data. Do you wish to continue? (yes/no): ',
  );

  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation canceled.');
    return;
  }

  try {
    await clearDatabase();
    console.log('Database cleared.');
  } catch (error) {
    console.error('Failed to clear database:', error);
    return;
  }

  await registerUser();
  await registerOwner(); // Registriert den Owner
  await registerMultipleOwners();

  await createPointCard(); // Erstellt eine Pointcard
  await createCustomerPointCard(); // Erstellt eine Customer Pointcard

  await fetchPrincipal(); // Hole Principal-Daten und setze companyId
  await addEmployee(); // Füge neuen Mitarbeiter hinzu
}

main();

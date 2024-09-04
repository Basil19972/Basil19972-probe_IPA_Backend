const axios = require('axios');
const readline = require('readline');
const mongoose = require('mongoose');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const e = require('express');

// Definiere die API-Endpunkte
const registrationUrl = 'http://localhost:3000/auth/register';
const loginUrl = 'http://localhost:3000/auth/login';

// Globale Variablen für die Access Tokens
let userAccessToken = '';
let userRefreshToken = '';
let ownerRefreshToken = '';
let ownerAccessToken = '';
let ownerCompanyId = '';
let user2AccessToken = '';
let user2RefreshToken = '';
let user3AccessToken = '';

employeeAccessToken = '';

let customerPointCardId; // ID der CustomerPointCard für User 1
let customerPointCardIdForUser2; // ID der CustomerPointCard für User 2
let customerPointCardIdForUser3; // ID der CustomerPointCard für User 3

async function connectToDB() {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    throw new Error('DB_URI ist nicht definiert');
  }
  const client = new MongoClient(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log('Datenbankverbindung erfolgreich hergestellt');
    return client;
  } catch (error) {
    console.error('Fehler beim Herstellen der Datenbankverbindung:', error);
  }
}

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

const user2Data = {
  email: 'seconduser@example.com',
  password: 'password123',
};

// Funktion zum Registrieren des zweiten Benutzers
async function registerUser2() {
  try {
    const response = await axios.post(registrationUrl, user2Data);
    console.log('User2 Registration Response:', response.data);
    if (response.data.email) {
      await loginUser2();
    }
  } catch (error) {
    console.error(
      'User2 Registration Error:',
      error.response ? error.response.data : error,
    );
  }
}

// Funktion zum Einloggen des zweiten Benutzers
async function loginUser2() {
  try {
    const response = await axios.post(loginUrl, user2Data);
    console.log('User2 Login Response:', response.data);
    if (response.data.accessToken) {
      user2AccessToken = response.data.accessToken;
      user2RefreshToken = response.data.refreshToken;
    }
  } catch (error) {
    console.error(
      'User2 Login Error:',
      error.response ? error.response.data : error,
    );
  }
}

const user3Data = {
  email: 'thirduser@example.com',
  password: 'password123',
};

async function registerUser3() {
  try {
    const response = await axios.post(registrationUrl, user3Data);
    console.log('User3 Registration Response:', response.data);
    if (response.data.email) {
      await loginUser3();
    }
  } catch (error) {
    console.error(
      'User3 Registration Error:',
      error.response ? error.response.data : error,
    );
  }
}

async function loginUser3() {
  try {
    const response = await axios.post(loginUrl, user3Data);
    console.log('User3 Login Response:', response.data);
    if (response.data.accessToken) {
      user3AccessToken = response.data.accessToken;
    }
  } catch (error) {
    console.error(
      'User3 Login Error:',
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
    customerPointCardId = response.data._id; // Speichere die ID für späteren Gebrauch
  } catch (error) {
    console.error(
      'Error creating Customer PointCard:',
      error.response ? error.response.data : error,
    );
  }
}

async function createCustomerPointCardForUser2() {
  try {
    const customerPointCardData = {
      pointCardID: pointCardId,
    };
    const response = await axios.post(
      createCustomerPointCardUrl,
      customerPointCardData,
      {
        headers: {
          Authorization: `Bearer ${user2AccessToken}`,
        },
      },
    );
    console.log('Customer PointCard for User2 Created:', response.data);
    customerPointCardIdForUser2 = response.data._id; // Speichere die ID für späteren Gebrauch
  } catch (error) {
    console.error(
      'Error creating Customer PointCard for User2:',
      error.response ? error.response.data : error,
    );
  }
}

async function createCustomerPointCardForUser3() {
  try {
    const customerPointCardDataForUser3 = {
      pointCardID: pointCardId, // Verwende die bereits existierende pointCardId, die beim Erstellen der PointCard gespeichert wurde
    };

    const response = await axios.post(
      createCustomerPointCardUrl,
      customerPointCardDataForUser3,
      {
        headers: {
          Authorization: `Bearer ${user3AccessToken}`, // Stelle sicher, dass du den Access Token des dritten Benutzers nach dem Login korrekt speicherst und hier verwendest
        },
      },
    );
    console.log('Customer PointCard for User3 Created:', response.data);
    customerPointCardIdForUser3 = response.data._id; // Speichere die ID für späteren Gebrauch, ähnlich wie bei den anderen Benutzern
  } catch (error) {
    console.error(
      'Error creating Customer PointCard for User3:',
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
      ownerCompanyId = companyID;
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

async function addEmployee() {
  let newEmployeeData = {
    email: 'test3.test3@hotmail.ch',
    password: '123456',
    isNew: true,
    companyId: ownerCompanyId,
  };

  try {
    const response = await axios.post(addEmployeeUrl, newEmployeeData, {
      headers: {
        Authorization: `Bearer ${ownerAccessToken}`, // Verwende den Owner JWT Token
      },
    });
    await loginEmployee();
    console.log('Employee Added:', response.data);
  } catch (error) {
    console.error(
      'Error adding employee:',
      error.response ? error.response.data : error,
    );
  }
}

async function loginEmployee() {
  employeeLoginData = {
    email: 'test3.test3@hotmail.ch',
    password: '123456',
  };
  try {
    const response = await axios.post(loginUrl, employeeLoginData);
    console.log('Employee Login Response:', response.data);
    if (response.data.accessToken) {
      employeeAccessToken = response.data.accessToken;
    }
  } catch (error) {
    console.error(
      'employee Login Error:',
      error.response ? error.response.data : error,
    );
  }
}
async function generateQRCode8Points(ownerToken, businessPointCardID) {
  try {
    const response = await axios.post(
      'http://localhost:3000/qrcode/generate',
      {
        points: 8,
        businessPointCardID,
      },
      {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      },
    );

    if (response.status === 201) {
      console.log(
        'QR Code successfully generated with 20 points',
        response.data,
      );
      return response.data.token; // Gibt den Token des generierten QR-Codes zurück
    } else {
      console.error('Failed to generate QR Code', response.data);
    }
  } catch (error) {
    console.error(
      'Error generating QR Code:',
      error.response ? error.response.data : error,
    );
  }
}

async function generateQRCode7PointsForUser2(ownerToken, businessPointCardID) {
  try {
    const response = await axios.post(
      'http://localhost:3000/qrcode/generate',
      {
        points: 7,
        businessPointCardID,
      },
      {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      },
    );
    console.log(
      'QR Code for User2 successfully generated with 5 points',
      response.data,
    );
    return response.data.token; // Return the token of the generated QR code
  } catch (error) {
    console.error(
      'Error generating QR Code for User2:',
      error.response ? error.response.data : error,
    );
  }
}

async function receiveQRCode(userJwtToken, qrCodeToken) {
  try {
    const response = await axios.post(
      'http://localhost:3000/qrcode/receive',
      {
        token: qrCodeToken,
      },
      {
        headers: {
          Authorization: `Bearer ${userJwtToken}`,
        },
      },
    );

    if (response.status === 201) {
      console.log('QR Code successfully received', response.data);
    } else {
      console.error('Failed to receive QR Code', response.data);
    }
  } catch (error) {
    console.error(
      'Error receiving QR Code:',
      error.response ? error.response.data : error,
    );
  }
}

async function findCustomerPointCardById(customerPointCardId) {
  const client = await connectToDB();
  if (!client) {
    return; // Verbindung fehlgeschlagen
  }

  try {
    const db = client.db('test'); // Ersetze 'deineDatenbankName' mit dem Namen deiner Datenbank
    const collection = db.collection('customerpointcards'); // Ersetze 'customerPointCards' mit dem Namen deiner Collection

    console.log('Suche nach Dokument mit ID:', customerPointCardId);

    const document = await collection.findOne({
      _id: new ObjectId(customerPointCardId),
    });

    if (!document) {
      console.log('Dokument nicht gefunden');
    } else {
      console.log('Dokument gefunden:', document);
      return document;
    }
  } catch (error) {
    console.error('Fehler beim Suchen des Dokuments:', error);
  } finally {
    await client.close();
  }
}

async function distributePointsRandomlyOverLastThreeYears() {
  let client;
  try {
    client = await connectToDB();
    if (!client) {
      console.error('Verbindung zur Datenbank fehlgeschlagen');
      return;
    }
    const db = client.db('test');
    const collection = db.collection('customerpointcards');

    // Finde alle customerPointCards in der Datenbank
    const customerPointCards = await collection.find({}).toArray();
    if (!customerPointCards.length) {
      console.log('Keine customerPointCards gefunden');
      return;
    }

    const endDate = new Date();
    const startDate = new Date(
      new Date().setFullYear(endDate.getFullYear() - 3),
    );
    const totalMilliseconds = endDate - startDate;

    for (const card of customerPointCards) {
      if (!card.points || !card.points.length) {
        console.log(
          'Dokument oder Punkte nicht gefunden für cardId:',
          card._id,
        );
        continue;
      }

      // Erstelle ein neues Array für die aktualisierten Punkte, wobei andere Attribute erhalten bleiben
      const updatedPoints = card.points.map((point) => {
        const randomMilliseconds = Math.floor(
          Math.random() * totalMilliseconds,
        );
        const dateForPoint = new Date(startDate.getTime() + randomMilliseconds);

        return {
          ...point, // Behalte alle bestehenden Attribute des Punkts bei
          createdAt: dateForPoint, // Aktualisiere nur das createdAt Datum
        };
      });

      await collection.updateOne(
        { _id: card._id },
        { $set: { points: updatedPoints } },
      );

      console.log(
        `Punkte wurden zufällig über die letzten drei Jahre verteilt für cardId: ${card._id}`,
      );
    }
  } catch (error) {
    console.error(
      'Fehler beim zufälligen Verteilen der Punkte über die letzten drei Jahre:',
      error,
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

const updateRole = async (userEmail, newRole) => {
  const client = await connectToDB(); // Verbindung zur Datenbank herstellen
  const db = client.db('test'); // Ersetzen Sie 'yourDatabaseName' mit dem Namen Ihrer Datenbank
  const collection = db.collection('appusers'); // Ersetzen Sie 'users' mit dem Namen Ihrer Kollektion für Benutzer

  try {
    const updateResult = await collection.updateOne(
      { email: userEmail },
      { $set: { roles: [newRole] } }, // Aktualisieren der Rollen
    );

    if (updateResult.matchedCount === 0) {
      throw new Error('Benutzer nicht gefunden');
    }

    console.log('Rolle erfolgreich aktualisiert');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Rolle:', error);
  } finally {
    await client.close(); // Schließen der Datenbankverbindung
  }
};

async function distributePointsToUser3() {
  for (let i = 0; i < 100; i++) {
    // Wiederhole den Vorgang 8 Mal
    const qrCodeTokenForUser3 = await generateQRCode8Points(
      ownerAccessToken,
      pointCardId,
    ); // Generiere einen QR-Code für den dritten Benutzer
    if (qrCodeTokenForUser3) {
      await receiveQRCode(user3AccessToken, qrCodeTokenForUser3); // Löse den QR-Code für den dritten Benutzer ein
      console.log(`QR-Code ${i + 1} für User3 erfolgreich verarbeitet.`);
    } else {
      console.error(
        `Fehler beim Generieren oder Empfangen des QR-Codes für User3 bei Iteration ${i + 1
        }.`,
      );
    }
  }
}

async function distributePointsToUser2AsEmployee() {
  console.log('EmployeeAccessToken:', employeeAccessToken);
  for (let i = 0; i < 100; i++) {
    // Wiederhole den Vorgang 8 Mal
    const qrCodeTokenForUser3 = await generateQRCode8Points(
      employeeAccessToken,
      pointCardId,
    ); // Generiere einen QR-Code für den dritten Benutzer
    if (qrCodeTokenForUser3) {
      await receiveQRCode(user2AccessToken, qrCodeTokenForUser3); // Löse den QR-Code für den dritten Benutzer ein
      console.log(`QR-Code ${i + 1} für User2 erfolgreich verarbeitet.`);
    } else {
      console.error(
        `Fehler beim Generieren oder Empfangen des QR-Codes für User2 bei Iteration ${i + 1
        }.`,
      );
    }
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
  await registerUser2(); // Registriere den zweiten Benutzer
  await registerUser3(); // Registriere den dritten Benutzer

  await createPointCard(); // Erstellt eine Pointcard
  await createCustomerPointCard(); // Erstellt eine Customer Pointcard
  await createCustomerPointCardForUser2(); // Erstelle eine Customer PointCard für den zweiten Benutzer
  await createCustomerPointCardForUser3(); // Erstelle eine Customer PointCard für den dritten Benutzer

  await fetchPrincipal(); // Hole Principal-Daten und setze companyId
  //await addEmployee(); // Füge neuen Mitarbeiter hinzu
  await addEmployee(); // Füge neuen Mitarbeiter hinzu

  /*
const qrCodeToken = await generateQRCode8Points(
  ownerAccessToken,
  pointCardId,
); // Achte darauf, dass `userAccessToken` und `pointCardId` korrekt gesetzt sind
if (qrCodeToken) {
  await receiveQRCode(userAccessToken, qrCodeToken); // Hier ebenfalls sicherstellen, dass `userAccessToken` korrekt ist
}

const qrCodeTokenForUser2 = await generateQRCode7PointsForUser2(
  ownerAccessToken,
  pointCardId,
);
if (qrCodeTokenForUser2) {
  await receiveQRCode(user2AccessToken, qrCodeTokenForUser2);
}
*/

  await distributePointsToUser3();

  await distributePointsToUser2AsEmployee();

  await distributePointsRandomlyOverLastThreeYears();

  await updateRole('test2.test2@hotmail.ch', 'PlatinumOwner');
}

main();

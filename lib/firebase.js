
const firebase = require('firebase/app');
const fieldValue = require('firebase-admin').firestore.FieldValue;
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let db = admin.firestore();

module.exports = {
    db
}
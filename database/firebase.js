const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://space-invaders-api.firebaseio.com",
});

module.exports = admin;

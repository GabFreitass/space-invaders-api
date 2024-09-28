const admin = require("firebase-admin");
const serviceAccount = require("../config/space-invaders-api-firebase-adminsdk-o3ga1-1daf9807ce.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://space-invaders-api.firebaseio.com",
});

module.exports = admin;

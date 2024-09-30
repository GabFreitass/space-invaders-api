const admin = require("../database/firebase");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth");

router.post("/add", async (req, res) => {
    const { clientId, playerName, obtainedAt, score } = req.body;
    if (!clientId || !playerName || !obtainedAt || !score) {
        return res.status(400).send("Missing required fields.");
    }
    try {
        const docRef = await admin
            .firestore()
            .collection("ranking")
            .add({
                clientId,
                playerName,
                obtainedAt: admin.firestore.Timestamp.fromDate(
                    new Date(obtainedAt)
                ),
                score,
            });
        res.status(201).send(`Documento adicionado com ID: ${docRef.id}`);
    } catch (error) {
        res.status(500).send("Erro ao adicionar documento: " + error.message);
    }
});

router.get("/topScores", async (req, res) => {
    try {
        const snapshot = await admin
            .firestore()
            .collection("ranking")
            .orderBy("score", "desc")
            .limit(10)
            .get();

        const topScores = snapshot.docs.map((doc) => ({
            playerName: doc.data().playerName,
            obtainedAt: doc.data().obtainedAt.toDate(), // Converte o Timestamp para Date
            score: doc.data().score,
        }));

        if (topScores.length === 0) {
            return res.status(204).send();
        }

        res.status(200).json(topScores);
    } catch (error) {
        res.status(500).send(
            "Erro ao buscar os melhores scores: " + error.message
        );
    }
});

module.exports = router;

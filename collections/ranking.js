const admin = require("../database/firebase");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Middleware para verificar o token JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"]?.match(/Bearer (.+)/)[1]; // Obtém o token do cabeçalho com regex

    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).send("Invalid token.");
        }
        req.user = user; // Armazena as informações do usuário na requisição
        next();
    });
};

router.post("/add", authenticateToken, async (req, res) => {
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

router.get("/topScores", authenticateToken, async (req, res) => {
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

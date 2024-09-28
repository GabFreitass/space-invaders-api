const admin = require("../database/firebase");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateRequiredFields } = require("../middlewares/validation");

router.post(
    "/registerUser",
    validateRequiredFields(["playerName", "login", "password"]),
    async (req, res) => {
        try {
            const { playerName, login, password } = req.body;
            // Verifica se o login já existe
            const userSnapshot = await admin
                .firestore()
                .collection("users")
                .where("login", "==", login)
                .get();
            if (!userSnapshot.empty) {
                return res.status(409).send("Login já existente.");
            }

            // Hash a senha antes de armazená-la
            const hashedPassword = await bcrypt.hash(password, 10); // 10 é o número de rounds de salting

            const docRef = await admin
                .firestore()
                .collection("users") // Coleção para armazenar usuários
                .add({
                    playerName,
                    login,
                    password: hashedPassword, // Armazena a senha hasheada
                });
            res.status(201).send(`Usuário cadastrado com ID: ${docRef.id}`);
        } catch (error) {
            res.status(500).send("Erro ao cadastrar usuário: " + error.message);
        }
    }
);

router.post(
    "/login",
    validateRequiredFields(["login", "password"]),
    async (req, res) => {
        try {
            const { login, password } = req.body;
            const userSnapshot = await admin
                .firestore()
                .collection("users")
                .where("login", "==", login)
                .get();
            if (userSnapshot.empty) {
                return res.status(401).send("Usuário não encontrado.");
            }

            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();

            // Verifica a senha
            const isPasswordValid = await bcrypt.compare(
                password,
                userData.password
            );
            if (!isPasswordValid) {
                return res.status(401).send("Senha incorreta.");
            }

            // Gera um token JWT
            const token = jwt.sign(
                { id: userDoc.id, login: userData.login },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1h" }
            );
            res.status(200).json({ token });
        } catch (error) {
            res.status(500).send("Erro ao fazer login: " + error.message);
        }
    }
);

module.exports = router;

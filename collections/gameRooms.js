const admin = require("../database/firebase");
const express = require("express");
const router = express.Router();
const gameRules = require("../config/gameRules");
const { validateRequiredFields } = require("../middlewares/validation");

router.post(
    "/create",
    validateRequiredFields(["clientId"]),
    async (req, res) => {
        const { clientId } = req.body; // Obtém o clientId do corpo da requisição
        const gameRoomsRef = admin.firestore().collection("gameRooms");

        // Verifica o número de salas existentes
        const roomsSnapshot = await gameRoomsRef.get();
        if (roomsSnapshot.size >= gameRules.maxRooms) {
            return res.status(400).send("Número máximo de salas atingido.");
        }

        // Verifica se há salas com menos de 5 jogadores
        let roomFound = false;
        let roomId;
        roomsSnapshot.forEach((doc) => {
            const roomData = doc.data();
            if (roomData.clientIds.length <= gameRules.maxPlayerPerRoom) {
                roomFound = true;
                roomId = doc.id;
                roomData.clientIds.push(clientId); // Adiciona o jogador à sala
                gameRoomsRef.doc(roomId).update(roomData); // Atualiza a sala
            }
        });

        // Se não houver salas disponíveis, cria uma nova
        if (!roomFound) {
            const newRoom = {
                clientIds: [clientId],
            };
            const docRef = await gameRoomsRef.add(newRoom);
            roomId = docRef.id;
        }

        res.status(200).send(roomId);
    }
);

module.exports = router;

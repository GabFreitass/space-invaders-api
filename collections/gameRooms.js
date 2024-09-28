const admin = require("../database/firebase");
const express = require("express");
const router = express.Router();
const gameRules = require("../config/gameRules");
const { validateRequiredFields } = require("../middlewares/validation");

router.post("/clearRooms", async (req, res) => {
    const gameRoomsRef = admin.firestore().collection("gameRooms");
    const snapshot = await gameRoomsRef.get();
    snapshot.forEach(async (doc) => {
        await doc.ref.delete();
    });
    res.status(200).send("All game rooms have been cleared.");
});

router.get("/getAvailableRoom", async (req, res) => {
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
        }
    });

    // Se não houver salas disponíveis, cria uma nova
    if (!roomFound) {
        const newRoom = {
            clientIds: [],
        };
        const docRef = await gameRoomsRef.add(newRoom);
        roomId = docRef.id;
    }

    res.status(200).json({ roomId });
});

router.post(
    "/joinRoom",
    validateRequiredFields(["roomId", "clientId"]),
    async (req, res) => {
        const { roomId, clientId } = req.body; // Obtém o roomId e o clientId como parâmetros do corpo
        const gameRoomsRef = admin.firestore().collection("gameRooms");
        const roomDoc = gameRoomsRef.doc(roomId);
        const roomSnapshot = await roomDoc.get();

        // Verifica se a sala existe
        if (!roomSnapshot.exists) {
            return res.status(404).send("Sala não encontrada.");
        }

        const roomData = roomSnapshot.data();
        if (roomData.clientIds.length > gameRules.maxPlayerPerRoom) {
            return res.status(400).send("Sala está cheia.");
        }

        roomData.clientIds.push(clientId); // Adiciona o jogador à sala
        await roomDoc.update(roomData); // Atualiza a sala

        res.status(200).send("Jogador adicionado à sala com sucesso.");
    }
);

router.delete("/delete", async (req, res) => {
    const { roomId, clientId } = req.query; // Obtém o id da sala e o clientId como parâmetros de consulta

    if (!roomId || !clientId) {
        return res.status(400).send("roomId e clientId são obrigatórios.");
    }

    const gameRoomsRef = admin.firestore().collection("gameRooms");
    const roomDoc = gameRoomsRef.doc(roomId);
    const roomSnapshot = await roomDoc.get();

    // Verifica se a sala existe
    if (!roomSnapshot.exists) {
        return res.status(404).send("Sala não encontrada.");
    }

    const roomData = roomSnapshot.data();
    if (!roomData.clientIds.includes(clientId)) {
        return res.status(400).send("Cliente não pertence a essa sala.");
    }
    const clientIds = roomData.clientIds.filter((id) => id !== clientId); // Remove o clientId do array clientIds

    if (clientIds.length === 0) {
        await roomDoc.delete(); // Deleta a sala se o array clientIds estiver vazio
        return res.status(200).send("Sala deletada com sucesso.");
    } else {
        await roomDoc.update({ clientIds }); // Atualiza a sala com o array clientIds atualizado
        return res.status(200).send("Cliente removido da sala com sucesso.");
    }
});

module.exports = router;

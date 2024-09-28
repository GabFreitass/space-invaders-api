const admin = require("../database/firebase");
const express = require("express");
const router = express.Router();
const gameRules = require("../config/gameRules");

router.get("/getRoom", async (req, res) => {
    const { clientId } = req.query; // Obtém o clientId como parâmetro de consulta
    if (!clientId) {
        return res.status(400).send("clientId é obrigatório.");
    }
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

    res.status(200).json({ roomId });
});

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

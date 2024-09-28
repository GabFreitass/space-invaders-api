const express = require("express");
const authRoutes = require("./collections/auth");
const rankingRoutes = require("./collections/ranking");
const gameRoomsRoutes = require("./collections/gameRooms");
require("dotenv").config(); // para .env funcionar

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/ranking", rankingRoutes);
app.use("/game-room", gameRoomsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = { app };

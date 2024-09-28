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

module.exports = {
    authenticateToken,
};

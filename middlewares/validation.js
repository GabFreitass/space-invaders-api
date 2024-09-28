// Middleware para verificar campos obrigatórios
const validateRequiredFields = (fields) => {
    return (req, res, next) => {
        for (const field of fields) {
            if (!req.body[field]) {
                return res.status(400).send(`Missing required "${field}" field.`);
            }
        }
        next();
    };
};

module.exports = {
    validateRequiredFields,
};

// middlewares/authMiddleware.js
module.exports = (req, res, next) => {
    // Verifica si hay una sesión activa
    if (req.session && req.session.user) {
        return next(); // La sesión existe, continúa con la solicitud
    } else {
        // No hay sesión, redirige al inicio de sesión
        res.redirect('/login');
    }
};

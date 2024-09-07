const express = require('express');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');
const { Console } = require('console');

// Inicializaciones
const app = express();

// Configuración de sesiones
app.use(session({
    secret: 'tu-secreto', // Cambia esto a un valor secreto fuerte
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});
app.use(express.static(path.join(__dirname, 'public')))

// Rutas
app.use(require('./routes/entries.routes'));

// Manejo de error 404
app.use((req, res) => {
    res.status(404).render('404');
})

// Iniciando la aplicación
app.listen(app.get('port'), () => {
    console.log('Servidor iniciado en puerto', app.get('port'));
    
})



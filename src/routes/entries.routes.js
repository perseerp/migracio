const { Router } = require('express');
const router = Router();
const authMiddleware = require('../middlewares/authMiddleware');

const { renderIndex, renderNewEntry, createNewEntry, renderFacturacion, createFacturacion, renderLogin, handleLogin, renderListFacturas, searchFacturas, getClientInfo, updateClientInfo, getCanales, getTiposTercero, getClaseIdentificaciones, getRespFiscales, getTipoPersonas, getRegimenIVAs, renderLogout } = require('../controllers/entries.controller');

router.get('/login', renderLogin);

// Ruta para manejar la autenticación de login
router.post('/login', handleLogin);

// Rutas protegidas
router.use(authMiddleware); // Aplica el middleware a todas las rutas siguientes

router.get('/', renderIndex);

router.get('/new-entry', renderNewEntry);

router.post('/new-entry', createNewEntry);

router.get('/facturacion', renderFacturacion);

router.post('/facturacion', createFacturacion);

router.get('/listado-facturas', renderListFacturas);

// Busqueda de facturas
router.get('/search', searchFacturas);

router.get('/client-info', getClientInfo);

router.post('/update-client-info', updateClientInfo);

router.get('/getCanales', getCanales);
router.get('/getTiposTercero', getTiposTercero);
router.get('/getClaseIdentificaciones', getClaseIdentificaciones);
router.get('/getRespFiscales', getRespFiscales);
router.get('/getTipoPersonas', getTipoPersonas);
router.get('/getRegimenIVAs', getRegimenIVAs);

router.get('/logout', renderLogout);

module.exports = router;
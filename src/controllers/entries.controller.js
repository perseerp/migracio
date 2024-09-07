const bcrypt = require('bcrypt');
const { poolPromise, sql } = require('../db'); // Asegúrate de que el archivo db.js esté en la ruta correcta

const renderIndex  = (req, res) => {
    res.render('index');
}

const renderNewEntry = (req, res) => {
    res.render('new-entry');
}

const createNewEntry = (req, res) => {

}

const createFacturacion = (req, res) => {
    
}

const renderFacturacion = async(req, res) => {
    try {
        // Obtener el pool de conexiones
        const pool = await poolPromise;

        // Obtener datos de resoluciones
        const resultResoluciones = await pool.request().query("SELECT Centro, Centro + ' : ' + Significado AS Expr1 FROM dbo.Resoluciones");
        const resoluciones = resultResoluciones.recordset;

        // // Obtener datos de clientes
        // const resultClientes = await pool.request().query('SELECT * FROM clientes');
        // const clientes = resultClientes.recordset;
        
        // Renderiza la vista con los datos obtenidos
        res.render('facturacion', { resoluciones });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los datos');
    }
}

const renderLogin = (req, res) => {
    res.render('login', { errorMessage: req.query.errorMessage || '' });
}

const handleLogin = async(req, res) => {
    const { email, password } = req.body;
    
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT t.*, u.* FROM dbo.Terceros t INNER JOIN dbo.Users u ON u.usuario = t.Identificacion WHERE t.Email = @email');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            //const isMatch = await bcrypt.compare(password, user.password);
            // const isMatch = password === user.password;
            const isMatch = true;
            if (isMatch) {
                // Almacena la información del usuario en la sesión
                req.session.user = user;
                res.redirect('/'); // Redirige a la página principal si el login es exitoso
            } else {
                res.render('login', { errorMessage: 'Credenciales incorrectas. Por favor verifique los datos ingresados.' });
            }
        } else {
            res.render('login', { errorMessage: 'Credenciales incorrectas. Por favor verifique los datos ingresados.' });
        }
    } catch (err) {
        console.error('Error en la consulta SQL', err);
        res.render('login', { errorMessage: 'Error en el servidor' });
    }
}

const renderListFacturas = async (req, res) => {
    try {
        const query = req.query.query || '';
        const filter = req.query.filter || 'factura_numero';
        const page = parseInt(req.query.page) || 1;
        const pageSize = 15;
        const pageBlockSize = 5;

        const pool = await poolPromise;

        const totalCountResult = await pool.query('SELECT COUNT(*) AS count FROM dbo.Mostrador');
        const totalRecords = totalCountResult.recordset[0].count;
        const totalPages = Math.ceil(totalRecords / pageSize);

        const offset = (page - 1) * pageSize;
        const result = await pool.query`
            SELECT *, FORMAT(Fechafac, 'dd/MM/yyyy') AS FormattedFecha FROM dbo.Mostrador
            ORDER BY Facturanumero
            OFFSET ${offset} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
        `;
        const facturas = result.recordset;

        const startPage = Math.floor((page - 1) / pageBlockSize) * pageBlockSize + 1;
        const endPage = Math.min(startPage + pageBlockSize - 1, totalPages);

        res.render('listado-facturas', {
            facturas,
            page,
            totalPages,
            startPage,
            endPage,
            query,
            filter
        });

    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).send('Error al obtener facturas');
    }
};

const searchFacturas = async (req, res) => {
    const query = req.query.query || '';
    const filter = req.query.filter || 'factura_numero';
    const page = parseInt(req.query.page) || 1;
    const pageSize = 15;
    const pageBlockSize = 5;

    try {
        const pool = await poolPromise;

        let sqlQuery;
        let sqlCountQuery;
        let formattedQueryStart;
        let formattedQueryEnd;

        if (filter === 'fecha') {
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(query)) { // dd/mm/yyyy
                const [day, month, year] = query.split('/');
                formattedQueryStart = `${year}-${month}-${day}`;
                formattedQueryEnd = `${year}-${month}-${parseInt(day) + 1}`;
            } else if (/^\d{2}\/\d{4}$/.test(query)) { // mm/yyyy
                const [month, year] = query.split('/');
                formattedQueryStart = `${year}-${month}-01`;
                formattedQueryEnd = new Date(year, month, 0).toISOString().split('T')[0]; // Último día del mes
            } else if (/^\d{4}$/.test(query)) { // yyyy
                formattedQueryStart = `${query}-01-01`;
                formattedQueryEnd = `${query}-12-31`;
            }

            sqlCountQuery = `SELECT COUNT(*) AS count
                             FROM dbo.Mostrador
                             WHERE Fechafac BETWEEN @startDate AND @endDate`;

            sqlQuery = `SELECT *, FORMAT(Fechafac, 'dd/MM/yyyy') AS FormattedFecha
                        FROM dbo.Mostrador
                        WHERE Fechafac BETWEEN @startDate AND @endDate
                        ORDER BY Facturanumero
                        OFFSET @offset ROWS
                        FETCH NEXT @pageSize ROWS ONLY`;
        } else {
            // Manejo para otros filtros
            switch (filter) {
                case 'cliente':
                    sqlCountQuery = `SELECT COUNT(*) AS count
                                     FROM dbo.Mostrador
                                     WHERE Cliente LIKE '%' + @query + '%'`;

                    sqlQuery = `SELECT *, FORMAT(Fechafac, 'dd/MM/yyyy') AS FormattedFecha
                                FROM dbo.Mostrador
                                WHERE Cliente LIKE '%' + @query + '%'
                                ORDER BY Facturanumero
                                OFFSET @offset ROWS
                                FETCH NEXT @pageSize ROWS ONLY`;
                    break;
                case 'factura_numero':
                default:
                    sqlCountQuery = `SELECT COUNT(*) AS count
                                     FROM dbo.Mostrador
                                     WHERE Facturanumero LIKE '%' + @query + '%'`;

                    sqlQuery = `SELECT *, FORMAT(Fechafac, 'dd/MM/yyyy') AS FormattedFecha
                                FROM dbo.Mostrador
                                WHERE Facturanumero LIKE '%' + @query + '%'
                                ORDER BY Facturanumero
                                OFFSET @offset ROWS
                                FETCH NEXT @pageSize ROWS ONLY`;
                    break;
            }
        }

        console.log(sqlQuery); // Para depuración

        const request = pool.request();
        request.input('query', sql.VarChar, query);
        request.input('offset', sql.Int, (page - 1) * pageSize);
        request.input('pageSize', sql.Int, pageSize);

        if (filter === 'fecha') {
            request.input('startDate', sql.Date, formattedQueryStart);
            request.input('endDate', sql.Date, formattedQueryEnd);
        }

        const countResult = await request.query(sqlCountQuery);
        const totalRecords = countResult.recordset[0].count;
        const totalPages = Math.ceil(totalRecords / pageSize);

        const result = await request.query(sqlQuery);
        const facturas = result.recordset;

        const startPage = Math.floor((page - 1) / pageBlockSize) * pageBlockSize + 1;
        const endPage = Math.min(startPage + pageBlockSize - 1, totalPages);

        res.render('listado-facturas', {
            facturas,
            page,
            totalPages,
            startPage,
            endPage,
            query,
            filter
        });

    } catch (error) {
        console.error('Error al buscar facturas:', error);
        res.status(500).send('Error al buscar facturas');
    }
};

const updateClientInfo = async (req, res) => {
    const { estado, status, canal, tipoTercero, codigo, claseIdentificacion, respFiscal, noIdentificacion, expedidaEn, tipoPersona, regimenIVA } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('estado', sql.VarChar, estado)
            .input('status', sql.VarChar, status)
            .input('canal', sql.VarChar, canal)
            .input('tipoTercero', sql.VarChar, tipoTercero)
            .input('codigo', sql.VarChar, codigo)
            .input('claseIdentificacion', sql.VarChar, claseIdentificacion)
            .input('respFiscal', sql.VarChar, respFiscal)
            .input('noIdentificacion', sql.VarChar, noIdentificacion)
            .input('expedidaEn', sql.VarChar, expedidaEn)
            .input('tipoPersona', sql.VarChar, tipoPersona)
            .input('regimenIVA', sql.VarChar, regimenIVA)
            .query(`UPDATE dbo.Terceros SET 
                    Estado = @estado,
                    Status = @status,
                    Canal = @canal,
                    TipoTercero = @tipoTercero,
                    Codigo = @codigo,
                    ClaseIdentificacion = @claseIdentificacion,
                    RespFiscal = @respFiscal,
                    NoIdentificacion = @noIdentificacion,
                    ExpedidaEn = @expedidaEn,
                    TipoPersona = @tipoPersona,
                    RegimenIVA = @regimenIVA
                    WHERE Identificacion = @noIdentificacion`); // Ajusta la condición WHERE según tu lógica

        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar la información del cliente:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getClientInfo = async (req, res) => {
    const clienteId = req.query.clienteId;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('clienteId', sql.VarChar, clienteId)
            .query('SELECT * FROM dbo.Terceros WHERE Identificacion = @clienteId');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ message: 'Cliente no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener la información del cliente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const getCanales = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT Canal FROM Canales');
        console.log(result.recordset);        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener los statuses:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const getTiposTercero = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM dbo.Statuses');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener los statuses:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const getClaseIdentificaciones = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM dbo.Statuses');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener los statuses:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const getRespFiscales = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM dbo.Statuses');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener los statuses:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const getTipoPersonas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM dbo.Statuses');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener los statuses:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const getRegimenIVAs = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM dbo.Statuses');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener los statuses:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const renderLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login');
    });
};




module.exports = {
    renderLogin,
    handleLogin,
    renderIndex,
    renderNewEntry,
    createNewEntry,
    renderFacturacion,
    createFacturacion,
    renderListFacturas,
    searchFacturas,
    getClientInfo,
    updateClientInfo,
    getCanales, getTiposTercero, getClaseIdentificaciones, getRespFiscales, getTipoPersonas, getRegimenIVAs,   
    renderLogout
}
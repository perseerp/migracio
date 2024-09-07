// db.js
const sql = require('mssql');

// Configuración de la base de datos
const config = {
    user: 'CARGOPACIFIC', // tu usuario de SQL Server
    password: 'CARGOPACIFIC', // tu contraseña de SQL Server
    server: 'ANALISTA2/SQLEXPRESS', // por ejemplo: localhost o una IP
    database: 'CARGOPACIFIC', // el nombre de tu base de datos
    options: {
        encrypt: true, // true si usas Azure
        trustServerCertificate: true // cambiar a true si estás en desarrollo local
    }
};

// Crear una conexión de pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Conectado a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Error de conexión a SQL Server', err);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};

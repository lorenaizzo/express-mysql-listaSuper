const express = require('express');
const mysql = require('mysql');
const util = require('util');

const app = express();
const port = 3000;
app.use(express.json()); //permite el mapeo de la peticion json a object js

// Conexion con mysql
const conexion = mysql.createConnection({
    host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'listacompras'
});

conexion.connect((error)=>{
    if(error) {
        throw error;
    }

    console.log('Conexion con la base de datos mysql establecida');
});

const qy = util.promisify(conexion.query).bind(conexion); // permite el uso de asyn-await en la conexion mysql


// Desarrollo de la logica de negocio

/**
 * Categoria de productos
 * GET para devolver todas las categorias
 * GET id para devolver uno solo
 * POST guardar una categoria nueva
 * PUT para modificar una categoria existente
 * DELETE para borrar una categoria existente
 * 
 * Ruta -> /categoria
 */

 app.get('/categoria', async (req, res) => {
    try {
        const query = 'SELECT * FROM categoria';
        
        const respuesta = await qy(query);

        res.send({"respuesta": respuesta});

    }
    catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });

 app.get('/categoria/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM categoria WHERE id = ?';

        const respuesta = await qy(query, [req.params.id]);
        console.log(respuesta);

        res.send({"respuesta": respuesta});
    }
    catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });


 app.post('/categoria', async (req, res) => {
    try {
        // Valido que me manden correctamente la info
        if (!req.body.nombre) {
            throw new Error('Falta enviar el nombre');
        }

        // Verifico que no exista previamente esa categoria
        let query = 'SELECT id FROM categoria WHERE nombre = ?';

        let respuesta = await qy(query, [req.body.nombre.toUpperCase()]);

        if (respuesta.length > 0) { 
            throw new Error('Esa categoria ya existe');
        }

        // Guardo la nueva categoria
        query = 'INSERT INTO categoria (nombre) VALUE (?)';
        respuesta = await qy(query, [nombre]);

        res.send({'respuesta': respuesta.insertId});


    }   
    catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });


 app.put('/categoria/:id', async (req, res)=>{
     try {
        
        if (!req.body.nombre) {
            throw new Error("No enviaste el nombre");
        }
        
        let query = 'SELECT * FROM categoria WHERE nombre = ? AND id <> ?';

        let respuesta = await qy(query, [req.body.nombre, req.params.id]);

        if (respuesta.length > 0) {
            throw new Error("El nombre de la categoria que queres poner ahora ya existe");
        }

        query = 'UPDATE categoria SET nombre = ? WHERE id = ?';

        respuesta = await qy(query, [req.body.nombre.toUpperCase(), req.params.id]);

        res.send({"respuesta": respuesta.affectedRows});

     }
     catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });

 app.delete('/categoria/:id', async (req, res) => {
     try {
        let query = 'SELECT * FROM producto WHERE categoria_id = ?';

        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0) {
            throw new Error("Esta categoria tiene productos asociados, no se puede borrar");
        }

        query = 'DELETE FROM categoria WHERE id = ?';

        respuesta = await qy(query, [req.params.id]);

        res.send({'respuesta': respuesta.affectedRows});

     }
     catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });

 /**
  * Productos
  * 
  * Ruta -> /producto
  */

 app.post('/producto', async(req, res) => {
    try {
        if (!req.body.nombre || !req.body.categoria_id) {
            throw new Error("No enviaste los datos obligatorios que son nombre y categoria");
        }

        let query = 'SELECT * FROM categoria WHERE id = ?';
        let respuesta = await qy(query, [req.body.categoria_id]);

        if (respuesta.length == 0) {
            throw new Error("Esa categoria no existe");
        }

        query = 'SELECT * FROM producto WHERE nombre = ?';
        respuesta = await qy(query, [req.body.nombre.toUpperCase()]);

        if (respuesta.length > 0) {
            throw new Error("Ese nombre de producto ya existe");
        }

        let descripcion = '';
        if (req.body.descripcion) {
            descripcion = req.body.descripcion;
        }

        query = 'INSERT INTO producto (nombre, descripcion, categoria_id) VALUES (?, ?, ?)';
        respuesta = await qy(query, [req.body.nombre.toUpperCase(), descripcion, req.body.categoria_id]);

        res.send({'respuesta': respuesta.insertId});

    }
    catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });

 app.get('/producto', async (req, res) => {
     try {
        const query = 'SELECT * FROM producto';

        const respuesta = await qy(query);
        res.send({'respuesta': respuesta});
     }
    catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });

 app.get('/producto/:id', async (req, res) => {
    try {
       const query = 'SELECT * FROM producto WHERE id = ?';

       const respuesta = await qy(query, [req.params.id]);
       res.send({'respuesta': respuesta});
    }
   catch(e){
       console.error(e.message);
       res.status(413).send({"Error": e.message});
   }
});

app.put('/producto/:id', async (req, res) => {
    try {
        if (!req.body.nombre || !req.body.categoria_id) {
            throw new Error("No se enviaron los datos necesarios para hacer un update");
        }

        // Verifico que no se repita el nombre
        let query = 'SELECT * FROM producto WHERE nombre = ? AND id <> ?';

       let respuesta = await qy(query, [req.body.nombre.toUpperCase(), req.params.id]);

        if (respuesta.length > 0) {
            throw new Error('Ese nombre de producto ya existe');
        }

        // Verifico que la categoria exista
        query = 'SELECT * FROM categoria WHERE id = ?';
        respuesta = await qy(query, [req.body.categoria_id]);

        if (respuesta.length == 0) {
            throw new Error('No existe la categoria');
        }

        let descripcion = '';
        if(req.body.descripcion) {
            descripcion = req.body.descripcion;
        }
        // Hago el update
        query = 'UPDATE producto SET nombre = ?, descripcion = ?, categoria_id = ? WHERE id = ?';
        respuesta = await qy(query, [req.body.nombre, descripcion, req.body.categoria_id, req.params.id]);

        res.send({'respuesta': respuesta});
    }
   catch(e){
       console.error(e.message);
       res.status(413).send({"Error": e.message});
   }
});

app.delete('/producto/:id', async (req, res) => {
    try {
       let query = 'SELECT * FROM listaitems WHERE producto_id = ?';

       let respuesta = await qy(query, [req.params.id]);

       if (respuesta.length > 0) {
           throw new Error("Este producto tiene items asociados, no se puede borrar");
       }

       query = 'DELETE FROM producto WHERE id = ?';

       respuesta = await qy(query, [req.params.id]);

       res.send({'respuesta': respuesta.affectedRows});

    }
    catch(e){
       console.error(e.message);
       res.status(413).send({"Error": e.message});
   }
});


/**
 * Listas de compras
 * 
 * Ruta -> /lista
 */

 app.get('/lista', async (req, res) =>{
     try {
        // Devuelvo los encabezados de todas las listas
        const query = 'SELECT * FROM listaencabezado';
        const respuesta = await qy(query);
        
        res.send({'respuesta': respuesta});

     }
     catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });

 app.get('/lista/:id', async (req, res) =>{
    try {
       // Devuelvo el encabezado y los items de una lista

       let query = 'SELECT * FROM listaencabezado WHERE id = ?';
       let respuesta = await qy(query, [req.params.id]);
       
       if (respuesta.length == 0) { //Hubo error, no encontro el encabezado
            throw new Error('No se encontro la lista');
       }
       
       // Me guardo en encabezado para despues armar un objeto con los items
       // si devuelve, como los ids siempre son unicos, va a ser un 
       // array con una unica posicion (posicion 0 porque los vectores arrancan de cero)
       const encabezado = respuesta[0]; 

       query = 'SELECT * FROM listaitems WHERE listaencabezado_id = ?';
       respuesta = await qy(query, [req.params.id]);

       const lista = {
           encabezado: encabezado,
           items: respuesta
       }

       res.send({'respuesta': lista});

    }
    catch(e){
       console.error(e.message);
       res.status(413).send({"Error": e.message});
   }
 });

 app.post('/lista', async (req, res) => {
     try {
        /*
        La estructura de lo que me van a mandar tiene tanto el encabezado
        como los items, seria:
            nombre: "Lista de ejemplo",
            items: [
                {
                    producto_id: 11,
                    cantidad: 11,

                },
                {
                    producto_id: 22,
                    cantidad: 11,
                    
                }
            ]

        Nosotros tenemos que:
        1. Guardar el nombre en la tabla listaencabezado
        2. Tomar el id que le asigno la base de datos a ese encabezado
        3. Guardar cada uno de los items incluyendo el id del encabezado
        verificando previamente que los productos existan
        */    

        if (!req.body.nombre || req.body.items.length == 0) {
            throw new Error('Existen errores que impiden guardar');
        }
        
        // Verifico que los ids de productos existan todos
        // Ref: https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/some
        const existen = req.body.items.some(async item =>{
            const query = 'SELECT id FROM producto WHERE id = ?';
            const respuesta = await qy(query, item.producto_id);

            if (respuesta.length == 0) {
                return false;
            }
            else {
                return true;
            }
        });

        if (!existen) {
            throw new Error('Al menos uno de los productos no existe')
        }

        // Guardo el encabezado, no me importa que sea unico por eso
        // no compruebo que el nombre sea unico

        let query = 'INSERT INTO listaencabezado (nombre) VALUE (?)';
        let respuesta = await qy(query, [req.body.nombre]);

        const encabezado_id = respuesta.insertId;

        // Ref: https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Array/map
        const items = req.body.items.map(item =>{
            i= {
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                listaencabezado_id: encabezado_id
            }

            return i;
        });

        // Guardo los items
        // Ref: https://www.w3schools.com/nodejs/nodejs_mysql_insert.asp

        query = 'INSERT INTO listaitems (producto_id, cantidad, listaencabezado_id) VALUES ?';

        const values = items.map(item=>Object.values(item));

        respuesta = await qy(query, [values]);

        console.log(respuesta);
        res.send({'respuesta':respuesta});

     }
    catch(e){
       console.error(e.message);
       res.status(413).send({"Error": e.message});
   }
 });

 app.put('/lista/:id', (req, res) =>{
    res.status(404).send({"Mensaje": "Metodo no permitido"});
});

app.delete('/lista/id', async (req, res) =>{
    try {
        // Borro todos los items y luego el encabezado
        let query = 'DELETE FROM listaitems WHERE listaencabezado = ?';
        let respuesta = await qy(query, [req.params.id]);

        query = 'DELETE FROM listaencabezado WHERE id = ?';
        respuesta = await qy(query, [req.params.id]);

        res.send({"Mensaje": "Se borro correctamente la lista"});
    }
    catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
});

/**
 * BONUS TRACK
 * 
 * Borrado de 1 item de la lista
 */
 app.put('/lista/:id/producto/:producto_id', async (req, res)=>{
    try {
        const query = 'DELETE FROM listaitems WHERE id = ? AND listaencabezado_id = ?';
        const respuesta = await qy(query, [req.params.producto_id, req.params.id]);

        res.send({'Mensaje': "Se borro correctamente"});
    }
    catch(e){
        console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });



// Servidor
app.listen(port, ()=>{
    console.log('Servidor escuchando en el puerto ', port);
});
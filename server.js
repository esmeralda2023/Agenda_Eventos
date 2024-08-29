const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000/eventos', // Cambia por el dominio correcto
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Conectar a la base de datos SQLite
let db = new sqlite3.Database('./agenda.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conectado a la base de datos SQLite.');
});

// Crear la tabla de eventos si no existe
db.run(`CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  descripcion TEXT
)`);

// Ruta para obtener todos los eventos
app.get('/eventos', (req, res) => {
  const sql = 'SELECT * FROM eventos';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ eventos: rows });
  });
});


// Ruta para agregar un nuevo evento
app.post('/eventos', (req, res) => {
  const { titulo, fecha, descripcion } = req.body;
  if (!titulo || !fecha) {
    return res.status(400).json({ mensaje: 'Título y fecha son requeridos.' });
  }

  // Verificar si ya existe un evento para esa fecha
  const checkSql = 'SELECT * FROM eventos WHERE fecha = ?';
  db.get(checkSql, [fecha], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
      
    }

    if (row) {
      // Si ya existe un evento para esa fecha, enviar un mensaje de error
      res.status(400).json({ error: 'Ya existe un evento para esta fecha.' });
    } else {
      // Insertar el nuevo evento
      const sql = 'INSERT INTO eventos (titulo, fecha, descripcion) VALUES (?, ?, ?)';
      const params = [titulo, fecha, descripcion];
      db.run(sql, params, function (err) {
        if (err) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.json({
          mensaje: 'Evento agregado exitosamente',
          id: this.lastID,
        });
      });
    }
  });
});

// Ruta para editar un evento
app.put('/eventos/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, fcha, descripcion } = req.body;
  const sql = 'UPDATE eventos SET titulo = ?, fecha = ?, descripcion = ? WHERE id = ?';
  db.run(sql, [titulo, fecha, descripcion, id], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ mensaje: 'Evento actualizado exitosamente' });
  });
});

// Ruta para eliminar un evento
app.delete('/eventos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM eventos WHERE id = ?';
  db.run(sql, id, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ mensaje: 'Evento eliminado exitosamente' });
  });
});


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
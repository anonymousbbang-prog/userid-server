const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const DATA_FILE = path.join(__dirname, "ids_store.csv");
const USER_FILE = path.join(__dirname, "last_user.json");

let lastUser = "";

// Cargar el archivo de usuario guardado al iniciar
if (fs.existsSync(USER_FILE)) {
  try {
    const obj = JSON.parse(fs.readFileSync(USER_FILE, "utf8"));
    if (obj && obj.lastUser) {
      lastUser = obj.lastUser;
      console.log("🧠 Cargado último User desde archivo:", lastUser);
    }
  } catch(e) {
    console.warn("⚠️ No se pudo parsear last_user.json:", e.message);
  }
}

// Middleware para capturar body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 📩 Endpoint para recibir datos
app.post("/recibir", (req, res) => {
  let user_id = "";
  let user_name = "";

  if (req.is("application/json")) {
    user_id = (req.body.user_id || "").toString().trim();
    user_name = (req.body.User || "").toString().trim();
  } else if (req.is("application/x-www-form-urlencoded")) {
    user_id = (req.body.user_id || "").toString().trim();
    user_name = (req.body.User || "").toString().trim();
  } else {
    user_id = req.body?.user_id ? req.body.user_id.toString().trim() : "";
    user_name = req.body?.User ? req.body.User.toString().trim() : "";
  }

  // Si vino un nombre de usuario, lo guardamos para el siguiente envío
  if (user_name) {
    lastUser = user_name;
    fs.writeFileSync(USER_FILE, JSON.stringify({lastUser}), "utf8");
    console.log("🧠 Guardado último User:", lastUser);
    res.send("OK (User guardado)");
    return;
  }

  // Si vino un user_id, lo guardamos junto al último User
  if (user_id) {
    const cleanId = user_id.replace(/[^\w\-@\.]/g, "");
    const cleanUser = lastUser ? lastUser.replace(/[^\w\s\-@\.]/g, "") : "-";
    const line = `${new Date().toISOString()},${cleanId},${cleanUser}\n`;
    fs.appendFileSync(DATA_FILE, line, { flag: "a" });
    console.log("✅ Guardado:", cleanId, "(", cleanUser, ")");
    res.send("OK (User ID guardado)");
    return;
  }

  res.status(400).send("Sin datos válidos");
});

// 🎯 Middleware para restringir acceso a /lista solo desde IP específica
app.get("/lista", (req, res, next) => {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || "").split(",")[0].trim();
  const allowedIp = "188.77.187.80";

  if (clientIp === allowedIp) {
    next();
  } else {
    res.status(403).send("Acceso denegado");
  }
}, (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    res.send(`
      <html>
      <head><title>Lista vacía</title></head>
      <body style="font-family:sans-serif; text-align:center;">
        <h2>No hay datos todavía 📭</h2>
      </body>
      </html>
    `);
    return;
  }

  const contenido = fs.readFileSync(DATA_FILE, "utf8").trim().split("\n");
  const filas = contenido.map(line => {
    const [fecha, id, user] = line.split(",");
    return `<tr><td>${fecha}</td><td>${id}</td><td>${user}</td></tr>`;
  }).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
    <head>
      <title>Lista de user_id</title>
      <style>
        body { font-family: sans-serif; margin: 40px; background: #fafafa; color: #333; }
        table { border-collapse: collapse; width: 100%; max-width: 700px; margin: auto; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
        th { background: #f0f0f0; }
        h2 { text-align: center; }
      </style>
    </head>
    <body>
      <h2>📋 Lista de user_id y User</h2>
      <table>
        <tr><th>Fecha</th><th>User ID</th><th>User</th></tr>
        ${filas}
      </table>
    </body>
    </html>
  `);
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

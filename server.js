const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const DATA_FILE = path.join(__dirname, "ids_store.csv");
const USER_FILE = path.join(__dirname, "last_user.json");

let lastUser = "";

// 🧠 Cargar último usuario guardado si existe
if (fs.existsSync(USER_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(USER_FILE, "utf8"));
    if (saved.lastUser) {
      lastUser = saved.lastUser;
      console.log("🧠 Cargado último User desde archivo:", lastUser);
    }
  } catch (e) {
    console.warn("⚠️ No se pudo leer last_user.json:", e.message);
  }
}

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 📩 Endpoint principal
app.post("/recibir", (req, res) => {
  console.log("📦 Datos recibidos:", req.body);

  const user_id = (req.body.user_id || "").toString().trim();
  const user_name = (req.body.User || "").toString().trim();

  // Si viene un nombre de usuario (desde _ta2443.as)
  if (user_name && user_name.length > 0) {
    lastUser = user_name;
    fs.writeFileSync(USER_FILE, JSON.stringify({ lastUser }), "utf8");
    console.log(`🧠 Guardado nuevo User: ${lastUser}`);
    res.send("OK (User guardado)");
    return;
  }

  // Si viene un ID (desde _uq4405.as)
  if (user_id && user_id.length > 0) {
    const cleanId = user_id.replace(/[^\w\-@\.]/g, "");
    const cleanUser = lastUser ? lastUser.replace(/[^\w\s\-@\.]/g, "") : "-";
    const line = `${new Date().toISOString()},${cleanId},${cleanUser}\n`;

    fs.appendFileSync(DATA_FILE, line, { flag: "a" });
    console.log(`✅ Guardado user_id: ${cleanId} (User: ${cleanUser})`);
    res.send("OK (user_id guardado)");
    return;
  }

  res.status(400).send("❌ Sin datos válidos");
});

// 🔒 Protección IP en /lista
app.get("/lista", (req, res, next) => {
  const clientIp =
    (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .split(",")[0]
      .trim();

  const allowedIp = "188.77.187.80";

  if (clientIp === allowedIp || clientIp.endsWith("188.77.187.80")) {
    next();
  } else {
    console.warn("🚫 Intento de acceso bloqueado desde IP:", clientIp);
    res.status(403).send("Acceso denegado");
  }
});

// 📄 Página de lista
app.get("/lista", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    res.send(`<h2>No hay datos todavía 📭</h2>`);
    return;
  }

  const contenido = fs.readFileSync(DATA_FILE, "utf8").trim().split("\n");
  const filas = contenido
    .map((line) => {
      const [fecha, id, user] = line.split(",");
      return `<tr><td>${fecha}</td><td>${id}</td><td>${user}</td></tr>`;
    })
    .join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
    <head>
      <title>Lista de IDs</title>
      <style>
        body { font-family: sans-serif; margin: 40px; background: #fafafa; color: #333; }
        table { border-collapse: collapse; width: 100%; max-width: 700px; margin: auto; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
        th { background: #f0f0f0; }
        h2 { text-align: center; }
      </style>
    </head>
    <body>
      <h2>📋 Lista de User IDs y Users</h2>
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
app.listen(PORT, () =>
  console.log(`Servidor escuchando en puerto ${PORT}`)
);

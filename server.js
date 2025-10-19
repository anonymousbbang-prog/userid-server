const express = require("express");
const fs = require("fs");
const app = express();

// 📂 Servir archivos estáticos (como crossdomain.xml)
app.use(express.static("public"));

// Middleware para aceptar JSON y formularios normales
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 📩 Endpoint para recibir user_id o User
app.post("/recibir", (req, res) => {
  let user_id = "";
  let user_name = "";

  // Detectar tipo de contenido
  if (req.is("application/json") || req.is("application/x-www-form-urlencoded")) {
    user_id = (req.body.user_id || "").toString().trim();
    user_name = (req.body.User || "").toString().trim();
  } else {
    user_id = req.body?.user_id ? req.body.user_id.toString().trim() : "";
    user_name = req.body?.User ? req.body.User.toString().trim() : "";
  }

  // Limpiar caracteres sospechosos
  const clean_id = user_id.replace(/[^\w\-@\.]/g, "");
  const clean_name = user_name.replace(/[^\w\-@\.]/g, "");

  // Evitar guardar vacío
  if (!clean_id && !clean_name) {
    res.status(400).send("Falta user_id o User");
    return;
  }

  // Guardar en CSV con fecha, user_id y user_name
  const line = `${new Date().toISOString()},${clean_id || "-"},${clean_name || "-"}\n`;
  fs.appendFileSync("ids_store.csv", line, { flag: "a" });

  res.send("OK");
});

// 📄 Endpoint para ver los IDs guardados (HTML)
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
      <title>Lista de usuarios</title>
      <style>
        body { font-family: sans-serif; margin: 40px; background: #fafafa; color: #333; }
        table { border-collapse: collapse; width: 100%; max-width: 700px; margin: auto; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
        th { background: #f0f0f0; }
        h2 { text-align: center; }
      </style>
    </head>
    <body>
      <h2>📋 Lista de user_id y nombres recibidos</h2>
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

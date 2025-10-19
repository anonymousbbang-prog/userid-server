const express = require("express");
const fs = require("fs");
const app = express();

// 📂 Servir archivos estáticos (como crossdomain.xml)
app.use(express.static("public"));

// Middleware para aceptar JSON y formularios normales
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 📩 Endpoint para recibir user_id
app.post("/recibir", (req, res) => {
  let user_id = "";

  // Detectar el tipo de contenido
  if (req.is("application/json")) {
    user_id = (req.body.user_id || "").toString().trim();
  } else if (req.is("application/x-www-form-urlencoded")) {
    user_id = (req.body.user_id || "").toString().trim();
  } else {
    // Intento genérico si el Content-Type no se reconoce
    user_id = req.body?.user_id ? req.body.user_id.toString().trim() : "";
  }

  if (!user_id) {
    res.status(400).send("Falta user_id");
    return;
  }

  // Limpiar caracteres raros
  const clean = user_id.replace(/[^\w\-@\.]/g, "");

  // Guardar en CSV con fecha y hora ISO
  const line = `${new Date().toISOString()},${clean}\n`;
  fs.appendFileSync("ids_store.csv", line, { flag: "a" });

  res.send("OK");
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
      const [fecha, id] = line.split(",");
      return `<tr><td>${fecha}</td><td>${id}</td></tr>`;
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
        <tr><th>Fecha</th><th>User ID</th></tr>
        ${filas}
      </table>
    </body>
    </html>
  `);
});

// 🚀 Iniciar el servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

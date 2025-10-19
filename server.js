const express = require("express");
const fs = require("fs");
const app = express();

// Middleware para aceptar JSON, formularios y texto plano
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.text()); // <- Agregado para capturar body tipo text/plain (Flash a veces lo usa)

// 📩 Endpoint para recibir user_id y usuario
app.post("/recibir", (req, res) => {
  let user_id = "";
  let usuario = "";

  try {
    // Si viene en formato texto plano (Flash viejo)
    if (typeof req.body === "string") {
      const partes = req.body.split("&");
      partes.forEach((p) => {
        const [key, value] = p.split("=");
        if (key === "user_id") user_id = decodeURIComponent(value || "");
        if (key === "usuario") usuario = decodeURIComponent(value || "");
      });
    } else {
      // Si viene como JSON o form-urlencoded normal
      user_id = (req.body.user_id || "").toString().trim();
      usuario = (req.body.usuario || "").toString().trim();
    }
  } catch (err) {
    console.error("❌ Error procesando datos:", err);
  }

  if (!user_id) {
    res.status(400).send("Falta user_id");
    return;
  }

  // Limpiar caracteres raros
  const cleanID = user_id.replace(/[^\w\-@\.]/g, "");
  const cleanUser = usuario.replace(/[^\w\s\-\.\@\_]/g, "");

  // Guardar en CSV con fecha y hora ISO
  const line = `${new Date().toISOString()},${cleanUser || "-"},${cleanID}\n`;
  fs.appendFileSync("ids_store.csv", line, { flag: "a" });

  console.log(`✅ Guardado: ${cleanUser} (${cleanID})`);
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
      const [fecha, usuario, id] = line.split(",");
      return `<tr><td>${fecha}</td><td>${usuario || "-"}</td><td>${id}</td></tr>`;
    })
    .join("");

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
      <h2>📋 Lista de datos recibidos</h2>
      <table>
        <tr><th>Fecha</th><th>Usuario</th><th>User ID</th></tr>
        ${filas}
      </table>
    </body>
    </html>
  `);
});

// 🚀 Iniciar el servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

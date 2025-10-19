const express = require("express");
const fs = require("fs");
const app = express();

// Middleware normal
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 📩 Endpoint para recibir user_id y usuario
app.post("/recibir", (req, res) => {
  let bodyData = "";

  req.on("data", (chunk) => {
    bodyData += chunk.toString();
  });

  req.on("end", () => {
    let user_id = "";
    let usuario = "";

    // Intentar parsear si vino vacío por los middlewares
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        user_id = (req.body.user_id || "").toString().trim();
        usuario = (req.body.usuario || "").toString().trim();
      } else if (bodyData.includes("=")) {
        // Parse manual de formato Flash: "user_id=xxx&usuario=yyy"
        bodyData.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");
          if (key === "user_id") user_id = decodeURIComponent(value || "");
          if (key === "usuario") usuario = decodeURIComponent(value || "");
        });
      }
    } catch (err) {
      console.error("⚠️ Error parseando body:", err);
    }

    if (!user_id) {
      console.log("❌ Falta user_id en el body recibido:", bodyData);
      res.status(400).send("Falta user_id");
      return;
    }

    // Limpiar texto
    const cleanID = user_id.replace(/[^\w\-@\.]/g, "");
    const cleanUser = usuario.replace(/[^\w\s\-\.\@\_]/g, "");

    // Guardar en CSV
    const line = `${new Date().toISOString()},${cleanUser || "-"},${cleanID}\n`;
    fs.appendFileSync("ids_store.csv", line, { flag: "a" });

    console.log(`✅ Recibido de Flash: ${cleanUser} (${cleanID})`);
    res.send("OK");
  });
});

// 📄 Endpoint para ver registros
app.get("/lista", (req, res) => {
  const file = "ids_store.csv";

  if (!fs.existsSync(file)) {
    res.send(`
      <html><head><title>Lista vacía</title></head>
      <body style="font-family:sans-serif;text-align:center;">
        <h2>No hay datos todavía 📭</h2>
      </body></html>
    `);
    return;
  }

  const contenido = fs.readFileSync(file, "utf8").trim().split("\n");

  const filas = contenido
    .map((line) => {
      const [fecha, usuario, id] = line.split(",");
      return `<tr><td>${fecha}</td><td>${usuario || "-"}</td><td>${id}</td></tr>`;
    })
    .join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
      <head>
        <title>Lista de datos recibidos</title>
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

// 🚀 Servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

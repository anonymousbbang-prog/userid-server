const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/recibir", (req, res) => {
  const user_id = (req.body.user_id || "").toString().trim();
  if (!user_id) return res.status(400).send("Falta user_id");
  const clean = user_id.replace(/[^\w\-@\.]/g, "");
  const line = new Date().toISOString() + "," + clean + "\n";
  fs.appendFileSync("ids_store.csv", line, { flag: "a" });
  res.send("OK");
});

app.get("/lista", (req, res) => {
  const file = "ids_store.csv";
  if (!fs.existsSync(file)) return res.send("No hay datos todavía");
  res.setHeader("Content-Type", "text/plain");
  res.send(fs.readFileSync(file, "utf8"));
});

app.listen(10000, () => console.log("Servidor escuchando en puerto 10000"));

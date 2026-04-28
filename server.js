import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("AlertSakha backend is live 🚀");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Running on ${PORT}`);
});

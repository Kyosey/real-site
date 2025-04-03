const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const users = { "user1": "password123" }; // Stockage temporaire

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,    // Assure que les cookies ne sont pas accessibles par JavaScript
      secure: false,     // true si tu utilises HTTPS
      sameSite: 'strict' // Empêche les cookies d'être envoyés avec des requêtes inter-domaines
    }
  })
);

const csrfTokens = new Map(); // Stockage des tokens CSRF

// Route pour afficher la version vulnérable
app.get("/vulnerable", (req, res) => {
  res.send(`
    <h1>🔴 Modifier le mot de passe (Sans protection)</h1>
    <p>Mot de passe actuel : <strong>${users["user1"]}</strong></p>
    <form action="/vulnerable" method="post">
        <input type="text" name="new_password" placeholder="Nouveau mot de passe">
        <input type="submit" value="Changer">
    </form>
  `);
});

// Route pour afficher la version sécurisée
app.get("/secure", (req, res) => {
    const csrfToken = crypto.randomBytes(16).toString("hex");
    csrfTokens.set(req.session.id, csrfToken); // Associe le token à la session

    res.send(`
        <h1>🟢 Modifier le mot de passe (Avec protection CSRF)</h1>
        <p>Mot de passe actuel : <strong>${users["user1"]}</strong></p>
        <form action="/secure" method="post">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            <input type="text" name="new_password" placeholder="Nouveau mot de passe">
            <input type="submit" value="Changer">
        </form>
    `);
});

// Route pour changer le mot de passe (Vulnérable)
app.post("/vulnerable", (req, res) => {
    users["user1"] = req.body.new_password; // ⚠️ CHANGE LE MOT DE PASSE SANS VÉRIFICATION
    res.send("🔴 Mot de passe changé !");
});

// Route pour changer le mot de passe (Sécurisé)
app.post("/secure", (req, res) => {
    const token = req.body.csrf_token;
    if (!token || token !== csrfTokens.get(req.session.id)) {
        return res.send("🚨 Échec : CSRF détecté !");
    }
    users["user1"] = req.body.new_password;
    res.send("🟢 Mot de passe changé avec succès !");
});

// API pour récupérer le mot de passe actuel (Utilisé en AJAX)
app.get("/current-password", (req, res) => {
    res.json({ password: users["user1"] });
});

app.listen(3000, () => console.log("✅ Serveur AppA sur http://localhost:3000"));
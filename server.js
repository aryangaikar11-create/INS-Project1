const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "mfa_secret_key",
    resave: false,
    saveUninitialized: true
}));

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mfa_system"
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ Database Connected");
});

// LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password],
        (err, result) => {
            if (result.length > 0) {
                const otp = Math.floor(100000 + Math.random() * 900000);
                req.session.otp = otp;
                req.session.auth = true;

                console.log("🔐 OTP:", otp); // Simulated SMS/Email

                res.redirect("/otp.html");
            } else {
                res.send("❌ Invalid Username or Password");
            }
        }
    );
});

// OTP VERIFY
app.post("/verify-otp", (req, res) => {
    if (req.session.auth && req.body.otp == req.session.otp) {
        req.session.verified = true;
        res.redirect("/success");
    } else {
        res.send("❌ Invalid OTP");
    }
});

// SUCCESS PAGE (GET – FIXES 405 ERROR)
app.get("/success", (req, res) => {
    if (req.session.verified) {
        res.sendFile(path.join(__dirname, "public", "success.html"));
    } else {
        res.redirect("/login.html");
    }
});

app.listen(3000, () => {
    console.log("🚀 Server running at http://localhost:3000/login.html");
});
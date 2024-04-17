const path = require("path");
const express = require("express");
const app = express();
const connection = require("./connection.js");

app.use(express.static(path.join(__dirname, "public")));
// middleware
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs');


//routes 
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

app.get("/cards", (req, res) => {
    connection.query("SELECT * FROM card", (err, results) => {
        if (err) throw err;
        res.render("cards", { cards: results });
    });
});

app.get("/cards/:cardId", (req, res) => {
    const cardId = req.params.cardId;
    connection.query("SELECT * FROM card WHERE card_id = ?", [cardId], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const card = results[0];
            res.render("card_details", { card });
        } else {
            res.status(404).send("Card not found");
        }
    });
});

app.get("/expansions", (req, res) => {
    res.render("expansions");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

connection.connect((err) => {
    if(err){
        return console.log(err.message);
    } else {
        return console.log(`Connection to MySQL DB is successful`);
    };
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running at http://localhost:3000");
});

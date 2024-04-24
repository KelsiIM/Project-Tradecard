const path = require("path");
const express = require("express");
const db = require("./connection.js");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")));

const oneHour = 1000 * 60 * 60 * 1;

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(sessions({
    secret: "secretpassword123",
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));

//routes 
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/dashboard", (req, res) => {
    const sessionobj = req.session;
    if (sessionobj.authen) {
        const uid = sessionobj.authen;
        const user = `SELECT * FROM user WHERE user_id = "${uid}"`;

        db.query(user, (err, row) => {
            const firstrow = row[0];
            res.render("dashboard", { userdata: firstrow });
        });
    } else {
        res.redirect("login");
    }
});

app.get("/cards", (req, res) => {
    let readsql = `SELECT * FROM card;`;
    db.query(readsql, (err, rows) => {
        if (err) throw err;
        res.render("cards", { title: "All Cards", rowdata: rows });
    });
});

app.get("/card_details", (req, res) => {
    const cardId = req.query.card_id;
    let readsql = `SELECT card.card_name, card.url_image, card.value_price, card.card_number, card.illustrator, card.rarity, 
    expansion.expansion_name, expansion.release_date, card.format, card.regulation_mark, card.HP, card.ability_description, 
    card.attack_description, card.card_rule_description, card.weakness, card.resistance, card.stage, card.energy_type, 
    card_type.type_name
    FROM card
    INNER JOIN
    expansion ON card.expansion_id = expansion.expansion_id
    INNER JOIN
    card_type ON card.card_type_id = card_type.card_type_id
    WHERE card.card_id = ?`;

    db.query(readsql, [cardId],(err, rows) => {
        if(err) throw err;
        if(rows.length > 0) {
        res.render("card_details", {card: rows[0]});    
        };
    });
});

app.get("/expansions", (req, res) => {
    res.render("expansions");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const useremail = req.body.emailField;
    const plainpassword = req.body.passwordField;

    const checkuser = `SELECT * FROM user WHERE email = "${useremail}"`;

    db.query(checkuser, [useremail], async (err, rows) => {
        if (err) throw err;
        const numRows = rows.length;

        if (numRows > 0) {
            const hashedpassword = rows[0].password;
            const match = await bcrypt.compare(plainpassword, hashedpassword);

            if (match) {
                const sessionobj = req.session;
                sessionobj.authen = rows[0].user_id
                res.redirect("dashboard");
            } else {
                res.redirect("login");
            }
        } else {
            res.redirect("login");
        }
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect("/");
    });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const useremail = req.body.emailField;
    const hashedpassword = await bcrypt.hash(req.body.passwordField, 10);
    const username = req.body.usernameField;
    const usercomment = req.body.commentField;


    const userinsert = `INSERT INTO user (email, password, username, comment) VALUES (?, ?, ?, ?)`;

    db.query(userinsert, [useremail, hashedpassword, username, usercomment], (err, rows) => {
        if (err) throw err;
        res.redirect("dashboard")
    });
});

app.get("/update-user", (req, res) => {
    res.render("update-user");
});




app.get("/delete-user", (req, res) => {
    res.render("delete-user");
});

app.post("/delete-user", (req, res) => {
    const userid = req.session.authen;

    const deleteUser = `DELETE FROM user WHERE user_id = ?`;

    db.query(deleteUser, [userid], (err, result) => {
        if (err) throw err;
        req.session.destroy((err) => {
            if (err) throw err;
            res.redirect("/");
        });
    });
});



db.connect((err) => {
    if (err) {
        return console.log(err.message);
    } else {
        return console.log(`Connection to MySQL DB is successful`);
    };
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running at http://localhost:3000");
});

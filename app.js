const path = require("path");
const express = require("express");
const db = require("./connection.js"); //database connection
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const bcrypt = require("bcrypt"); // hashing passwords stored in db

const app = express();

// middleware
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")));

const oneHour = 1000 * 60 * 60 * 1; // 1 hour in milliseconds

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(sessions({
    secret: "secretpassword123",
    saveUninitialized: true,
    cookie: { maxAge: oneHour }, // session expires after 1 hour
    resave: false
}));

//routes
// first page to be displayed is index.ejs which is the landing page
app.get("/", (req, res) => {
    res.render("index");
});

// show the dashboard only if the user is logged in
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

// show all cards in the database on the page
app.get("/cards", (req, res) => {
    let readsql = `SELECT * FROM card;`;
    db.query(readsql, (err, rows) => {
        if (err) throw err;
        res.render("cards", { rowdata: rows });
    });
});

// retrieve all the card details from the database to display when the card is clicked on
app.get("/card-details", (req, res) => {
    const cardId = req.query.card_id;
    let readsql = `SELECT card.card_name, card.url_image, card.value_price, card.card_number, card.illustrator, rarity.rarity_type, 
    expansion.expansion_name, expansion.release_date, card.format, card.regulation_mark, card.HP, card.ability_description, 
    card.attack_description, card.card_rule_description, card.weakness, card.resistance, card.stage, card.energy_type, 
    card_type.type_name
    FROM card
    INNER JOIN
    rarity ON card.rarity_id = rarity.rarity_id
    INNER JOIN
    expansion ON card.expansion_id = expansion.expansion_id
    INNER JOIN
    card_type ON card.card_type_id = card_type.card_type_id
    WHERE card.card_id = ?`;

    db.query(readsql, [cardId],(err, rows) => {
        if(err) throw err;
        if(rows.length > 0) {
        res.render("card-details", {card: rows[0]});    
        };
    });
});

// display list of expansions and their release date
app.get("/expansions", (req, res) => {
    let readsql = `SELECT * FROM expansion;`;
    db.query(readsql, (err, rows) => {
        if (err) throw err;
        res.render("expansions", { rowdata: rows });
    });
});

// display all the cards in each expansion
app.get("/expansions-cards", (req, res) => {
    const expansionId = req.query.expansion_id;
    let readsql = `SELECT * FROM card WHERE expansion_id = ?`;

    db.query(readsql, [expansionId], (err, rows) => {
        if(err) throw err;
        res.render("cards", {rowdata : rows});
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

// allows a user to login, therefore creating a session
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

// allows the user to end their session, and return them to the home page
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect("/");
    });
});

app.get("/register", (req, res) => {
    res.render("register");
});

// for a new user to register and become a member
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

// if a user wants to delete their account
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

// different filters to show the cards in alphabetical order, in order of value (low to high), and group by their energy type
app.get("/filter", (req, res) => {
    const filter = req.query.sort;
    const cardsSQL = `SELECT card_id, card_name, url_image, value_price, energy_type FROM card ORDER BY ${filter};`;

    db.query(cardsSQL, (err, result) => {
        if(err) throw err;
        res.render("cards", {rowdata : result});
    });
});

app.get("/collection", (req, res) => {
    let readsql = `SELECT * FROM collection;`;
    db.query(readsql, (err, rows) => {
        if (err) throw err;
        res.render("collection", { rowdata: rows });
    });
});

app.get("/create-collection", (req, res) => {
    res.render("create-collection");
});

app.post("/create-collection", (req, res) => {
    const collectionName = req.body.nameField;
    const collectionDescript = req.body.descriptField;
    const sessionobj = req.session;

    if(sessionobj.authen) {
        const uid = sessionobj.authen;
        
        const newCollection = `INSERT INTO collection (name, description, user_id) VALUES (?, ?, ?)`;

        db.query(newCollection, [collectionName, collectionDescript, uid], (err, result) => {
            if(err) {
                console.error(err);
                res.status(500).send('Internal server error occurred.');
            } else {
                res.redirect("collection");
            }
        });
    } else {
        res.status(403).send('Unauthorized');
    }
});

app.get("/all-collections", (req, res) => {
    const sessionobj = req.session;
    if (sessionobj.authen) {
        const uid = sessionobj.authen;
        const user = `SELECT * FROM user WHERE user_id = "${uid}"`;

        db.query(user, (err, row) => {
            const firstrow = row[0];
            res.render("all-collections", { userdata: firstrow });
        });
    } else {
        res.redirect("login");
    }
});


app.get("/wishlist", (req, res) => {
    res.render("wishlist");
});

// if a connection has been made to the database, a message will show in the console confirming this
db.connect((err) => {
    if (err) {
        return console.log(err.message);
    } else {
        return console.log(`Connection to MySQL DB is successful`);
    };
});

// if everything is running as expected, head to localhost:3000 to render the webpage upon seeing the confirmation message in console
app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running at http://localhost:3000");
});

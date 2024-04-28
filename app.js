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
        if (err) {
            res.render("404");
        } else {
            res.render("cards", { rowdata: rows });
        }
    });
});

// retrieve all the card details from the database to display when the card is clicked on
app.get("/card-details/:id", (req, res) => {
    const cardId = req.params.id;
    let readsql = `SELECT card.card_id, card.card_name, card.url_image, card.value_price, card.card_number, card.illustrator, rarity.rarity_type, 
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

    db.query(readsql, [cardId], (err, rows) => {
        if (err) {
            res.render("404");
        } else {
            if (rows.length > 0) {
                res.render("card-details", { card: rows[0] });
            } else {
                res.render("404");
            }
        }
    })
});

// display list of expansions and their release date
app.get("/expansions", (req, res) => {
    let readsql = `SELECT * FROM expansion;`;
    db.query(readsql, (err, rows) => {
        if (err) {
            res.render("404");
        } else {
            res.render("expansions", { rowdata: rows });
        }
    });
});

// display all the cards in each expansion
app.get("/expansions-cards/:id", (req, res) => {
    const expansionId = req.params.id;
    let readsql = `SELECT * FROM card WHERE expansion_id = ?`;

    db.query(readsql, [expansionId], (err, rows) => {
        if (err) {
            res.render("404");
        } else {
            res.render("cards", { rowdata: rows });
        }
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
        };
    });
});

// allows the user to end their session, and return them to the home page
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.render("404");
        } else {
            res.redirect("login");
        }
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
        if (err) {
            res.render("404");
        } else {
            res.redirect("dashboard")
        }
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
            res.redirect("login");
        });
    });
});

// different filters to show the cards in alphabetical order, in order of value (low to high), and group by their energy type
app.get("/filter", (req, res) => {
    const filter = req.query.sort;
    const cardsSQL = `SELECT card_id, card_name, url_image, value_price, energy_type FROM card ORDER BY ${filter};`;

    db.query(cardsSQL, (err, result) => {
        if (err) {
            res.render("404");
        } else {
            res.render("cards", { rowdata: result });
        }
    });
});

// the user can view their collections with this route
app.get("/collection", (req, res) => {
    const sessionobj = req.session;

    // need to check the user id to show the user only their collections from this route
    if (sessionobj.authen) {
        const uid = sessionobj.authen;
        const userCollections = `SELECT * FROM collection WHERE user_id = ?`;

        db.query(userCollections, [uid], (err, result) => {
            if (err) {
                res.render("404");
            } else {
                res.render("collection", { rowdata: result });
            }
        });
    } else {
        res.redirect("login");
    }
});

app.get("/create-collection", (req, res) => {
    res.render("create-collection");
});

// route to create a new record in the collection table - the user creates a new collection
app.post("/create-collection", (req, res) => {
    const collectionName = req.body.nameField;
    const collectionDescript = req.body.descriptField;
    const sessionobj = req.session;

    // need to check the user id to assign the collection to the correct user
    if (sessionobj.authen) {
        const uid = sessionobj.authen;

        const newCollection = `INSERT INTO collection (name, description, user_id) VALUES (?, ?, ?)`;

        db.query(newCollection, [collectionName, collectionDescript, uid], (err, result) => {
            if (err) {
                res.render("404");
            } else {
                res.redirect("collection");
            }
        });
    }
});

// this route will show all member's collections - you must be a member to view other member's collections
app.get("/all-collections", (req, res) => {
    const sessionobj = req.session;

    // check to see if the user is logged in
    if (sessionobj.authen) {
        const allCollections = `SELECT * FROM collection INNER JOIN user ON collection.user_id = user.user_id`;

        db.query(allCollections, (err, result) => {
            if (err) {
                res.render("404");
            } else {
                res.render("all-collections", { rowdata: result }); //logged in and can view all member's collections
            }
        });
    } else {
        res.redirect("/login"); // not logged in and redirected to the login page
    }
});

app.get("/collection-details/:id", (req, res) => {
    const collectionId = req.params.id;
    let readsql = `SELECT collection_card.collection_card_id, card.*, collection.*
    FROM collection_card
    INNER JOIN 
    collection ON collection_card.collection_id = collection.collection_id
    INNER JOIN
    card ON collection_card.card_id = card.card_id
    WHERE collection_card.collection_id = ?`;

    db.query(readsql, [collectionId], (err, rows) => {
        if (err) {
            res.render("404");
        } else {
            res.render("collection-details", { rowdata: rows });
        }
    });
});

app.get("/delete-collection/:id", (req, res) => {
    const collectionId = req.params.id;
    res.render("delete-collection", {collectionId : collectionId});
});

// if a user wants to delete a collection
app.post("/delete-collection/:id", (req, res) => {
    const collectionId = req.params.id;

    // must delete the collection data from this table first before deleting the collection as a whole 
    let deleteCollectionCard = `DELETE FROM collection_card WHERE collection_id = ?`;

    db.query(deleteCollectionCard, [collectionId], (err, result) => {
        if (err) {
            res.render("404");
        } else {
            let deleteCollection = `DELETE FROM collection WHERE collection_id = ?`;

            db.query(deleteCollection, [collectionId], (err, result) => {
                if (err) {
                    res.render("404");
                } else {
                    res.redirect("/collection");
                }
            });
        }
    });
});



app.get("/wishlist", (req, res) => {
    res.render("wishlist");
});

// an error page to handle issues a user might face while using the website
app.get("/404", (req, res) => {
    res.render("404");
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

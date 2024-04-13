const path = require("path");
const express = require("express");
const app = express();
const connection = require("./connection.js");


// middleware
app.use(express.static(path.join(__dirname, './public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//routes 
app.get("/", (req, res) => {
    res.render("index", {title : "TradeCard"});
});

app.get("/cards", (req,res) => {
    res.render("cards", {title : "TradeCard"});
    const readsql = `SELECT * FROM pokemon_card`;
    connection.query(readsql,(err, rows)=>{
        if(err) throw err;
        let stringdata = JSON.stringify(rows);
        res.send(`<h2>Pokemon Cards</h2><code> ${stringdata} </code>`);
    });
});


app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running at http://localhost:3000");
});

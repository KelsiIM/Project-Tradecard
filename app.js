const express = require("express");
const app = express();
const path = require("path");

// middleware
app.use(express.static(path.join(__dirname, './public')));
app.set('view engine', 'ejs');


//routes 
app.get("/", (req, res) => {
    res.render("index", {title : "TradeCard"});
});




app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running at port 3000");
});
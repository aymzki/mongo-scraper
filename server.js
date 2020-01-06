//get those dependencies
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");


// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;
app.use(express.static("public"));

// Set Handlebars as the default templating engine.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/japantimes";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/japantimes", { useNewUrlParser: true });



console.log("Grab articles from Japan Times");

//Routes
// A GET route for scraping the Japan Times website
app.get("/scrape", function (req, res) {

    //db.Article.drop()
    //axios get call
    axios.get("https://www.japantimes.co.jp/news_category/national/").then(function (response) {
        // Load into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        $("article").each(function (i, element) {
           
            var title = $(element).find("hgroup").children("p").text();
            var link = $(element).find("hgroup").children("p").children("a").attr("href");
            var summary = $(element).find("div").children("p").text().replace(/[\n\t\r]/g, "");
            summary = summary.replace('\t', '').split('\r\n');
            
            var result = {
                title: title,
                link: link,
                summary: summary [0]
              };
            console.log(result);
            //Insert the data in the japanTimes db
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });

        });
     res.send("Scrape Complete!"); 
     });
});

app.get("/", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      var hbsObject = {jtarticle: dbArticle};
      res.render('index', hbsObject);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.listen(PORT, function () {
    console.log("App running on port 3000!");
  });
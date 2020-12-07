// Dotenv
require("dotenv").config();

// Framework
const express = require("express");
const app = express();

const vision = require("@google-cloud/vision");

const SerpApi = require("google-search-results-nodejs");
const search = new SerpApi.EbaySearch(`${process.env.SA_KEY}`);

// Creates a client
const client = new vision.ImageAnnotatorClient({
  keyFilename: "APIkey.json",
});

// Database
const db = require("./repository/database.js");

// Handlebars | Template Engine
const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// Static Directory
app.use(express.static("public"));

// Body Parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// FileUpload
const fileUpload = require("express-fileupload");
app.use(fileUpload());

// Sessions
const session = require("express-session");

// Cookie Parser

app.use(
  session({
    cookieName: "session",
    secret: "tryKappaRev",
    duration: 20 * 60 * 100, //duration Of current session
    activeDuration: (1 / 60 / 60) * 1000, // extension of the session 1 min per request
  })
);

// Middleware

function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    res.redirect("/authPage");
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  res.render("authPage");
});

app.get("/searchPage", isLoggedIn, (req, res) => {
  res.render("searchPage");
});

app.get("/resultsPage", isLoggedIn, (req, res) => {
  res.render("resultsPage");
});

app.post("/search", isLoggedIn, (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded");
  }
  let sampleFile = req.files.file;
  let labelsDesc;
  console.log(sampleFile);
  sampleFile.mv(`public/uploads/${sampleFile.name}`, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      let bigString = " ";
      client.labelDetection(`public/uploads/${sampleFile.name}`).then((results) => {
        const labels = results[0].labelAnnotations;
        console.log("Labels: ");
        labelsDesc = labels.map((label) => label.description);
        for (let key in labelsDesc) {
          bigString += `${labelsDesc[key]}`;
          bigString += " ";
        }
        const params = {
          engine: "ebay",
          ebay_domain: "ebay.com",
          q: bigString,
          _nkw: bigString,
        };

        const callback = function (data) {
          data = data.organic_results.slice(0, 10);
          console.log(data);
          res.render("resultsPage", { apiData: data });
        };

        // Show result as JSON
        search.json(params, callback);
      });
    }
  });
});

app.get("/authPage", (req, res) => {
  res.render("authPage");
});

app.post("/register", (req, res) => {
  let errors = {
    messages: [],
    username: "",
    email: "",
  };

  if (req.body.username == "") {
    errors.messages.push("You must enter a username");
  } else {
    errors.fName = req.body.username;
  }

  // Email Regex anyword+@+anyword+.+alphanumeric
  if (req.body.emailRegister == "") {
    errors.messages.push(`Email required`);
  } else {
    if (
      !req.body.emailRegister.match(
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
      )
    ) {
      errors.messages.push(`Email format invalid`);
    } else {
      errors.email = req.body.emailRegister;
    }
  }

  // 1 Lcase/Ucase/#/schar && 4 to 15 chars
  if (req.body.passwordRegister == "") {
    errors.messages.push("Password Required");
  } else if (
    !req.body.passwordRegister.match(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{4,15}$/
    )
  ) {
    errors.messages.push(
      "Password requires 4-15 Characters and 1 Lowercase/Uppercase/Number/Special Character"
    );
  }

  if (errors.messages.length > 0) {
    res.render("authPage", errors);
    console.log(errors.messages);
  } else {
    db.addUser(req.body)
      .then((data) => {
        req.session.user = data;
        res.redirect("/", { users: data });
      })
      .catch((err) => {
        console.log(`Error adding user ${err}`);
        res.redirect("/authPage");
      });
  }
});

app.post("/login", (req, res) => {
  let errors = {
    messages: [],
    email: "",
  };

  if (req.body.emailLogin == "") {
    errors.messages.push(`Email required`);
  } else {
    if (
      !req.body.emailLogin.match(
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
      )
    ) {
      errors.messages.push(`Email format invalid`);
    } else {
      errors.email = req.body.emailLogin;
    }
  }

  if (req.body.passwordLogin == "") {
    errors.messages.push(`Password Required`);
  } else if (
    !req.body.passwordLogin.match(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{4,15}$/
    )
  ) {
    errors.messages.push(
      `Password requires 4-15 Characters and 1 Lowercase / Uppercase / Number / Special Character`
    );
  }

  if (errors.messages.length > 0) {
    res.render("authPage", errors);
    console.log(errors.messages);
  } else {
    db.validateUser(req.body)
      .then((data) => {
        // Logs in a user
        req.session.user = data[0];
        console.log(req.session.user);

        res.render("searchPage", {
          data: req.session.user,
        });
        //res.redirect("/", {
        // })
        // res.redirect('/dashboard')
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/authPage");
      });
  }
});

app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/authPage");
});

app.get("/searchOther", function (req, res) {
  res.redirect("/searchPage");
});

const PORT = process.env.PORT;

db.initialize()
  .then(() => {
    console.log("Database accessed successfully");
    app.listen(PORT, () => {
      console.log(`Server up and listening on Port: ${PORT}!`);
    });
  })
  .catch((data) => {
    console.log(data);
  });

var express = require("express"), 
totp = require("totp-generator"),
mongoose = require("mongoose"), 
passport = require("passport"), 
bodyParser = require("body-parser"), 
LocalStrategy = require("passport-local"), 
passportLocalMongoose = require("passport-local-mongoose") 
const User = require("./model/User"); 
var randtoken = require('rand-token').generator({
    chars: 'base32'
  });
QRCode = require('qrcode');
const path = require('path');

var app = express(); 



mongoose.connect("mongodb://localhost/27017"); 

app.set("view engine", "ejs"); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));
const imagePath = path.join(__dirname, 'public', 'images', 'file.png');
app.use(require("express-session")({ 
	secret: "Rusty is a dog", 
	resave: false, 
	saveUninitialized: false
})); 

app.use(passport.initialize()); 
app.use(passport.session()); 

passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 


app.get("/", function (req, res) { 
	res.render("home"); 
}); 

// Showing secret page 
app.get("/secret", isLoggedIn, function (req, res) { 
	res.render("secret"); 
}); 

// Showing register form 
app.get("/register", function (req, res) { 
	res.render("register"); 
}); 

// Handling user signup 
app.post("/register", async (req, res) => { 
	var token = randtoken.generate(16);
	QRCode.toFile(imagePath, token, {
		errorCorrectionLevel: 'H',
		width: 200
	  }, function(err) {
		if (err) throw err;
		console.log('QR code saved!');
	  });
	const user = await User.create({ 
	username: req.body.username, 
	password: req.body.password,
	secret: token
	}); 
	
	res.render('secret'); 
}); 

//Showing login form 
app.get("/login", function (req, res) { 
	res.render("login"); 
}); 

//Handling user login 
app.post("/login", async function(req, res){ 
	try { 
		// check if the user exists 
		const user = await User.findOne({ username: req.body.username }); 
		if (user) { 
		//check if password matches 
		const token = totp(user.secret, { timestamp: Date.now() });
		console.log(user.secret);
		console.log(token);
		const result = req.body.password === user.password && req.body.otp === token; 
		if (result) { 
			res.render("app"); 
		} else { 
			res.status(400).json({ error: "Invalid Credentials" }); 
		} 
		} else { 
		res.status(400).json({ error: "User doesn't exist" }); 
		} 
	} catch (error) { 
		res.status(400).json({ error }); 
	} 
}); 

//Handling user logout 
app.get("/logout", function (req, res) { 
	req.logout(function(err) { 
		if (err) { return next(err); } 
		res.redirect('/'); 
	}); 
}); 



function isLoggedIn(req, res, next) { 
	if (req.isAuthenticated()) return next(); 
	res.redirect("/login"); 
} 

var port = process.env.PORT || 3000; 
app.listen(port, function () { 
	console.log("Server Has Started!"); 
}); 

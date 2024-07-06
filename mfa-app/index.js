// App.js 

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
const Jimp = require("jimp");
const fs = require('fs')
const bcrypt = require('bcrypt');

const qrCodeReader = require('qrcode-reader');
 

var app = express(); 

const multer  = require('multer')


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})

var upload = multer({ storage: storage })


mongoose.connect("mongodb://localhost/AuthX"); 

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


var uname;
var sec;
var acc;

app.get("/", function (req, res) { 
	res.render("home"); 
}); 

app.get("/app", isLoggedIn, async function (req, res) { 
	const user = await User.findOne({ username: uname });
	if (!user) {
		console.log('User not found');
	}
	const names = user.accounts.map(account => account.name);
	console.log(names);
	res.render("app", {names}); 
}); 

app.get("/app-details/:app", isLoggedIn, async function (req, res) { 
	const app = req.params.app;

	const user = await User.findOne({ username: uname });
	const account = user.accounts.find(acc => acc.name === app);
	const secret = account ? account.secret : null;
	sec = secret;
	if (!user) {
		console.log('User not found');
	}
	
	res.render("secret", {secret, app}); 
}); 
var old_token;
var token;
app.get("/generate-new-otp", async function (req, res) { 
	console.log(sec);
	old_token = token;
	token = totp(sec, { timestamp: Date.now() });
	while(token == old_token)
	{
		token = totp(sec, { timestamp: Date.now() });
	}
	console.log(token);
	res.json({ token });
}); 

app.post('/upload', upload.single('uploaded_file'), async function (req, res) {
	if (!req.file) {
		return res.status(400).send('No file uploaded.');
	  }
	console.log(req.file, req.body, req.file.filename)
	buffer = fs.readFileSync('./public/images/' + req.file.filename);
	console.log(buffer)
	Jimp.read(buffer, function(err, image) {
		if (err) {
			console.error(err);
		}
	  
		const qrCodeInstance = new qrCodeReader();
	  
		qrCodeInstance.callback = function(err, value) {
			if (err) {
				console.error(err);
			}
			console.log(value.result);
			sec = value.result;

		};
	    qrCodeInstance.decode(image.bitmap);

		
			
		acc = req.body.account;
			  updatedUser(sec, acc);
		
	
		  
	  });

	  
  

 });

 async function updatedUser(sec) {
	const updatedUser =  await User.findOneAndUpdate(
		{ username : uname },
		{ $push: { accounts: { name: acc, secret: sec } } }
	  );
 }

// Showing register form 
app.get("/register", function (req, res) { 
	res.render("register"); 
}); 

app.get("/add", isLoggedIn, function (req, res) { 
	res.render("add"); 
}); 

// Handling user signup 
app.post("/register", async (req, res) => {
	const hashedPassword = await bcrypt.hash(req.body.password, 10);
	const user = await User.create({ 
	username: req.body.username, 
	password: hashedPassword
	}); 
	
	res.render('login'); 
}); 

//Showing login form 
app.get("/login", function (req, res) { 
	res.render("login"); 
}); 

//Handling user login 
// app.post("/login", async function(req, res){ 
// 	try { 
// 		// check if the user exists 
// 		const user = await User.findOne({ username: req.body.username }); 
// 		if (user) { 
// 		//check if password matches 
// 		const result = req.body.password === user.password;
// 		if (result) { 
// 			uname = req.body.username;
// 			res.redirect("app"); 
// 		} else { 
// 			res.status(400).json({ error: "Invalid Credentials" }); 
// 		} 
// 		} else { 
// 		res.status(400).json({ error: "User doesn't exist" }); 
// 		} 
// 	} catch (error) { 
// 		res.status(400).json({ error }); 
// 	} 
// }); 

app.post("/login", passport.authenticate("local", {
	successRedirect: "/app",
	failureRedirect: "/register",
  }));

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

var port = process.env.PORT || 4000; 
app.listen(port, function () { 
	console.log("Server Has Started!"); 
}); 

function find_secret(new_buffer)
{
	Jimp.read(new_buffer, function(err, image) {
		if (err) {
			console.error(err);
		}
	  
		const qrCodeInstance = new qrCodeReader();
	  
		qrCodeInstance.callback = function(err, value) {
			if (err) {
				console.error(err);
			}
			console.log(value.result);
			console.log("hello");
		};
	  
	  });
	
	  
}

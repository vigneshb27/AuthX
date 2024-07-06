// User.js 

const mongoose = require('mongoose') 
const Schema = mongoose.Schema 
const passportLocalMongoose = require('passport-local-mongoose'); 
var User = new Schema({ 
	username: { 
		type: String,
		unique: true
	}, 
	password: { 
		type: String 
	},
	accounts: [
		{
		  name: {
			type: String,
		  },
		  secret: {
			type: String
		  },
		},
	  ]
}) 

User.plugin(passportLocalMongoose); 

module.exports = mongoose.model('User', User)

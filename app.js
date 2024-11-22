const express = require("express");
const mongoose = require("mongoose")
const bodyParser =require("body-parser")
const session = require('express-session')
const passport = require("./config/passport")
const mongoStore = require("connect-mongo");
const path = require('path');
const userRoutes = require('./routes/user.js');
const adminRoutes = require('./routes/admin.js');
const db =require("./config/db.js")
const env =require('dotenv').config();
const app =express();

//midlewares
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: true,
    store: mongoStore.create({ mongoUrl: 'mongodb://localhost:27017/Ecommeerce' }),
    cookie: { secure: false, httpOnly: true,  maxAge: 60 * 60 * 1000 }
}));



app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set("view engine",'ejs');
app.use(express.static('Public'));

app.use('/',userRoutes);
app.use('/admin',adminRoutes)

const port = process.env.PORT;
app.listen(port,()=>{
    console.log("server running successfully")
})
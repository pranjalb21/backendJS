require('dotenv').config({path: '../.env'})
const express = require('express');
const connectDB = require("./db");
const app = require('./app');


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`App is running on ${process.env.PORT || 8000}`)
    })
})
.catch(()=>console.log(`Erri`))
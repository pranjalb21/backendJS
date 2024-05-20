const mongoose = require('mongoose');

const connectDB = async()=>{
    try {
        const connect = await mongoose.connect(`${process.env.DB_URI}/${process.env.DB}`)
        console.log(`DB Connected`);
    } catch (error) {
        console.log(`DB connection error`, error);
        process.exit(1);
    }
}

module.exports = connectDB
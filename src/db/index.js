import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.DB_URI}/${process.env.DB}`);
        console.log(`DB Connected`);
    } catch (error) {
        console.log(process.env.DB_URI);
        console.log(`DB connection error`, error);
        process.exit(1);
    }
};

export default connectDB;
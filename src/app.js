const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

//* Routes import
const userRouter = require("./routes/user.routes");
const subscribeRouter = require("./routes/subscribe.routes");

//* Routes declare
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscribe", subscribeRouter);

module.exports = app;

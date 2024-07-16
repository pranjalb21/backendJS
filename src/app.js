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
const videoRouter = require("./routes/video.routes");

//* Routes declare
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscribes", subscribeRouter);
app.use("/api/v1/videos", videoRouter);

module.exports = app;

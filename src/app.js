import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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
import userRouter from "./routes/user.routes.js";
import subscribeRouter from "./routes/subscribe.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";

//* Routes declare
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscribes", subscribeRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);

export default app;

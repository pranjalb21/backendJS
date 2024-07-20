import express from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";

const router = express.Router();

router
    .use(verifyJwt)

    .get("/", getUserTweets)

    .post("/add", createTweet)
    .patch("/update/:tweetId", updateTweet)

    .delete("/delete/:tweetId", deleteTweet);

export default router;

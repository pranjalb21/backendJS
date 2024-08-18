import express from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
    createTweet,
    deleteTweet,
    getAllTweets,
    getTweetById,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";

const router = express.Router();

router
    .use(verifyJwt)

    .get("/user/:user", getUserTweets)
    .get("/all", getAllTweets)
    .get("/:tweetId", getTweetById)

    .post("/add", createTweet)

    .patch("/update/:tweetId", updateTweet)

    .delete("/delete/:tweetId", deleteTweet);

export default router;

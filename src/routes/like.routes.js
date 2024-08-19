import express from "express";

import verifyJwt from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos,
    toggleImageLike,
} from "../controllers/like.controller.js";

const router = express.Router();

router
    .use(verifyJwt)

    .get("/video", getLikedVideos)
    .post("/video/:videoId", toggleVideoLike)
    .post("/tweet/:tweetId", toggleTweetLike)
    .post("/image/:imageId", toggleImageLike)
    .post("/comment/:commentId", toggleCommentLike);

export default router;

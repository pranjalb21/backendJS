const express = require("express")
const verifyJwt = require("../middlewares/auth.middleware")
const { toggleVideoLike, toggleTweetLike, toggleCommentLike } = require("../controllers/like.controller")

const router = express.Router()

router
    .use(verifyJwt)

    .post('/video/:videoId',toggleVideoLike)
    .post('/tweet/:tweetId',toggleTweetLike)
    .post('/comment/:commentId',toggleCommentLike)
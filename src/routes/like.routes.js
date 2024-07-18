const express = require("express")
const verifyJwt = require("../middlewares/auth.middleware")
const { toggleVideoLike, toggleTweetLike, toggleCommentLike, getLikedVideos } = require("../controllers/like.controller")

const router = express.Router()

router
    .use(verifyJwt)

    .get('/video',getLikedVideos)
    .post('/video/:videoId',toggleVideoLike)
    .post('/tweet/:tweetId',toggleTweetLike)
    .post('/comment/:commentId',toggleCommentLike)

module.exports = router
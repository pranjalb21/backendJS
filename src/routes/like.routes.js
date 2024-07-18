const express = require("express")
const verifyJwt = require("../middlewares/auth.middleware")
const { toggleVideoLike } = require("../controllers/like.controller")

const router = express.Router()

router
    .use(verifyJwt)

    .post('/video/:videoId',toggleVideoLike)
    .post('/tweet/:tweetId',toggle)
    .post('/comment/:commentId',toggleVideoLike)
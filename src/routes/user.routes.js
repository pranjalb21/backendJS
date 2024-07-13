const express = require("express");
const {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUserChannelProfile,
    subscribeChannel,
    unsubscribeChannel,
} = require("../controllers/user.controller");
const upload = require("../middlewares/multer.middleware");
const verifyJwt = require("../middlewares/auth.middleware");

const router = express.Router();

router
    .post(
        "/register",
        upload.fields([
            {
                name: "avatar",
                maxCount: 1,
            },
            {
                name: "coverImage",
                maxCount: 1,
            },
        ]),
        registerUser
    )
    .post("/login", loginUser)

    //* Secured routes
    .post("/logout", verifyJwt, logoutUser)
    .get("/getUserChannelProfile/:username", verifyJwt, getUserChannelProfile)
    .post("/subscribe", verifyJwt, subscribeChannel)
    .post("/unsubscribe", verifyJwt, unsubscribeChannel)
    .post("/generate-token", refreshAccessToken);

module.exports = router;

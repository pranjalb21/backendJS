const express = require("express");
const {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUserChannelProfile,
    subscribeChannel,
    unsubscribeChannel,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAccount,
    updateUserAvatar,
    updateUserCoverImage,
    getUserWatchHistory,
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

    .get('/refresh-token', refreshAccessToken)

    //? Secured routes
    .get("/current", verifyJwt, getCurrentUser)
    .get("/channels/:username", verifyJwt, getUserChannelProfile)
    .get("/watch-history", verifyJwt, getUserWatchHistory)

    .post("/logout", verifyJwt, logoutUser)
    .post("/subscribe", verifyJwt, subscribeChannel)
    .post("/unsubscribe", verifyJwt, unsubscribeChannel)
    .post("/generate-token", refreshAccessToken)
    .post("/subscribe", verifyJwt, subscribeChannel)
    .post("/unsubscribe", verifyJwt, unsubscribeChannel)

    .patch("/change-password", verifyJwt, changeCurrentPassword)
    .patch("/update/account", verifyJwt, updateUserAccount)
    .patch(
        "/update/avatar",
        verifyJwt,
        upload.single("avatar"),
        updateUserAvatar
    )
    .patch(
        "/update/cover-image",
        verifyJwt,
        upload.single("coverImage"),
        updateUserCoverImage
    );

module.exports = router;

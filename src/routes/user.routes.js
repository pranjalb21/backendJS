import express from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUserChannelProfile,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAccount,
    updateUserAvatar,
    updateUserCoverImage,
    getUserWatchHistory,
    addWatchHistory,
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";

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

    .post("/refresh-token", refreshAccessToken)

    //? Secured routes
    .get("/current", verifyJwt, getCurrentUser)
    .get("/channels/:username", verifyJwt, getUserChannelProfile)
    .get("/watch-history", verifyJwt, getUserWatchHistory)

    .post("/logout", verifyJwt, logoutUser)
    .post("/generate-token", refreshAccessToken)

    .patch("/update/password", verifyJwt, changeCurrentPassword)
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
    )
    .patch("/watch-history/:videoId", verifyJwt, addWatchHistory);

export default router;
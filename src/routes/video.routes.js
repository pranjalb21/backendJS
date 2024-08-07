import express from "express";

import verifyJwt from "../middlewares/auth.middleware.js";
import {
    getAllVideos,
    postAVideo,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
    updateVideo,
    addView,
    getUserVideos,
} from "../controllers/video.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router
    .use(verifyJwt)
    .get("/all", getAllVideos)
    .get("/:videoId", getVideoById)
    .get("/user/:user", getUserVideos)

    .post(
        "/add",
        upload.fields([
            { name: "video", maxCount: 1 },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        postAVideo
    )
    .patch("/publish-toggle/:videoId", togglePublishStatus)
    .patch("/update/:videoId", upload.single("thumbnail"), updateVideo)
    .patch("/view/:videoId", addView)
    .delete("/delete/:videoId", deleteVideo);

export default router;

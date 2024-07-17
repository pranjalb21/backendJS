const express = require("express");
const verifyJwt = require("../middlewares/auth.middleware");
const {
    getAllVideos,
    postAVideo,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
    updateVideo,
    addView,
} = require("../controllers/video.controller");
const upload = require("../middlewares/multer.middleware");

const router = express.Router();

router
    .use(verifyJwt)
    .get("/all", getAllVideos)
    .get("/:videoId", getVideoById)

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

module.exports = router;

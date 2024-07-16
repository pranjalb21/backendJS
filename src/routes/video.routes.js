const express = require("express");
const verifyJwt = require("../middlewares/auth.middleware");
const { getAllVideos, postAVideo } = require("../controllers/video.controller");
const upload = require("../middlewares/multer.middleware");

const router = express.Router();

router
    .use(verifyJwt)
    .get("/all", getAllVideos)

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
    );

module.exports = router;

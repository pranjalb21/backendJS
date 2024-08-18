import { Router } from "express";
import verifyJwt from "../middlewares/auth.middleware.js";
import {
    createImage,
    deleteImage,
    getAllImage,
    getImageById,
    getUserImage,
    updateImage,
} from "../controllers/image.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
    .use(verifyJwt)

    .get("/user/:userId", getUserImage)
    .get("/all", getAllImage)
    .get("/:imageId", getImageById)

    .post("/add", upload.single("image"), createImage)

    .patch("/update/:imageId", upload.single('image'), updateImage)

    .delete("/delete/:imageId", deleteImage);

export default router;

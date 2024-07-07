const express = require("express");
const { registerUser } = require("../controllers/user.controller");
const upload = require("../middlewares/multer.middleware");

const router = express.Router();

router.post("/register",
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
);

module.exports = router;

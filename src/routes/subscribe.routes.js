const express = require("express");
const verifyJwt = require("../middlewares/auth.middleware");
const {
    subscribeChannel,
    unsubscribeChannel,
} = require("../controllers/subscribe.controller");

const router = express.Router();

router
    .post("/add", verifyJwt, subscribeChannel)
    .post("/delete", verifyJwt, unsubscribeChannel);

module.exports = router

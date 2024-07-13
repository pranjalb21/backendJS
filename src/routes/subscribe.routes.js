const express = require("express");
const verifyJwt = require("../middlewares/auth.middleware");
const {
    subscribeChannel,
    unsubscribeChannel,
} = require("../controllers/subscribe.controller");

const router = express.Router();

router
    .post("/subscribe", verifyJwt, subscribeChannel)
    .post("/unsubscribe", verifyJwt, unsubscribeChannel);

module.exports = router

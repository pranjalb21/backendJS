const express = require("express");
const verifyJwt = require("../middlewares/auth.middleware");
const {
    subscribeChannel,
    unsubscribeChannel,
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} = require("../controllers/subscribe.controller");

const router = express.Router();

router
    .use(verifyJwt)
    .post("/add", subscribeChannel)
    .post("/delete", unsubscribeChannel)
    .post("/subscribe/:channelId", toggleSubscription)
    .get("/subscribers/:channelId", getUserChannelSubscribers)
    .get("/subscribed/:subscriberId", getSubscribedChannels);

module.exports = router;

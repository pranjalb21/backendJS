import express from "express";

import verifyJwt from "../middlewares/auth.middleware.js";
import {
    subscribeChannel,
    unsubscribeChannel,
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} from "../controllers/subscribe.controller.js";

const router = express.Router();

router
    .use(verifyJwt)
    .post("/add", subscribeChannel)
    .post("/delete", unsubscribeChannel)
    .post("/subscribe/:channelId", toggleSubscription)
    .get("/subscribers/:channelId", getUserChannelSubscribers)
    .get("/subscribed/:subscriberId", getSubscribedChannels);

export default router;

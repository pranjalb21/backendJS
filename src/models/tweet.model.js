import mongoose from "mongoose";

const tweetSchema = mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timeStamps: true,
    }
);
const Tweet = mongoose.model("Tweet", tweetSchema);
export default Tweet

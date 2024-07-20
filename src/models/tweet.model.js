import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

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
        timestamps: true,
    }
);
tweetSchema.plugin(aggregatePaginate);
const Tweet = mongoose.model("Tweet", tweetSchema);
export default Tweet;

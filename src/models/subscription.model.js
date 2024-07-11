const {Schema} = require("mongoose");

const subscriptionSchema = Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema)
module.exports = Subscription;

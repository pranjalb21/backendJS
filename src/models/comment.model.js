const mongoose = require("mongoose");
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2')

const commentSchema = mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
        tweet:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Tweet"
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timeStamps: true,
    }
);

commentSchema.plugin(mongooseAggregatePaginate)

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;

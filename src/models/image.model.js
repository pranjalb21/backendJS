import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const imageSchema = new mongoose.Schema(
    {
        image: {
            type: String,
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

imageSchema.plugin(aggregatePaginate);

const Image = mongoose.model("Image", imageSchema);
export default Image;

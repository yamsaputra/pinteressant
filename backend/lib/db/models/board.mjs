// import statements
import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        maxlength: 500,
        default: "",   
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    pins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pin",
        }],
        coverImage: {
        url: { type: String, default: "" },
        publicID: { type: String, default: "" },
    },
    isPrivate: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

export default mongoose.model("Board", boardSchema);
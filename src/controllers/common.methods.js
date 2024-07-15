const sanityCheck = (id) => {
    if (id === undefined || !id) return false;
    try {
        new mongoose.Types.ObjectId(id);
        return true;
    } catch (error) {
        return false;
    }
};

const getPublicId = (url) => {
    const publicId = url.split("/")[url.split("/").length - 1].split(".")[0];
    return publicId;
};

module.exports = {
    sanityCheck,
    getPublicId,
};

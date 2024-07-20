const sanityCheck = (id) => {
    if (id === undefined || !id) return false;
    try {
        const a = new mongoose.Types.ObjectId(id);
        console.log(a);
        return true;
    } catch (error) {
        return false;
    }
};

const getPublicId = (url) => {
    const publicId = url.split("/")[url.split("/").length - 1].split(".")[0];
    return publicId;
};

export { sanityCheck, getPublicId };

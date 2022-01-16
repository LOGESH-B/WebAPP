


module.exports.isAuthor = async (req, res, next) => {
    const { id ,clubname} = req.params;
    const user = await User.findById(id);
    if (!user.author.equals(req.user._id)) {
       
        return res.redirect(`/club/${clubname}`);
    }
    next();
}
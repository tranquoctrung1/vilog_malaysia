module.exports.logout = function (req, res) {
  res.clearCookie("access_token");
  res.clearCookie("username");

  res.redirect("/login");
};

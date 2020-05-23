exports.twitter = (req, res) => {
  const io = req.app.get('io');
  io.in(req.session.socketId).emit(req.session.slug, { data: { isAuthenticated: true } });
  res.end();
};

exports.youtube = (req, res) => {
  const io = req.app.get('io');
  io.in(req.session.socketId).emit(req.session.slug, { data: { isAuthenticated: true } });
  res.end();
};

exports.reddit = (req, res) => {
  const io = req.app.get('io');
  io.in(req.session.socketId).emit(req.session.slug, { data: { isAuthenticated: true } });
  res.end();
};

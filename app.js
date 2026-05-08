require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const ejsLayouts = require("express-ejs-layouts");
const FileStore = require("session-file-store")(session);

require("./config/database");

const userRoutes = require("./app_server/routes/userRoutes");
const homeRoutes = require("./app_server/routes/projectRoutes");
const projectsRoutes = require("./app_server/routes/projectsRoutes");
const adminRoutes = require("./app_server/routes/adminRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/app_server/views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    store: new FileStore({
      path: path.join(__dirname, "sessions"),
      ttl: 60 * 60 * 24,
      retries: 1,
      logFn: () => {},
    }),
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "my_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.userId
    ? { id: req.session.userId, ad: req.session.userName }
    : null;
  res.locals.userRole = req.session.userRole || null;
  next();
});

app.use(ejsLayouts);
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", userRoutes);
app.use("/", homeRoutes);
app.use("/projects", projectsRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).render("error", {
    code: 404,
    message: "Səhifə tapılmadı.",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).render("error", {
    code: 500,
    message: "Server xətası baş verdi.",
  });
});

module.exports = app;

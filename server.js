import express from "express";
import session from "express-session";
import fs from "fs";

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Charger les utilisateurs
let users = JSON.parse(fs.readFileSync("./config/users.json", "utf8"));

// Middleware auth
function isAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") return next();
  res.redirect("/dashboard");
}

// Routes
app.get("/", (req, res) => res.redirect("/login"));

// Page login
app.get("/login", (req, res) => res.render("login"));
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    req.session.user = user;
    return res.redirect(user.role === "admin" ? "/admin" : "/dashboard");
  }
  res.send("❌ Identifiants incorrects !");
});

// Dashboard user
app.get("/dashboard", isAuth, (req, res) => {
  res.render("dashboard", { user: req.session.user });
});

// Dashboard admin
app.get("/admin", isAdmin, (req, res) => {
  res.render("admin", { users });
});
app.post("/admin/add", isAdmin, (req, res) => {
  const { username, password } = req.body;
  users.push({ username, password, role: "user" });
  fs.writeFileSync("./config/users.json", JSON.stringify(users, null, 2));
  res.redirect("/admin");
});
app.post("/admin/delete", isAdmin, (req, res) => {
  users = users.filter((u) => u.username !== req.body.username);
  fs.writeFileSync("./config/users.json", JSON.stringify(users, null, 2));
  res.redirect("/admin");
});

// Pages assistant
app.get("/school", isAuth, (req, res) => res.render("school"));
app.get("/codegen", isAuth, (req, res) => res.render("codegen"));
app.get("/imgen", isAuth, (req, res) => res.render("imgen"));

app.listen(3000, () =>
  console.log("🚀 Assistant lancé sur http://localhost:3000")
);

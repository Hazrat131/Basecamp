const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

function loginGetOne(req, res) {
  if (req.session.userId) return res.redirect("/");
  res.render("sessions/login", { error: null, form: {} });
}

async function loginPostOne(req, res) {
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!email || !password) {
    return res.render("sessions/login", {
      error: "Email ve sifreni daxil edin.",
      form: { email },
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    const badCreds = () =>
      res.render("sessions/login", {
        error: "Email ve ya sifre yanlisdir.",
        form: { email },
      });

    if (!user) return badCreds();

    const ok = await bcrypt.compare(password, user.sifre);
    if (!ok) return badCreds();

    if (user.status === "banned") {
      return res.render("sessions/login", {
        error: "Hesabiniz bloklanib. Adminle elaqe saxlayin.",
        form: { email },
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regenerate error:", err);
        return res.status(500).send("Login error");
      }
      req.session.userId = user.id;
      req.session.userRole = user.isAdmin ? "admin" : "user";
      req.session.userName = user.ad;
      req.session.message = `Xoş gəldin, ${user.ad}!`;
      res.redirect("/");
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login error");
  }
}

function logOut(req, res) {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
}

module.exports = {
  loginGetOne,
  loginPostOne,
  logOut,
};

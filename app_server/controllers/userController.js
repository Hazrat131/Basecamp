const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

function validateSignup(body) {
  const errors = [];
  const ad = (body.ad || "").trim();
  const soyad = (body.soyad || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const username = (body.username || "").trim();
  const password = body.password || "";

  if (!ad || ad.length < 2) errors.push("Ad en azi 2 simvol olmalidir.");
  if (!soyad || soyad.length < 2) errors.push("Soyad en azi 2 simvol olmalidir.");
  if (!EMAIL_RE.test(email)) errors.push("Email formati duzgun deyil.");
  if (!USERNAME_RE.test(username))
    errors.push("Istifadeci adi 3–30 simvol olmalidir (herf, reqem, _ . -).");
  if (password.length < 6) errors.push("Sifre en azi 6 simvol olmalidir.");

  return { errors, data: { ad, soyad, email, username, password } };
}

function signUpGet(req, res) {
  res.render("users/new", { error: null, form: {} });
}

async function signUpPost(req, res) {
  const { errors, data } = validateSignup(req.body);

  if (errors.length) {
    return res.render("users/new", {
      error: errors.join(" "),
      form: { ad: data.ad, soyad: data.soyad, email: data.email, username: data.username },
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        ad: data.ad,
        soyad: data.soyad,
        email: data.email,
        kullaniciAdi: data.username,
        sifre: hashedPassword,
      },
    });

    req.session.userId = user.id;
    req.session.userRole = user.isAdmin ? "admin" : "user";
    req.session.userName = user.ad;
    req.session.message = "Hesabiniz yaradildi. Xos geldiniz!";
    return res.redirect("/");
  } catch (err) {
    if (err && err.code === "P2002") {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "";
      const msg = target.includes("email")
        ? "Bu email artiq qeydiyyatdan kecib."
        : target.includes("kullanici_adi")
        ? "Bu istifadeci adi artiq movcuddur."
        : "Email ve ya istifadeci adi artiq movcuddur.";
      return res.render("users/new", {
        error: msg,
        form: { ad: data.ad, soyad: data.soyad, email: data.email, username: data.username },
      });
    }
    console.error("Signup error:", err);
    return res.status(500).render("users/new", {
      error: "Server xetasi bas verdi. Yenidən cehd edin.",
      form: { ad: data.ad, soyad: data.soyad, email: data.email, username: data.username },
    });
  }
}

async function showUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).send("Invalid id");

    if (req.session.userRole !== "admin" && req.session.userId !== id) {
      return res.status(403).send("Forbidden");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });
    if (!user) return res.status(404).send("User not found");

    res.render("users/show", {
      profileUser: user,
      isOwnProfile: req.session.userId === id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).send("Invalid id");

    const isSelf = req.session.userId === id;
    const isAdmin = req.session.userRole === "admin";
    if (!isSelf && !isAdmin) return res.status(403).send("Forbidden");

    await prisma.user
      .delete({ where: { id } })
      .catch((err) => {
        if (err.code === "P2025") return null;
        throw err;
      });

    if (isSelf) {
      return req.session.destroy(() => res.redirect("/"));
    }
    return res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

module.exports = {
  signUpGet,
  signUpPost,
  showUser,
  deleteUser,
};

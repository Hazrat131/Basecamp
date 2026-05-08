const prisma = require("../app_server/lib/prisma");

(async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection error");
    console.error(err);
  }
})();

module.exports = prisma;

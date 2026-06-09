require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/User");

const [, , username, password, email, displayName] = process.argv;

if (!username || !password) {
  console.error("Usage: node scripts/createUser.js <username> <password> [email] [displayName]");
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ username: username.toLowerCase().trim() });
  if (existing) {
    console.error(`User "${username}" already exists.`);
    process.exit(1);
  }

  if (email) {
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      console.error(`A user with email "${email}" already exists.`);
      process.exit(1);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ username, passwordHash, email, displayName });
  console.log(`Created user: ${username}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => mongoose.disconnect());

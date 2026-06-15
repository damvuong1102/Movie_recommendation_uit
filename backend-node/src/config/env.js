const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
}

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
}

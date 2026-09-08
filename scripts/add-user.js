import "dotenv/config";
import { addUser } from "../src/shared/users.js";

const [username, password, phone] = process.argv.slice(2);

if (!username || !password || !phone) {
  console.error("Pemakaian: node scripts/add-user.js <username> <password> <phone>");
  console.error('Contoh:    node scripts/add-user.js budi rahasia123 850094202');
  process.exit(1);
}

try {
  await addUser(username, password, phone);
  console.log(`✅ User "${username}" berhasil ditambahkan (phone: ${phone}).`);
} catch (err) {
  console.error("❌ Gagal nambah user:", err.message);
  process.exit(1);
}

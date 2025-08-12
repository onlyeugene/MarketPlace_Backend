import bcrypt from "bcryptjs";

     async function hashPassword(password: string) {
       const hashedPassword = await bcrypt.hash(password, 12);
       console.log("Hashed Password:", hashedPassword);
     }

     hashPassword("securepassword123");
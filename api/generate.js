import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const buffer = Buffer.concat(chunks);
    const uploadPath = path.join("/tmp", "input.xlsm");
    fs.writeFileSync(uploadPath, buffer);

    const process = spawn("python3", ["backend.py", uploadPath], {
      cwd: process.cwd(),
    });

    let output = "";
    let error = "";

    process.stdout.on("data", (data) => (output += data.toString()));
    process.stderr.on("data", (data) => (error += data.toString()));

    process.on("close", (code) => {
      if (code === 0) res.status(200).json({ message: output.trim() });
      else res.status(500).json({ error: error || "Python process failed" });
    });
  });
}

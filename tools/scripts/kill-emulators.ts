import { execSync } from "child_process";

const ports = [4000, 5001, 8080, 9000, 9099, 9199, 5005, 5000]; // Adicione/remova portas conforme necessário

for (const port of ports) {
  try {
    // Encontra o PID do processo usando a porta e mata o processo (Windows)
    execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a`, { stdio: "ignore" });
    console.log(`Processo na porta ${port} finalizado.`);
  } catch {
    // Porta não está em uso, ignora erro
  }
}

const { execSync } = require('child_process');
try {
  const output = execSync('wmic process where "name=\'node.exe\'" get processid,commandline').toString();
  console.log(output);
} catch (e) {
  console.error("Error executing wmic:", e.message);
  // fallback using PowerShell
  try {
    const psOutput = execSync('powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name = \'node.exe\'\\" | Select-Object ProcessId, CommandLine | Format-List"').toString();
    console.log(psOutput);
  } catch (pe) {
    console.error("Error executing powershell:", pe.message);
  }
}

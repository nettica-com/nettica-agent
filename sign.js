const { exec } = require("child_process");

module.exports = function signExecutable(executablePath) {
  // Log the type and content of executablePath to debug
  console.log(`Type of executablePath: ${typeof executablePath}`);
  console.log(`Content of executablePath:`, executablePath);

  // Assuming executablePath might be an object with a path property
  const filePath =
    typeof executablePath === "object" ? executablePath.path : executablePath;

  return new Promise((resolve, reject) => {
    const signtoolPath = `"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\signtool.exe"`;
    const timestampServer = "http://ts.ssl.com";
    const certThumbprint = "CBB53B9D617593941E91E50AD9E51A9FD3700838";
    const command = `${signtoolPath} sign /tr ${timestampServer} /td sha256 /fd sha256 /sha1 ${certThumbprint} "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      console.log(`Stdout: ${stdout}`);
      resolve(stdout);
    });
  });
};

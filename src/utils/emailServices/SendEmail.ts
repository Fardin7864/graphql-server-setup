import tls, { ConnectionOptions, TLSSocket } from 'tls';


const SMTP_SERVER = process.env.SMTP_SERVER || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

/**
 * Sends a command to the SMTP server and waits for the response.
 */
function sendCommand(socket: TLSSocket, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    socket.write(command + '\r\n');
    socket.once('data', (data) => {
      const response = data.toString();
      console.log(`Server response to "${command.trim()}": ${response}`);
      resolve(response);
    });
    socket.once('error', reject);
  });
}

/**
 * Sends an email using raw SMTP commands over TLS.
 */
export async function sendEmail(to: string, subject: string, message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: ConnectionOptions = {
      host: SMTP_SERVER,
      port: SMTP_PORT,
      servername: SMTP_SERVER,
    };

    const socket = tls.connect(options, async () => {
      try {
        // Handle the initial 220 response from the server
        let response = await sendCommand(socket, '');

        // Send EHLO command to start the SMTP conversation
        response = await sendCommand(socket, `EHLO ${SMTP_SERVER}`);
        if (!response.includes('250')) throw new Error('EHLO failed');

        response = await sendCommand(socket, `AUTH LOGIN`);
        if (!response.includes('334')) throw new Error('AUTH LOGIN failed');

        response = await sendCommand(socket, Buffer.from(EMAIL_USER).toString('base64'));
        if (!response.includes('334')) throw new Error('Username failed');

        response = await sendCommand(socket, Buffer.from(EMAIL_PASS).toString('base64'));
        if (!response.includes('235')) throw new Error('Password failed');

        response = await sendCommand(socket, `MAIL FROM:<${EMAIL_USER}>`);
        if (!response.includes('250')) throw new Error('MAIL FROM failed');

        response = await sendCommand(socket, `RCPT TO:<${to}>`);
        if (!response.includes('250')) throw new Error('RCPT TO failed');

        response = await sendCommand(socket, `DATA`);
        if (!response.includes('354')) throw new Error('DATA command failed');

        // Construct email headers and body
        const emailBody = `Subject: ${subject}\r\nFrom: ${EMAIL_USER}\r\nTo: ${to}\r\n\r\n${message}\r\n.\r\n`;
        response = await sendCommand(socket, emailBody);
        if (!response.includes('250')) throw new Error('Message body failed');

        response = await sendCommand(socket, `QUIT`);
        if (response.includes('221')) {
          resolve('Email sent successfully');
        } else {
          throw new Error('QUIT command failed');
        }
      } catch (error) {
        reject(new Error(`Failed to send email: ${(error as Error).message}`));
      } finally {
        socket.end();
      }
    });

    socket.on('error', (err) => {
      reject(new Error(`Socket error: ${err.message}`));
    });
  });
}

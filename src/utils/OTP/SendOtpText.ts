import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACbbfaf207c7f26d393c2e715023565179';
const authToken = process.env.TWILIO_AUTH_TOKEN || '47b46ee749aa21e1242c012109506ce8';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+14158136415';

const client = twilio(accountSid, authToken);

/**
 * Generates a 6-digit OTP
 * @returns A string containing a 6-digit OTP
 */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends an OTP to the specified mobile number using Twilio.
 * @param to - The recipient's mobile number in E.164 format (e.g., +1234567890)
 * @returns A promise that resolves when the OTP is successfully sent
 */
export async function sendOtp(to: string): Promise<string> {
  const otp = generateOtp();
  const messageBody = `Your OTP code is: ${otp}`;

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to,
    });

    console.log(`OTP sent successfully: ${message.sid}`);
    return otp; // Return OTP for further verification if needed
  } catch (error) {
    console.error(`Failed to send OTP: ${(error as Error).message}`);
    throw new Error('Failed to send OTP');
  }
}


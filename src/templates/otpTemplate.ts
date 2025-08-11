const otpTemplate = (otp: string, name: string): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #007bff; color: white; padding: 10px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .otp { font-size: 24px; font-weight: bold; color: #007bff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Market Place OTP Verification</h2>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <p>Please use the following One-Time Password (OTP) to complete your action:</p>
      <p class="otp">${otp}</p>
      <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      <p>Best regards,<br>Market Place Team</p>
    </div>
  </div>
</body>
</html>
`;

export default otpTemplate;
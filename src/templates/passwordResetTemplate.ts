/**
 * Generate HTML email template for password reset
 */
const passwordResetTemplate = (resetURL: string, fullName: string): string => {
    return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      background-color: #f4f4f4;
                      margin: 0;
                      padding: 0;
                  }
                  .container {
                      max-width: 600px;
                      margin: 20px auto;
                      background-color: #ffffff;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  }
                  .header {
                      background-color: #007bff;
                      color: #ffffff;
                      padding: 15px;
                      text-align: center;
                      border-radius: 8px 8px 0 0;
                  }
                  .content {
                      padding: 20px;
                      line-height: 1.6;
                  }
                  .button {
                      display: inline-block;
                      padding: 10px 20px;
                      background-color: #007bff;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 5px;
                      margin: 10px 0;
                  }
                  .footer {
                      text-align: center;
                      padding: 10px;
                      font-size: 12px;
                      color: #666666;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>Password Reset Request</h1>
                  </div>
                  <div class="content">
                      <p>Hello ${fullName},</p>
                      <p>We received a request to reset your password for your account. Click the button below to reset it:</p>
                      <a href="${resetURL}" class="button">Reset Your Password</a>
                      <p>This link will expire in 10 minutes for security reasons.</p>
                      <p>If you did not request a password reset, please ignore this email or contact support.</p>
                      <p>Thank you,<br>The Market Place Team</p>
                  </div>
                  <div class="footer">
                      <p>&copy; ${new Date().getFullYear()} Market Place. All rights reserved.</p>
                  </div>
              </div>
          </body>
          </html>
      `;
  };
  
  export default passwordResetTemplate;
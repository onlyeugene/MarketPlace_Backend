/**
 * Generates HTML template for welcome email
 */
const registrationTemplate = (fullName: string): string => {
    return `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <title>Welcome to Market Place</title>
              <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #f8f8f8; padding: 20px; text-align: center; }
                  .content { padding: 20px; }
                  .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>Welcome to Market Place!</h1>
                  </div>
                  <div class="content">
                      <p>Hello ${fullName},</p>
                      <p>Welcome to Market Place! We're thrilled to have you join our community.</p>
                      <p>Get started by exploring our platform and discovering amazing opportunities.</p>
                      <p>If you have any questions, feel free to contact our support team.</p>
                  </div>
                  <div class="footer">
                      <p>&copy; ${new Date().getFullYear()} Market Place. All rights reserved.</p>
                  </div>
              </div>
          </body>
          </html>
      `;
  };
  
  export default registrationTemplate;
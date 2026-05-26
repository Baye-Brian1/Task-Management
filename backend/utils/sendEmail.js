const SibApiV3Sdk = require("@getbrevo/brevo");

const apiInstance =
new SibApiV3Sdk.TransactionalEmailsApi();

apiInstance.authentications["apiKey"].apiKey =
process.env.BREVO_API_KEY;

const sendReminderEmail = async (
  email,
  task
) => {

  const sendSmtpEmail =
  new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject =
  "Task Reminder";

  sendSmtpEmail.htmlContent = `
    <h2>${task.title}</h2>
    <p>Your task deadline has been reached.</p>
  `;

  sendSmtpEmail.sender = {
    name: "Todo App",
    email: "your@email.com"
  };

  sendSmtpEmail.to = [{ email }];

  await apiInstance.sendTransacEmail(
    sendSmtpEmail
  );

};

module.exports = sendReminderEmail;
import * as nodemailer from "nodemailer";
import { logger } from "../utils/logger";

/**
 * Configuração do transporter de email
 * Em produção, usar variáveis de ambiente
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPassword = process.env.SMTP_PASSWORD || "";

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true para 465, false para outras portas
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

/**
 * Template de email de ativação
 */
function getActivationEmailTemplate(
  accessToken: string,
  planName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .token-box {
      background: white;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
      color: #667eea;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Bem-vindo ao Notikfy!</h1>
  </div>
  <div class="content">
    <p>Olá!</p>
    <p>Sua assinatura do plano <strong>${planName}</strong> foi ativada com sucesso!</p>
    <p>Use o código de ativação abaixo para acessar sua conta:</p>
    <div class="token-box">${accessToken}</div>
    <p>Copie este código e cole no aplicativo para começar a usar o Notikfy.</p>
    <p>Se você não solicitou esta assinatura, ignore este email.</p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Notikfy. Todos os direitos reservados.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de ativação com access_token
 */
export async function sendActivationEmail(
  email: string,
  accessToken: string,
  planName: string
): Promise<void> {
  try {
    const transporter = createTransporter();

    // Verifica se as credenciais SMTP estão configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.warn(
        "Credenciais SMTP não configuradas. Email não será enviado.",
        {
          email,
        }
      );
      // Em desenvolvimento, apenas loga o token
      logger.info("Access Token gerado (email não enviado):", {
        email,
        accessToken,
      });
      return;
    }

    const mailOptions = {
      from: `"Notikfy" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Bem-vindo ao Notikfy - Seu código de ativação",
      html: getActivationEmailTemplate(accessToken, planName),
      text: `Bem-vindo ao Notikfy!\n\nSua assinatura do plano ${planName} foi ativada.\n\nSeu código de ativação: ${accessToken}\n\nCopie este código e cole no aplicativo para começar.`,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("Email de ativação enviado com sucesso", {
      email,
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error("Erro ao enviar email de ativação", error);
    // Não lança erro para não quebrar o fluxo de criação de assinatura
    // O token ainda será criado mesmo se o email falhar
    throw new Error("Falha ao enviar email de ativação");
  }
}

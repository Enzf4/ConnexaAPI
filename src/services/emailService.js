const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Verificar configuração do email
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Servidor de email configurado corretamente');
      return true;
    } catch (error) {
      console.error('❌ Erro na configuração do email:', error);
      return false;
    }
  }

  // Enviar email de recuperação de senha
  async sendPasswordResetEmail(email, name, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Connexa <noreply@connexa.com>',
        to: email,
        subject: 'Redefinição de Senha - Connexa',
        html: this.getPasswordResetTemplate(name, resetUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de recuperação enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error);
      throw error;
    }
  }

  // Enviar email de boas-vindas
  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Connexa <noreply@connexa.com>',
        to: email,
        subject: 'Bem-vindo ao Connexa! 🎉',
        html: this.getWelcomeTemplate(name)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de boas-vindas enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar email de boas-vindas:', error);
      throw error;
    }
  }

  // Enviar notificação de novo membro no grupo
  async sendNewMemberNotification(email, name, groupName, memberName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Connexa <noreply@connexa.com>',
        to: email,
        subject: `Novo membro no grupo ${groupName}`,
        html: this.getNewMemberTemplate(name, groupName, memberName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Notificação de novo membro enviada:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de novo membro:', error);
      throw error;
    }
  }

  // Template para recuperação de senha
  getPasswordResetTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha - Connexa</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinição de Senha</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Você solicitou a redefinição da sua senha no Connexa.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            <p><strong>Este link expira em 1 hora.</strong></p>
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            <hr>
            <p><small>Se o botão não funcionar, copie e cole este link no seu navegador:</small></p>
            <p><small>${resetUrl}</small></p>
          </div>
          <div class="footer">
            <p>Connexa - Conectando estudantes universitários</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Template para boas-vindas
  getWelcomeTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Connexa!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Connexa!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Seja bem-vindo(a) à plataforma Connexa!</p>
            <p>Aqui você pode:</p>
            <ul>
              <li>📚 Criar e participar de grupos de estudo</li>
              <li>💬 Conversar em tempo real com seus colegas</li>
              <li>🔔 Receber notificações sobre atividades</li>
              <li>👥 Conectar-se com estudantes do seu curso</li>
            </ul>
            <p>Comece explorando os grupos disponíveis ou crie o seu próprio!</p>
            <a href="${process.env.FRONTEND_URL}" class="button">Acessar Connexa</a>
            <p>Se você tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
          </div>
          <div class="footer">
            <p>Connexa - Conectando estudantes universitários</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Template para novo membro no grupo
  getNewMemberTemplate(name, groupName, memberName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo membro no grupo ${groupName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👥 Novo membro no grupo!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p><strong>${memberName}</strong> acabou de entrar no grupo <strong>"${groupName}"</strong>!</p>
            <p>Agora vocês podem estudar juntos e trocar conhecimentos.</p>
            <a href="${process.env.FRONTEND_URL}" class="button">Ver Grupo</a>
            <p>Que tal dar as boas-vindas ao novo membro no chat do grupo?</p>
          </div>
          <div class="footer">
            <p>Connexa - Conectando estudantes universitários</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();

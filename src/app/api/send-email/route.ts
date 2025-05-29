import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configuração do transporter do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const { email, phone, conversation } = await req.json();

    // Validação básica - precisa ter pelo menos um contato e a conversa
    if ((!email && !phone) || !conversation) {
      return NextResponse.json(
        { error: 'É necessário fornecer pelo menos um contato (email ou telefone) e a conversa' },
        { status: 400 }
      );
    }

    // Prepara o conteúdo do email
    const subject = 'Registro da sua conversa';
    const text = `
      Detalhes do seu contato:
      ${email ? `Email: ${email}` : ''}
      ${phone ? `Telefone: ${phone}` : ''}
      
      Sua conversa:
      ${conversation}
    `;

    const html = `
      <h2>Registro da sua conversa</h2>
      <div style="margin-bottom: 20px;">
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
        ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
      </div>
      <h3>Sua conversa:</h3>
      <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${conversation}</pre>
    `;

    // Envia o email para o usuário
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email || process.env.ADMIN_EMAIL, // Se não tiver email, envia para o admin
      subject,
      text,
      html,
    });

    // Se tiver email do usuário, envia uma cópia para o admin
    if (email && process.env.ADMIN_EMAIL) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: 'Nova conversa registrada',
        text: `
          Nova conversa registrada:
          
          Email do usuário: ${email}
          Telefone: ${phone || 'Não informado'}
          
          Conversa:
          ${conversation}
        `,
        html: `
          <h2>Nova conversa registrada</h2>
          <p><strong>Email do usuário:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
          <h3>Conversa:</h3>
          <pre>${conversation}</pre>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: 'Falha ao enviar email' },
      { status: 500 }
    );
  }
} 
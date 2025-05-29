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

    // Verifica se o email do administrador está configurado
    if (!process.env.ADMIN_EMAIL) {
      throw new Error('Email do administrador não configurado');
    }

    // Prepara o conteúdo do email
    const subject = 'Nova conversa registrada';
    const text = `
      Detalhes do contato:
      ${email ? `Email: ${email}` : ''}
      ${phone ? `Telefone: ${phone}` : ''}
      
      Conversa:
      ${conversation}
    `;

    const html = `
      <h2>Nova conversa registrada</h2>
      <div style="margin-bottom: 20px;">
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
        ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
      </div>
      <h3>Conversa:</h3>
      <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${conversation}</pre>
    `;

    // Envia o email apenas para o admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject,
      text,
      html,
    });

    return NextResponse.json({
      success: true,
      message: 'Registro enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: 'Falha ao enviar registro' },
      { status: 500 }
    );
  }
} 
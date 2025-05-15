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

    // Verifica se o email do administrador está configurado
    if (!process.env.ADMIN_EMAIL) {
      throw new Error('Email do administrador não configurado');
    }

    const subject = 'Novo Registro de Conversa';
    const text = `
      Detalhes do Cliente:
      
      Email do Cliente: ${email || 'Não informado'}
      Telefone do Cliente: ${phone || 'Não informado'}
      
      Conversa:
      ${conversation}
    `;

    const html = `
      <h2>Novo Registro de Conversa</h2>
      <p><strong>Email do Cliente:</strong> ${email || 'Não informado'}</p>
      <p><strong>Telefone do Cliente:</strong> ${phone || 'Não informado'}</p>
      <h3>Conversa:</h3>
      <pre>${conversation}</pre>
    `;

    // Envia o email para o administrador
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
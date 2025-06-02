'use client';

import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Não Autorizado</h1>
        <p className="text-gray-600 mb-6">
          O token de acesso é inválido ou expirou. Por favor, acesse o bot através do dashboard.
        </p>
        <button
          onClick={() => router.push(process.env.DASHBOARD_URL || '/')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
} 
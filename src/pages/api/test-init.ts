import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { website } = req.body;
      
      if (!website) {
        return res.status(400).json({ error: 'Website é obrigatório' });
      }

      // Primeiro, verificar se já existe um registro
      const { data: existingRecords, error: checkError } = await supabase
        .from('client_bot_usage')
        .select('*')
        .eq('website', website);

      if (checkError) {
        console.error('Erro ao verificar registros:', checkError);
        return res.status(500).json({ error: 'Erro ao verificar registros', details: checkError });
      }

      // Se não existe, criar um novo registro
      if (!existingRecords || existingRecords.length === 0) {
        const { data: insertData, error: insertError } = await supabase
          .from('client_bot_usage')
          .insert({
            website: website,
            bot_name: 'AI Assistant',
            enabled: true,
            tokens_used: 0,
            interactions: 0,
            available_interactions: 1000000,
            total_tokens: 0,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao inserir registro:', insertError);
          return res.status(500).json({ error: 'Erro ao criar registro', details: insertError });
        }

        return res.status(201).json({ 
          message: 'Registro criado com sucesso', 
          data: insertData,
          action: 'created'
        });
      }

      // Se existe, apenas retornar
      return res.status(200).json({ 
        message: 'Registro já existe', 
        data: existingRecords[0],
        action: 'existing'
      });

    } catch (error) {
      console.error('Erro geral:', error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 
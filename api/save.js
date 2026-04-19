import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { name, role, taskName, taskFreq, taskReason, taskInput, taskOutput, steps, aiTool, prompt } = req.body;

    const { data, error } = await supabase
      .from('worksheets')
      .insert({
        name: (name || '').slice(0, 100),
        role: (role || '').slice(0, 200),
        task_name: (taskName || '').slice(0, 1000),
        task_freq: (taskFreq || '').slice(0, 500),
        task_reason: (taskReason || '').slice(0, 1000),
        task_input: (taskInput || '').slice(0, 1000),
        task_output: (taskOutput || '').slice(0, 1000),
        steps: steps || [],
        ai_tool: (aiTool || '').slice(0, 200),
        prompt: (prompt || '').slice(0, 5000),
        actions: []
      })
      .select('id')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ id: data.id });
  }

  if (req.method === 'PATCH') {
    const { id, action } = req.body;
    if (!id || !action) return res.status(400).json({ error: 'id and action required' });

    const { error } = await supabase.rpc('append_action', {
      worksheet_id: id,
      new_action: action
    });

    if (error) {
      // fallback: read + update
      const { data } = await supabase.from('worksheets').select('actions').eq('id', id).single();
      const actions = data ? [...(data.actions || []), action] : [action];
      await supabase.from('worksheets').update({ actions }).eq('id', id);
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

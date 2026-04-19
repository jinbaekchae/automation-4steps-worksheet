-- Supabase SQL Editor에서 실행
CREATE TABLE worksheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  role TEXT,
  task_name TEXT,
  task_freq TEXT,
  task_reason TEXT,
  task_input TEXT,
  task_output TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  ai_tool TEXT,
  prompt TEXT,
  actions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책: service_role만 접근 가능 (프론트엔드 직접 접근 차단)
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;

-- append_action RPC 함수
CREATE OR REPLACE FUNCTION append_action(worksheet_id UUID, new_action TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE worksheets
  SET actions = array_append(actions, new_action)
  WHERE id = worksheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 테이블에 ai_tool 컬럼 추가 (이미 생성된 경우)
ALTER TABLE worksheets ADD COLUMN IF NOT EXISTS ai_tool TEXT;

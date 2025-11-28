-- 010: Add agent_type to events

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS agent_type VARCHAR(20);

-- Optional backfill from jobs if available
UPDATE events e
SET agent_type = j.agent_type
FROM jobs j
WHERE e.job_id = j.id
  AND e.agent_type IS NULL;

-- Optional constraint to align with AgentType enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'events' AND constraint_name = 'chk_events_agent_type'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT chk_events_agent_type
      CHECK (agent_type IN ('coordinator','planner','builder','reviewer','evaluator'));
  END IF;
END $$;

-- Useful index
CREATE INDEX IF NOT EXISTS idx_events_agent_type ON events(agent_type);

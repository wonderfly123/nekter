-- Populate health_score based on health_status and trend
-- Critical: 0-50, At Risk: 51-75, Healthy: 76-100

UPDATE account_health_history
SET health_score = CASE
  -- Critical accounts (0-50 range)
  WHEN health_status = 'Critical' AND trend = 'Declining' THEN 15 + (RANDOM() * 15)::numeric  -- 15-30
  WHEN health_status = 'Critical' AND trend = 'Stable' THEN 30 + (RANDOM() * 10)::numeric     -- 30-40
  WHEN health_status = 'Critical' AND trend = 'Improving' THEN 40 + (RANDOM() * 10)::numeric  -- 40-50
  WHEN health_status = 'Critical' AND trend IS NULL THEN 20 + (RANDOM() * 20)::numeric        -- 20-40

  -- At Risk accounts (51-75 range)
  WHEN health_status = 'At Risk' AND trend = 'Declining' THEN 51 + (RANDOM() * 8)::numeric    -- 51-59
  WHEN health_status = 'At Risk' AND trend = 'Stable' THEN 60 + (RANDOM() * 8)::numeric       -- 60-68
  WHEN health_status = 'At Risk' AND trend = 'Improving' THEN 68 + (RANDOM() * 7)::numeric    -- 68-75
  WHEN health_status = 'At Risk' AND trend IS NULL THEN 56 + (RANDOM() * 14)::numeric         -- 56-70

  -- Healthy accounts (76-100 range)
  WHEN health_status = 'Healthy' AND trend = 'Declining' THEN 76 + (RANDOM() * 8)::numeric    -- 76-84
  WHEN health_status = 'Healthy' AND trend = 'Stable' THEN 84 + (RANDOM() * 8)::numeric       -- 84-92
  WHEN health_status = 'Healthy' AND trend = 'Improving' THEN 92 + (RANDOM() * 8)::numeric    -- 92-100
  WHEN health_status = 'Healthy' AND trend IS NULL THEN 82 + (RANDOM() * 14)::numeric         -- 82-96

  ELSE 50::numeric -- Default fallback
END
WHERE health_score IS NULL;

-- Round to whole numbers for cleaner display
UPDATE account_health_history
SET health_score = ROUND(health_score::numeric, 0)
WHERE health_score IS NOT NULL;

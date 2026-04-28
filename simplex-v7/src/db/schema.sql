-- P31 AGENT CREW — D1 schema — SIMPLEX v7
-- OQE: wrangler d1 execute <DB_NAME> --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
-- Expect 22 user-defined tables below (core crew + SENTINEL physical layer).

CREATE TABLE IF NOT EXISTS agent_runs (
  run_id      TEXT PRIMARY KEY,
  agent_id    TEXT NOT NULL,
  trigger     TEXT NOT NULL,
  voltage     TEXT NOT NULL DEFAULT 'GREEN',
  summary     TEXT,
  items_json  TEXT,
  duration_ms INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_messages (
  id                TEXT PRIMARY KEY,
  from_agent        TEXT NOT NULL,
  to_agent          TEXT NOT NULL,
  subject           TEXT NOT NULL,
  body              TEXT,
  priority          TEXT NOT NULL DEFAULT 'P3',
  requires_response INTEGER DEFAULT 0,
  delivered        INTEGER DEFAULT 0,
  created_at       INTEGER NOT NULL,
  expires_at       INTEGER
);
CREATE INDEX IF NOT EXISTS idx_messages_to ON agent_messages(to_agent, delivered);

CREATE TABLE IF NOT EXISTS medications (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  logged_at      INTEGER NOT NULL,
  interval_hours INTEGER NOT NULL,
  critical       INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_meds_name ON medications(name, logged_at DESC);

CREATE TABLE IF NOT EXISTS spoons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  activity      TEXT NOT NULL,
  cost          REAL NOT NULL,
  balance_after REAL NOT NULL,
  ts            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_spoons_ts ON spoons(ts DESC);

CREATE TABLE IF NOT EXISTS love_ledger (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,
  amount      REAL NOT NULL,
  multiplier  REAL DEFAULT 1.0,
  yield       REAL,
  hash        TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tomograph_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sender      TEXT,
  subject     TEXT,
  voltage     TEXT NOT NULL,
  action      TEXT,
  thread_id   TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS legal_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date  INTEGER NOT NULL,
  case_number TEXT DEFAULT '2025CV936',
  parties     TEXT DEFAULT 'Johnson v. Johnson',
  logged_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_legal_date ON legal_events(event_date ASC);

CREATE TABLE IF NOT EXISTS benefits_log (
  form       TEXT PRIMARY KEY,
  status     TEXT NOT NULL,
  notes      TEXT,
  updated_at INTEGER NOT NULL
);

INSERT OR REPLACE INTO benefits_log (form, status, notes, updated_at) VALUES
  ('SF-3112A', 'COMPLETE', 'Applicant statement', strftime('%s','now')*1000),
  ('SF-3112B', 'COMPLETE', 'Supervisor signed', strftime('%s','now')*1000),
  ('SF-3112C', 'COMPLETE', 'Physician statement', strftime('%s','now')*1000),
  ('SF-3112D', 'AWAITING_AGENCY', 'Blocker', strftime('%s','now')*1000),
  ('SF-3112E', 'AWAITING_AGENCY', 'Blocker', strftime('%s','now')*1000),
  ('SF-3107', 'WILL_MUST_FILE', 'Application — operator must file', strftime('%s','now')*1000);

CREATE TABLE IF NOT EXISTS grants (
  name     TEXT PRIMARY KEY,
  amount   INTEGER,
  status   TEXT NOT NULL,
  deadline INTEGER,
  notes    TEXT,
  updated_at INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO grants (name, amount, status, deadline, notes, updated_at) VALUES
  ('Awesome Foundation', 1000, 'IN_DELIBERATION', NULL, 'Grant pipeline snapshot — operator truth', strftime('%s','now')*1000),
  ('Stimpunks', 3000, 'PAUSED', 1748736000000, 'Re-opens June 1, 2026', strftime('%s','now')*1000);

CREATE TABLE IF NOT EXISTS financial_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event       TEXT NOT NULL,
  amount      REAL,
  notes       TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS engineering_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,
  description TEXT,
  metadata    TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wcds (
  id           TEXT PRIMARY KEY,
  scope        TEXT NOT NULL,
  agent_lane   TEXT NOT NULL,
  oqe          TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'OPEN',
  close_evidence TEXT,
  est_days     REAL DEFAULT 1,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

INSERT OR IGNORE INTO wcds (id, scope, agent_lane, oqe, status, close_evidence, est_days, created_at, updated_at) VALUES
 ('WCD-SIMPLEX-01','D1 schema + seeds','Mechanic','22 user tables + automations seeded; sqlite_master','OPEN',NULL,0.5, strftime('%s','now')*1000,strftime('%s','now')*1000),
 ('WCD-SIMPLEX-02','simplex-worker HTTP+HMAC','Mechanic','Routes+HMAC behave per matrix','OPEN',NULL,1,strftime('%s','now')*1000,strftime('%s','now')*1000),
 ('WCD-SIMPLEX-03','cron → runner','Mechanic','wrangler tail shows scheduled cohort','OPEN',NULL,0.5,strftime('%s','now')*1000,strftime('%s','now')*1000),
 ('WCD-SIMPLEX-04','Tomograph Email Worker','Mechanic','inbound hostile redacts + D1 logs','OPEN',NULL,0.5,strftime('%s','now')*1000,strftime('%s','now')*1000),
 ('WCD-SIMPLEX-05','React gauge module','Mechanic','4 widgets render vs API truth','OPEN',NULL,1.5,strftime('%s','now')*1000,strftime('%s','now')*1000),
 ('WCD-SIMPLEX-06','Vitest port','Mechanic','75 tests + typecheck green offline','OPEN',NULL,0.5,strftime('%s','now')*1000,strftime('%s','now')*1000);

CREATE TABLE IF NOT EXISTS research_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,
  title       TEXT,
  doi         TEXT,
  status      TEXT,
  notes       TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS deadlines (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  title     TEXT NOT NULL,
  track     TEXT NOT NULL,
  due_date  INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  notes     TEXT
);

INSERT OR IGNORE INTO deadlines (title, track, due_date, notes) VALUES
  ('Camden County wellness baseline','EVENTS',1745971200000,'Apr 30, 2026'),
  ('Georgia Tech Summit','EVENTS',1745971200000,'Apr 30, 2026'),
  ('Neurotech Frontiers Summit','EVENTS',1747612800000,'May 19, 2026'),
  ('Stimpunks reopen','GRANTS',1748736000000,'June 1, 2026'),
  ('FERS disability retirement filing','FERS',1759190400000,'Sep 30, 2026'),
  ('Fleet engineering backlog','ENGINEERING',0,'Replace with GH/verify truth');

CREATE TABLE IF NOT EXISTS ops_manual_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  section     TEXT NOT NULL,
  change      TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS synthesis_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL DEFAULT 'session',
  content     TEXT,
  q_factor    REAL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS system_state_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  state_json  TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

-- ── SENTINEL — physical layer (device events, biometrics, HA bridge) ───────────

CREATE TABLE IF NOT EXISTS device_states (
  entity_id    TEXT PRIMARY KEY,
  state        TEXT NOT NULL,
  attributes   TEXT,
  source       TEXT NOT NULL DEFAULT 'home_assistant',
  updated_at   INTEGER NOT NULL
);

INSERT OR IGNORE INTO device_states (entity_id, state, attributes, source, updated_at) VALUES
  ('node_zero', 'unknown', '{"hw":"ESP32-S3-Touch-LCD-3.5B"}', 'hardware', strftime('%s','now')*1000),
  ('node_one', 'offline', '{"hw":"ESP32-S3","role":"totem"}', 'hardware', strftime('%s','now')*1000),
  ('meshtastic_0', 'unknown', '{"freq":"915MHz"}', 'meshtastic', strftime('%s','now')*1000);

CREATE TABLE IF NOT EXISTS biometric_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  type     TEXT NOT NULL,
  value    REAL NOT NULL,
  unit     TEXT,
  source   TEXT NOT NULL DEFAULT 'gadgetbridge',
  ts       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bio_type_ts ON biometric_log(type, ts DESC);

CREATE TABLE IF NOT EXISTS home_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,
  entity_id  TEXT,
  data       TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_home_ts ON home_events(created_at DESC);

CREATE TABLE IF NOT EXISTS automation_rules (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,
  trigger_type TEXT NOT NULL,
  condition    TEXT NOT NULL,
  action       TEXT NOT NULL,
  enabled      INTEGER DEFAULT 1,
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  last_fired   INTEGER
);

INSERT OR IGNORE INTO automation_rules
(name, trigger_type, condition, action, enabled, created_by, created_at) VALUES
('safe_mode_scene','agent_state','{"agent":"MEDIC","state_key":"safe_mode_active","value":true}','{"scene":"focus","haptic":{"target":"wearable","pattern":"safe-mode"}}',1,'SENTINEL',strftime('%s','now')*1000),
('meltdown_scene','agent_state','{"agent":"MEDIC","state_key":"meltdown_active","value":true}','{"scene":"reset","tts":"Breathe. You are safe."}',1,'SENTINEL',strftime('%s','now')*1000),
('medication_calcitriol_alert','agent_state','{"agent":"MEDIC","medication":"Calcitriol","overdue_minutes":{"gte":5}}','{"scene":"medication-alert","haptic":{"pattern":"medication"}}',1,'SENTINEL',strftime('%s','now')*1000),
('calcium_window_clear','agent_state','{"agent":"MEDIC","calcium_gap_hours":{"gte":4}}','{"haptic":{"pattern":"calcium-clear"}}',1,'SENTINEL',strftime('%s','now')*1000),
('kids_home_bonding_preload','presence','{"person_id":["person.sj","person.wj"],"state":"home"}','{"agent_message":{"to":"STEWARD","subject":"Kids home","priority":"P2"},"scene":"play"}',1,'SENTINEL',strftime('%s','now')*1000),
('counsel_running_scene','agent_state','{"agent":"COUNSEL","voltage":"RED"}','{"scene":"legal"}',1,'SENTINEL',strftime('%s','now')*1000),
('low_hrv_spoon_alert','biometric','{"type":"hrv_ms","value":{"lt":20}}','{"scene":"decompression"}',1,'SENTINEL',strftime('%s','now')*1000),
('deep_work_block','time','{"time_range":["09:30","12:00"],"weekdays":[1,2,3,4,5]}','{"scene":"deep-work"}',1,'SENTINEL',strftime('%s','now')*1000),
('night_mode','time','{"time":"22:00"}','{"scene":"night-mode"}',1,'SENTINEL',strftime('%s','now')*1000),
('morning_briefing_tts','agent_state','{"agent":"STEWARD","hour":6}','{"tts_from_kv":"daily_briefing"}',1,'SENTINEL',strftime('%s','now')*1000),
('oracle_low_q_decompression','agent_state','{"agent":"ORACLE","q_factor":{"lt":0.4}}','{"scene":"decompression"}',1,'SENTINEL',strftime('%s','now')*1000),
('forge_test_regression','agent_state','{"agent":"FORGE","test_regression":true}','{"agent_message":{"to":"STEWARD","subject":"Regression","priority":"P0"}}',1,'SENTINEL',strftime('%s','now')*1000),
('steps_recovery_credit','biometric','{"type":"steps","value":{"gte":5000},"before_hour":12}','{"agent_message":{"to":"MEDIC","priority":"P2"}}',1,'SENTINEL',strftime('%s','now')*1000),
('hr_sustained_tach','biometric','{"type":"heart_rate_high","minutes":{"gte":5}}','{"agent_message":{"to":"MEDIC","priority":"P2"}}',1,'SENTINEL',strftime('%s','now')*1000),
('bonding_room_active','mqtt','{"topic_contains":"bonding/session"}','{"scene":"play"}',1,'SENTINEL',strftime('%s','now')*1000);

CREATE TABLE IF NOT EXISTS mqtt_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic      TEXT NOT NULL,
  payload    TEXT,
  direction  TEXT NOT NULL DEFAULT 'inbound',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mqtt_topic ON mqtt_log(topic, created_at DESC);

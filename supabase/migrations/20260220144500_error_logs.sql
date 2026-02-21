CREATE TABLE IF NOT EXISTS sys_error_logs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

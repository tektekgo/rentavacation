-- Phase 14: Executive Dashboard — system_settings rows for API key storage
-- Uses correct column names: setting_key, setting_value, description

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
  ('executive_dashboard_newsapi_key', '', 'NewsAPI.org API key for industry news feed'),
  ('executive_dashboard_airdna_api_key', '', 'AirDNA API key for market intelligence (BYOK)'),
  ('executive_dashboard_str_api_key', '', 'STR Global API key for hotel benchmarks (BYOK)'),
  ('executive_dashboard_refresh_interval', '30', 'Dashboard auto-refresh interval in minutes')
ON CONFLICT (setting_key) DO NOTHING;

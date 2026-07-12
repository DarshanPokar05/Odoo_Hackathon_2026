-- Migration: 003_asset_tag_sequence.sql
-- Purpose: Postgres Sequence for race-free sequential asset tags (AF-XXXX) and custom_fields JSONB on assets

CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START WITH 1100 INCREMENT BY 1;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add language column to guides table
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'en';

-- Optional: Create an index on the language column for faster filtering
CREATE INDEX IF NOT EXISTS guides_language_idx ON public.guides("language");

-- Comment explaining the language codes
-- en (us flag) -> English
-- tr -> TÜRKÇE
-- es -> Español
-- ru -> Русский
-- in -> हिन्दी
-- cn -> 中文
-- jp -> 日本語
-- kr -> 한국어
-- vn -> Tiếng Việt
-- ph -> Tagalog
-- id -> Bahasa Indonesia

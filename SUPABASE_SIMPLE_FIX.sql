-- 모든 RLS 정책을 일시적으로 비활성화 (개발/테스트용)
-- 주의: 프로덕션에서는 사용하지 마세요!

-- profiles 테이블 RLS 비활성화
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- boards 테이블 RLS 비활성화  
ALTER TABLE public.boards DISABLE ROW LEVEL SECURITY;

-- 다시 활성화하려면:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
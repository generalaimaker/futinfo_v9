-- 1. boards 테이블의 RLS 정책 확인 및 수정
-- 먼저 기존 정책들을 확인
SELECT * FROM pg_policies WHERE tablename = 'boards';

-- boards 테이블에 대한 공개 읽기 권한 추가
CREATE POLICY "Anyone can view boards" ON public.boards
    FOR SELECT USING (true);

-- profiles 테이블에 대한 추가 정책
-- 인증된 사용자는 누구나 프로필을 볼 수 있도록
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 공개 프로필 조회 허용
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- 2. Apple 로그인 시 필요한 메타데이터 처리를 위한 함수 수정
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 프로필 생성 시도, 에러가 나도 계속 진행
    BEGIN
        INSERT INTO public.profiles (user_id, nickname)
        VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'nickname',
                split_part(NEW.email, '@', 1),
                'User'
            )
        )
        ON CONFLICT (user_id) DO UPDATE
        SET updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        -- 에러가 발생해도 로그인은 계속 진행
        NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. auth.users 테이블에 대한 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 기존 Apple 로그인 사용자들의 프로필 생성 (없는 경우)
INSERT INTO public.profiles (user_id, nickname)
SELECT 
    id, 
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        email,
        'Apple User'
    )
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- 5. 권한 설정
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
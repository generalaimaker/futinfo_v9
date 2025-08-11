-- Add more team boards for Premier League, La Liga, etc.
INSERT INTO public.boards (id, name, description, category, display_order)
VALUES 
  -- Premier League
  ('team_47', 'Tottenham Hotspur', '토트넘 홋스퍼 팬 게시판', 'team', 11),
  ('team_49', 'Chelsea', '첼시 팬 게시판', 'team', 12),
  ('team_34', 'Newcastle United', '뉴캐슬 유나이티드 팬 게시판', 'team', 13),
  ('team_48', 'West Ham United', '웨스트햄 유나이티드 팬 게시판', 'team', 14),
  ('team_51', 'Brighton', '브라이튼 팬 게시판', 'team', 15),
  ('team_66', 'Aston Villa', '아스톤 빌라 팬 게시판', 'team', 16),
  ('team_63', 'Leeds United', '리즈 유나이티드 팬 게시판', 'team', 17),
  ('team_46', 'Leicester City', '레스터 시티 팬 게시판', 'team', 18),
  ('team_45', 'Everton', '에버튼 팬 게시판', 'team', 19),
  ('team_39', 'Wolves', '울버햄튼 팬 게시판', 'team', 20),
  
  -- La Liga
  ('team_530', 'Atletico Madrid', '아틀레티코 마드리드 팬 게시판', 'team', 21),
  ('team_531', 'Athletic Bilbao', '아틀레틱 빌바오 팬 게시판', 'team', 22),
  ('team_533', 'Villarreal', '비야레알 팬 게시판', 'team', 23),
  ('team_532', 'Valencia', '발렌시아 팬 게시판', 'team', 24),
  ('team_536', 'Sevilla', '세비야 팬 게시판', 'team', 25),
  ('team_548', 'Real Sociedad', '레알 소시에다드 팬 게시판', 'team', 26),
  ('team_543', 'Real Betis', '레알 베티스 팬 게시판', 'team', 27),
  
  -- Bundesliga
  ('team_157', 'Bayern Munich', '바이에른 뮌헨 팬 게시판', 'team', 28),
  ('team_165', 'Borussia Dortmund', '보루시아 도르트문트 팬 게시판', 'team', 29),
  ('team_173', 'RB Leipzig', 'RB 라이프치히 팬 게시판', 'team', 30),
  ('team_168', 'Bayer Leverkusen', '바이어 레버쿠젠 팬 게시판', 'team', 31),
  ('team_169', 'Hoffenheim', '호펜하임 팬 게시판', 'team', 32),
  ('team_161', 'VfL Wolfsburg', '볼프스부르크 팬 게시판', 'team', 33),
  ('team_163', 'Borussia M.Gladbach', '보루시아 묀헨글라트바흐 팬 게시판', 'team', 34),
  
  -- Serie A
  ('team_496', 'Juventus', '유벤투스 팬 게시판', 'team', 35),
  ('team_505', 'Inter', '인터 밀란 팬 게시판', 'team', 36),
  ('team_489', 'AC Milan', 'AC 밀란 팬 게시판', 'team', 37),
  ('team_492', 'Napoli', '나폴리 팬 게시판', 'team', 38),
  ('team_487', 'Lazio', '라치오 팬 게시판', 'team', 39),
  ('team_497', 'AS Roma', 'AS 로마 팬 게시판', 'team', 40),
  ('team_499', 'Atalanta', '아탈란타 팬 게시판', 'team', 41),
  
  -- Ligue 1
  ('team_85', 'Paris Saint Germain', '파리 생제르맹 팬 게시판', 'team', 42),
  ('team_79', 'Lille', '릴 팬 게시판', 'team', 43),
  ('team_81', 'Marseille', '마르세유 팬 게시판', 'team', 44),
  ('team_80', 'Lyon', '리옹 팬 게시판', 'team', 45),
  ('team_77', 'Angers', '앙제 팬 게시판', 'team', 46),
  ('team_91', 'Monaco', '모나코 팬 게시판', 'team', 47)
ON CONFLICT (id) DO NOTHING;
#!/bin/bash

# Firebase Functions 배포 스크립트
# 이 스크립트는 Functions를 배포하기 전에 필요한 점검사항을 확인합니다.

echo "🚀 Firebase Functions 배포 스크립트"
echo "=================================="

# 현재 디렉토리 확인
if [ ! -f "firebase.json" ]; then
    echo "❌ 오류: firebase.json 파일을 찾을 수 없습니다."
    echo "   footdata-server 디렉토리에서 실행해주세요."
    exit 1
fi

# Functions 디렉토리로 이동
cd functions

# 환경 변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  경고: .env 파일이 없습니다."
    echo "   .env.example을 참고하여 .env 파일을 생성해주세요."
    echo ""
    echo "   cp .env.example .env"
    echo "   그리고 API_KEY와 API_HOST를 설정하세요."
    exit 1
fi

# 환경 변수 확인
echo "📋 환경 변수 확인 중..."
npm run test-env

# 의존성 설치
echo ""
echo "📦 의존성 설치 중..."
npm install

# ESLint 실행
echo ""
echo "🔍 코드 검사 중..."
npm run lint

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ESLint 오류가 발견되었습니다."
    echo "   위의 오류를 수정한 후 다시 시도해주세요."
    exit 1
fi

# 원래 디렉토리로 돌아가기
cd ..

# 배포 옵션 선택
echo ""
echo "📌 배포 옵션을 선택하세요:"
echo "1) 일반 배포 (권장)"
echo "2) 강제 배포 (--force 옵션)"
echo "3) 테스트만 실행 (배포하지 않음)"
read -p "선택 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Firebase Functions 배포 중..."
        firebase deploy --only functions
        ;;
    2)
        echo ""
        echo "🚀 Firebase Functions 강제 배포 중..."
        firebase deploy --only functions --force
        ;;
    3)
        echo ""
        echo "✅ 테스트 완료. 배포하지 않고 종료합니다."
        exit 0
        ;;
    *)
        echo ""
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

# 배포 결과 확인
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 배포가 성공적으로 완료되었습니다!"
    echo ""
    echo "📊 다음 명령어로 Functions 로그를 확인할 수 있습니다:"
    echo "   firebase functions:log"
    echo ""
    echo "🔍 캐시 상태를 확인하려면:"
    echo "   curl https://[YOUR-FUNCTION-URL]/getCacheStats"
else
    echo ""
    echo "❌ 배포 중 오류가 발생했습니다."
    echo "   위의 오류 메시지를 확인해주세요."
    exit 1
fi
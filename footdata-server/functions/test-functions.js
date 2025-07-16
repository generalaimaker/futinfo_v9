/**
 * Firebase Functions 테스트 스크립트
 * Functions의 각 엔드포인트를 로컬에서 테스트합니다.
 */

const axios = require("axios");
require("dotenv").config();

// Functions URL (배포 후 실제 URL로 변경 필요)
const FUNCTIONS_BASE_URL = process.env.FUNCTIONS_URL || "https://asia-northeast3-YOUR-PROJECT-ID.cloudfunctions.net";

// 테스트 데이터
const testCases = {
    fixtures: {
        endpoint: "/getFixtures",
        params: {
            date: "2025-07-06",
            league: "39", // Premier League
            season: "2024"
        }
    },
    standings: {
        endpoint: "/getStandings",
        params: {
            league: "39",
            season: "2024"
        }
    },
    fixtureStatistics: {
        endpoint: "/getFixtureStatistics",
        params: {
            fixture: "1035340" // 예시 fixture ID
        }
    },
    injuries: {
        endpoint: "/getInjuries",
        params: {
            team: "33", // Manchester United
            season: "2024"
        }
    },
    cacheStats: {
        endpoint: "/getCacheStats",
        params: {}
    }
};

// 색상 코드
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

// 테스트 실행 함수
async function testEndpoint(name, config) {
    console.log(`\n${colors.blue}테스트: ${name}${colors.reset}`);
    console.log(`엔드포인트: ${config.endpoint}`);
    console.log(`파라미터:`, config.params);

    try {
        const startTime = Date.now();
        const response = await axios.get(`${FUNCTIONS_BASE_URL}${config.endpoint}`, {
            params: config.params,
            timeout: 30000 // 30초 타임아웃
        });
        const endTime = Date.now();

        const responseTime = endTime - startTime;
        const dataSize = JSON.stringify(response.data).length;

        console.log(`${colors.green}✓ 성공${colors.reset}`);
        console.log(`  응답 시간: ${responseTime}ms`);
        console.log(`  데이터 크기: ${(dataSize / 1024).toFixed(2)} KB`);

        // 응답 데이터 요약
        if (response.data.response) {
            const itemCount = Array.isArray(response.data.response) ? response.data.response.length : 1;
            console.log(`  결과 개수: ${itemCount}`);
        }

        // 캐시 정보 확인 (있는 경우)
        if (response.headers["x-cache-status"]) {
            console.log(`  캐시 상태: ${response.headers["x-cache-status"]}`);
        }

        return {success: true, responseTime, dataSize};
    } catch (error) {
        console.log(`${colors.red}✗ 실패${colors.reset}`);
        console.log(`  오류: ${error.message}`);

        if (error.response) {
            console.log(`  상태 코드: ${error.response.status}`);
            console.log(`  오류 응답:`, error.response.data);
        }

        return {success: false, error: error.message};
    }
}

// 모든 테스트 실행
async function runAllTests() {
    console.log(`${colors.yellow}=== Firebase Functions 테스트 시작 ===${colors.reset}`);
    console.log(`기본 URL: ${FUNCTIONS_BASE_URL}`);
    console.log(`시작 시간: ${new Date().toISOString()}`);

    const results = {};
    let successCount = 0;
    let failCount = 0;

    for (const [name, config] of Object.entries(testCases)) {
        const result = await testEndpoint(name, config);
        results[name] = result;

        if (result.success) {
            successCount++;
        } else {
            failCount++;
        }

        // API 요청 제한을 위해 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 테스트 요약
    console.log(`\n${colors.yellow}=== 테스트 요약 ===${colors.reset}`);
    console.log(`총 테스트: ${successCount + failCount}`);
    console.log(`${colors.green}성공: ${successCount}${colors.reset}`);
    console.log(`${colors.red}실패: ${failCount}${colors.reset}`);

    // 평균 응답 시간 계산
    const successfulTests = Object.values(results).filter((r) => r.success);
    if (successfulTests.length > 0) {
        const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
        console.log(`\n평균 응답 시간: ${avgResponseTime.toFixed(0)}ms`);
    }

    console.log(`\n완료 시간: ${new Date().toISOString()}`);
}

// 단일 테스트 실행 (명령줄 인자로 지정)
async function runSingleTest(testName) {
    if (!testCases[testName]) {
        console.log(`${colors.red}오류: '${testName}' 테스트를 찾을 수 없습니다.${colors.reset}`);
        console.log(`사용 가능한 테스트: ${Object.keys(testCases).join(", ")}`);
        return;
    }

    await testEndpoint(testName, testCases[testName]);
}

// 메인 실행
const testName = process.argv[2];
if (testName) {
    runSingleTest(testName);
} else {
    runAllTests();
}


const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

// 환경 변수에서 API 키 로드
const API_KEY = process.env.API_KEY;
const API_HOST = process.env.API_HOST;

// 캐시 TTL 설정
const CACHE_TTL_SECONDS = 60 * 60; // 기본 1시간 (3,600초)
const CACHE_TTL_FUTURE = 30 * 60; // 미래 날짜 30분 (1,800초)
const CACHE_TTL_PAST = 3 * 60 * 60; // 과거 날짜 3시간 (10,800초)
const CACHE_TTL_EMPTY = 10 * 60; // 빈 데이터 10분 (600초)
const CACHE_TTL_ERROR = 5 * 60; // 오류 발생 시 5분 (300초)

// 요청 제한 관련 설정
const MAX_REQUESTS_PER_MINUTE = 400; // Rapid API 제한(450)보다 낮게 설정하여 안전 마진 확보
let requestsInLastMinute = 0;
let lastRequestResetTime = Date.now();

// 서울 리전 설정
// const functionsConfig = {
//     region: "asia-northeast3" // 서울 리전
// };

// 경기 일정 가져오기 엔드포인트 (서울 리전으로 설정)
// 공통 함수 설정
const functionsRegion = functions;

// 중복 요청 방지를 위한 진행 중인 요청 추적
const requestsInProgress = new Map();

// 요청 제한 확인 및 관리
function checkRateLimit() {
    const now = Date.now();

    // 1분이 지났으면 카운터 리셋
    if (now - lastRequestResetTime > 60 * 1000) {
        requestsInLastMinute = 0;
        lastRequestResetTime = now;
        return true;
    }

    // 분당 최대 요청 수 초과 시 제한
    if (requestsInLastMinute >= MAX_REQUESTS_PER_MINUTE) {
        return false;
    }

    // 요청 카운터 증가
    requestsInLastMinute++;
    return true;
}

// 공통 캐싱 로직을 위한 헬퍼 함수
async function fetchWithCache(endpoint, params, cacheKey, res) {
    // 요청 제한 확인
    if (!checkRateLimit()) {
        console.log(`Rate limit exceeded for ${cacheKey}`);
        return res.status(429).json({
            errors: ["Rate limit exceeded. Please try again later."],
            response: []
        });
    }

    // 이미 진행 중인 요청인지 확인 (중복 요청 방지)
    if (requestsInProgress.has(cacheKey)) {
        console.log(`Request already in progress for ${cacheKey}, waiting for result...`);

        try {
            // 진행 중인 요청의 결과를 기다림
            const pendingResult = await requestsInProgress.get(cacheKey);
            console.log(`Returning result from pending request for ${cacheKey}`);
            return res.json(pendingResult);
        } catch (error) {
            console.error(`Error while waiting for pending request ${cacheKey}:`, error);
            return res.status(500).json({
                errors: ["Error while waiting for pending request"],
                response: []
            });
        }
    }

    // 새 요청 Promise 생성 및 진행 중인 요청 목록에 추가
    const requestPromise = new Promise((resolve, reject) => {
        (async () => {
            try {
            // 강제 새로고침 파라미터 확인
                const forceRefresh = params.forceRefresh === "true";
                const cacheRef = db.collection("apiCache").doc(cacheKey);

                // 캐시 확인 (강제 새로고침이 아닌 경우에만)
                if (!forceRefresh) {
                    const cacheDoc = await cacheRef.get();

                    if (cacheDoc.exists) {
                        const data = cacheDoc.data();
                        const now = Date.now() / 1000; // 초 단위 타임스탬프

                        // 현재 날짜 확인 (UTC 기준)
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const todayTimestamp = today.getTime() / 1000;

                        // 파라미터에서 날짜 추출
                        const requestDate = params.date ? new Date(params.date) : null;

                        // 날짜 기반 TTL 결정
                        let effectiveTTL = CACHE_TTL_SECONDS; // 기본값

                        if (requestDate) {
                            const requestTimestamp = requestDate.getTime() / 1000;

                            if (requestTimestamp > todayTimestamp) {
                            // 미래 날짜 (더 짧은 TTL)
                                effectiveTTL = CACHE_TTL_FUTURE;
                                console.log(`Future date request: ${params.date}, using TTL: ${CACHE_TTL_FUTURE}s`);
                            } else if (requestTimestamp < todayTimestamp) {
                            // 과거 날짜 (더 긴 TTL)
                                effectiveTTL = CACHE_TTL_PAST;
                                console.log(`Past date request: ${params.date}, using TTL: ${CACHE_TTL_PAST}s`);
                            } else {
                            // 오늘 날짜 (기본 TTL)
                                console.log(`Today's date request: ${params.date}, using TTL: ${CACHE_TTL_SECONDS}s`);
                            }
                        }

                        // 캐시된 응답에 데이터가 있는지 확인
                        const hasData = data.response &&
                                data.response.response &&
                                Array.isArray(data.response.response) &&
                                data.response.response.length > 0;

                        // 캐시 만료 여부 확인
                        const cacheAge = now - data.timestamp;
                        const isExpired = cacheAge > effectiveTTL;

                        // 빈 데이터인 경우 더 짧은 TTL 적용
                        const emptyDataExpired = !hasData && cacheAge > CACHE_TTL_EMPTY;

                        if (!isExpired && !emptyDataExpired) {
                            console.log(`Cache hit for ${cacheKey} - ` +
                                `Age: ${Math.round(cacheAge)}s, Has data: ${hasData}`);

                            // 빈 응답인 경우 메타데이터 추가
                            if (!hasData && !data.response.meta) {
                                data.response.meta = {
                                    isEmpty: true,
                                    message: "No fixtures found for this date"
                                };
                            }

                            resolve(data.response);
                            return;
                        } else {
                            if (emptyDataExpired) {
                                console.log(`Cache hit but empty data for ${cacheKey}, ` +
                                    `age: ${Math.round(cacheAge)}s, refreshing...`);
                            } else {
                                console.log(`Cache expired for ${cacheKey}, ` +
                                `age: ${Math.round(cacheAge)}s, TTL: ${effectiveTTL}s`);
                            }
                        }
                    } else {
                        console.log(`No cache found for ${cacheKey}`);
                    }
                } else {
                    console.log(`Force refresh requested for ${cacheKey}`);
                }

                // API 호출
                console.log(`API 호출 시작: ${cacheKey} - 엔드포인트: ${endpoint}`);

                // API 요청 시도
                const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/${endpoint}`, {
                    params: params,
                    headers: {
                        "x-rapidapi-key": API_KEY,
                        "x-rapidapi-host": API_HOST,
                    },
                    timeout: 10000, // 10초 타임아웃
                });

                const apiData = response.data;

                // 한도 헤더 로그 (디버깅용)
                const dailyLimit = response.headers["x-ratelimit-requests-limit"] || "unknown";
                const dailyRemaining = response.headers["x-ratelimit-requests-remaining"] || "unknown";
                const minuteLimit = response.headers["x-ratelimit-limit"] || "unknown";
                const minuteRemaining = response.headers["x-ratelimit-remaining"] || "unknown";

                console.log("API Rate Limits:", {
                    dailyLimit,
                    dailyRemaining,
                    minuteLimit,
                    minuteRemaining,
                });

                // 요청 제한 경고
                if (parseInt(dailyRemaining) < 100 || parseInt(minuteRemaining) < 5) {
                    console.warn(`⚠️ API Rate Limit Warning - ` +
                    `Daily: ${dailyRemaining}/${dailyLimit}, ` +
                    `Minute: ${minuteRemaining}/${minuteLimit}`);
                }

                // 응답에 데이터가 있는지 확인
                const hasData = apiData &&
                        apiData.response &&
                        Array.isArray(apiData.response) &&
                        apiData.response.length > 0;

                // 빈 응답인 경우 메타데이터 추가
                if (!hasData && !apiData.meta) {
                    apiData.meta = {
                        isEmpty: true,
                        message: "No fixtures found for this date"
                    };
                }

                // 캐시에 저장
                try {
                // 빈 응답인 경우 짧은 TTL 적용
                    const ttl = hasData ? null : CACHE_TTL_EMPTY;

                    await cacheRef.set({
                        response: apiData,
                        timestamp: Date.now() / 1000,
                        parameters: params,
                        hasData: hasData,
                        ttl: ttl
                    });
                    console.log(`Cache miss - stored new data for ${cacheKey} - Has data: ${hasData}`);
                } catch (dbError) {
                    console.error("Firestore 저장 오류:", {
                        message: dbError.message,
                        code: dbError.code,
                        details: dbError.details
                    });
                // Firestore 오류가 발생해도 API 응답은 반환
                }

                resolve(apiData);
            } catch (error) {
                console.error("API 오류 상세:", {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    headers: error.response?.headers,
                    config: error.config?.url
                });

                // 오류 발생 시 캐시에 오류 정보 저장 (짧은 TTL로)
                try {
                    const errorResponse = {
                        errors: [error.message || "Unknown error"],
                        response: [],
                        meta: {
                            isError: true,
                            message: error.message || "An error occurred while fetching data"
                        }
                    };

                    const cacheRef2 = db.collection("apiCache").doc(cacheKey);
                    await cacheRef2.set({
                        response: errorResponse,
                        timestamp: Date.now() / 1000,
                        parameters: params,
                        isError: true,
                        hasData: false,
                        ttl: CACHE_TTL_ERROR
                    });
                    console.log(`Cached error response for ${cacheKey} with TTL: ${CACHE_TTL_ERROR}s`);

                    reject(error);
                } catch (dbError) {
                    console.error("Error caching failed:", dbError);
                    reject(error);
                }
            } finally {
                // 완료 후 진행 중인 요청 목록에서 제거
                requestsInProgress.delete(cacheKey);
            }
        })();
    });

    // 진행 중인 요청 목록에 추가
    requestsInProgress.set(cacheKey, requestPromise);

    try {
        const result = await requestPromise;
        return res.json(result);
    } catch (error) {
        if (error.response) {
            // API 서버에서 응답이 왔지만 오류 상태 코드인 경우
            if (error.response.status === 429) {
                // 요청 제한 오류
                return res.status(429).json({
                    errors: ["API rate limit exceeded. Please try again later."],
                    response: [],
                    meta: {
                        isError: true,
                        message: "API rate limit exceeded. Please try again later."
                    }
                });
            }
            res.status(error.response.status).json({
                errors: [`API 서버 오류: ${error.response.status} - ${error.message}`],
                response: [],
                meta: {
                    isError: true,
                    message: `API 서버 오류: ${error.response.status} - ${error.message}`
                }
            });
        } else if (error.request) {
            // 요청은 보냈지만 응답이 없는 경우
            res.status(500).json({
                errors: [`API 서버 응답 없음: ${error.message}`],
                response: [],
                meta: {
                    isError: true,
                    message: `API 서버 응답 없음: ${error.message}`
                }
            });
        } else {
            // 요청 설정 중 오류가 발생한 경우
            res.status(500).json({
                errors: [`요청 설정 오류: ${error.message}`],
                response: [],
                meta: {
                    isError: true,
                    message: `요청 설정 오류: ${error.message}`
                }
            });
        }
    }
}

// 경기 일정 가져오기 엔드포인트
exports.getFixtures = functionsRegion.https.onRequest(async (req, res) => {
    // 쿼리 파라미터 추출
    const {date, league, season} = req.query;
    if (!date || !league || !season) {
        return res.status(400).send(
            "Missing parameters: date, league, and season are required",
        );
    }

    const cacheKey = `fixtures_${date}_${league}_${season}`;
    await fetchWithCache("fixtures", {date, league, season}, cacheKey, res);
});

// 경기 통계 가져오기 엔드포인트
exports.getFixtureStatistics = functionsRegion.https.onRequest(async (req, res) => {
    // 쿼리 파라미터 추출
    const {fixture} = req.query;
    if (!fixture) {
        return res.status(400).send(
            "Missing parameter: fixture is required",
        );
    }

    const cacheKey = `fixture_statistics_${fixture}`;
    await fetchWithCache("fixtures/statistics", {fixture}, cacheKey, res);
});

// 경기 이벤트 가져오기 엔드포인트
exports.getFixtureEvents = functionsRegion.https.onRequest(async (req, res) => {
    // 쿼리 파라미터 추출
    const {fixture} = req.query;
    if (!fixture) {
        return res.status(400).send(
            "Missing parameter: fixture is required",
        );
    }

    const cacheKey = `fixture_events_${fixture}`;
    await fetchWithCache("fixtures/events", {fixture}, cacheKey, res);
});

// 상대 전적 가져오기 엔드포인트
exports.getHeadToHead = functionsRegion.https.onRequest(async (req, res) => {
    // 쿼리 파라미터 추출
    const {h2h} = req.query;
    if (!h2h) {
        return res.status(400).send(
            "Missing parameter: h2h is required",
        );
    }

    const cacheKey = `head_to_head_${h2h}`;
    await fetchWithCache("fixtures/headtohead", {h2h}, cacheKey, res);
});

// 순위 정보 가져오기 엔드포인트
exports.getStandings = functionsRegion.https.onRequest(async (req, res) => {
    // 쿼리 파라미터 추출
    const {league, season} = req.query;
    if (!league || !season) {
        return res.status(400).send(
            "Missing parameters: league and season are required",
        );
    }

    const cacheKey = `standings_${league}_${season}`;
    await fetchWithCache("standings", {league, season}, cacheKey, res);
});

// 부상 정보 가져오기 엔드포인트
exports.getInjuries = functionsRegion.https.onRequest(async (req, res) => {
    // 쿼리 파라미터 추출
    const {fixture, team, season, player, date} = req.query;

    // 최소한 하나의 파라미터가 필요
    if (!fixture && !team && !player && !date) {
        return res.status(400).send(
            "Missing parameters: at least one of fixture, team, player, or date is required",
        );
    }

    // 팀 ID와 시즌이 함께 제공되었는지 확인
    if (team && !season) {
        return res.status(400).send(
            "When using team parameter, season is also required",
        );
    }

    // 캐시 키 생성
    let cacheKey = "injuries";
    if (fixture) cacheKey += `_fixture_${fixture}`;
    if (team) cacheKey += `_team_${team}`;
    if (season) cacheKey += `_season_${season}`;
    if (player) cacheKey += `_player_${player}`;
    if (date) cacheKey += `_date_${date}`;

    // 파라미터 객체 생성
    const params = {};
    if (fixture) params.fixture = fixture;
    if (team) params.team = team;
    if (season) params.season = season;
    if (player) params.player = player;
    if (date) params.date = date;

    await fetchWithCache("injuries", params, cacheKey, res);
});

// 캐시 모니터링 도구
exports.getCacheStats = functionsRegion.https.onRequest(async (req, res) => {
    try {
        const cacheRef = db.collection("apiCache");
        const snapshot = await cacheRef.get();

        const now = Date.now() / 1000;
        const stats = {
            totalItems: snapshot.size,
            byType: {},
            byAge: {
                fresh: 0, // 1시간 미만
                recent: 0, // 1-6시간
                old: 0, // 6-24시간
                stale: 0 // 24시간 이상
            },
            byDataStatus: {
                withData: 0, // 데이터 있음
                empty: 0, // 빈 데이터
                error: 0 // 오류 응답
            },
            totalSize: 0, // 전체 캐시 크기 (바이트)
            oldestTimestamp: now,
            newestTimestamp: 0
        };

        snapshot.forEach((doc) => {
            const data = doc.data();
            const key = doc.id;

            // 타입별 통계
            const type = key.split("_")[0];
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // 나이별 통계
            const age = now - data.timestamp;
            if (age < 3600) stats.byAge.fresh++;
            else if (age < 21600) stats.byAge.recent++;
            else if (age < 86400) stats.byAge.old++;
            else stats.byAge.stale++;

            // 데이터 상태별 통계
            if (data.isError) stats.byDataStatus.error++;
            else if (data.hasData) stats.byDataStatus.withData++;
            else stats.byDataStatus.empty++;

            // 크기 계산 (대략적인 추정)
            const size = JSON.stringify(data).length;
            stats.totalSize += size;

            // 최신/최오래된 타임스탬프 업데이트
            if (data.timestamp < stats.oldestTimestamp) stats.oldestTimestamp = data.timestamp;
            if (data.timestamp > stats.newestTimestamp) stats.newestTimestamp = data.timestamp;
        });

        // 사람이 읽기 쉬운 형태로 변환
        stats.totalSizeHuman = formatBytes(stats.totalSize);
        stats.oldestTimestampHuman = new Date(stats.oldestTimestamp * 1000).toISOString();
        stats.newestTimestampHuman = new Date(stats.newestTimestamp * 1000).toISOString();

        res.json(stats);
    } catch (error) {
        console.error("캐시 통계 조회 오류:", error);
        res.status(500).json({error: error.message});
    }
});

// 캐시 정리 도구
exports.cleanupCache = functionsRegion.https.onRequest(async (req, res) => {
    try {
        const {type, age} = req.query;
        const now = Date.now() / 1000;
        const cacheRef = db.collection("apiCache");
        let query = cacheRef;
        let deletedCount = 0;

        // 타입별 필터링
        if (type) {
            query = query.where(admin.firestore.FieldPath.documentId(), ">=", `${type}_`)
                .where(admin.firestore.FieldPath.documentId(), "<", `${type}_\uf8ff`);
        }

        const snapshot = await query.get();

        // 삭제할 문서 배치 처리
        const batch = db.batch();
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const docAge = now - data.timestamp;

            // 나이별 필터링
            if (age) {
                const ageInSeconds = parseInt(age) * 3600; // 시간 -> 초
                if (docAge < ageInSeconds) continue;
            }

            // 빈 데이터 또는 오류 응답은 더 적극적으로 정리
            if (!age && !data.hasData && docAge > CACHE_TTL_EMPTY) {
                batch.delete(doc.ref);
                batchCount++;
                deletedCount++;
            } else if (!age && data.isError && docAge > CACHE_TTL_ERROR) {
                // 오류 응답 정리
                batch.delete(doc.ref);
                batchCount++;
                deletedCount++;
            } else if (age) {
                // 일반 필터링
                batch.delete(doc.ref);
                batchCount++;
                deletedCount++;
            }

            // 배치가 500개에 도달하면 커밋
            if (batchCount >= 500) {
                await batch.commit();
                console.log(`Committed batch of ${batchCount} deletions`);
                batchCount = 0;
            }
        }

        // 남은 배치 커밋
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Committed final batch of ${batchCount} deletions`);
        }

        res.json({
            success: true,
            deletedCount,
            message: `Successfully cleaned up ${deletedCount} cache entries`
        });
    } catch (error) {
        console.error("캐시 정리 오류:", error);
        res.status(500).json({error: error.message});
    }
});

// 바이트 크기를 사람이 읽기 쉬운 형태로 변환하는 함수
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// 모니터링 함수들 내보내기
const monitoring = require("./monitoring-simple");
exports.healthCheck = monitoring.healthCheck;
exports.collectMetrics = monitoring.collectMetrics;

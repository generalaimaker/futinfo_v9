/**
 * Firebase Functions 모니터링 유틸리티
 * 헬스체크 및 메트릭스 수집 기능을 제공합니다.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * 헬스체크 엔드포인트
 * Functions 및 연결된 서비스의 상태를 확인합니다.
 */
exports.healthCheck = functions.https.onRequest(async (req, res) => {
    const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {},
        environment: {
            node: process.version,
            region: process.env.FUNCTION_REGION || "unknown",
            memory: process.env.FUNCTION_MEMORY_MB || "unknown"
        }
    };

    // Firestore 연결 확인
    try {
        await db.collection("_health").doc("test").get();
        health.services.firestore = {
            status: "healthy",
            message: "Firestore connection successful"
        };
    } catch (error) {
        health.status = "unhealthy";
        health.services.firestore = {
            status: "unhealthy",
            message: error.message
        };
    }

    // 환경 변수 확인
    const requiredEnvVars = ["API_KEY", "API_HOST"];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
        health.status = "unhealthy";
        health.services.environment = {
            status: "unhealthy",
            message: `Missing environment variables: ${missingVars.join(", ")}`
        };
    } else {
        health.services.environment = {
            status: "healthy",
            message: "All required environment variables are set"
        };
    }

    // 메모리 사용량
    const memoryUsage = process.memoryUsage();
    health.memory = {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    };

    // HTTP 상태 코드 설정
    const statusCode = health.status === "healthy" ? 200 : 503;

    res.status(statusCode).json(health);
});

/**
 * 성능 메트릭스 수집
 */
exports.collectMetrics = functions.https.onRequest(async (req, res) => {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            cache: {},
            api: {},
            performance: {}
        };

        // 캐시 통계
        const cacheStats = await getCacheStatistics();
        metrics.cache = cacheStats;

        // API 사용량 통계 (최근 7일)
        const apiUsage = await getApiUsageStats(7);
        metrics.api = apiUsage;

        // 성능 지표
        metrics.performance = {
            averageCacheAge: calculateAverageCacheAge(cacheStats),
            cacheHitRate: calculateCacheHitRate(apiUsage),
            errorRate: calculateErrorRate(apiUsage)
        };

        res.json(metrics);
    } catch (error) {
        console.error("Error collecting metrics:", error);
        res.status(500).json({error: error.message});
    }
});

// 헬퍼 함수들
async function getCacheStatistics() {
    const cacheRef = db.collection("apiCache");
    const snapshot = await cacheRef.get();
    const now = Date.now() / 1000;

    const stats = {
        total: snapshot.size,
        byAge: {
            fresh: 0,
            recent: 0,
            old: 0,
            stale: 0
        },
        byType: {},
        byStatus: {
            withData: 0,
            empty: 0,
            error: 0
        }
    };

    snapshot.forEach((doc) => {
        const data = doc.data();
        const age = now - data.timestamp;

        // 나이별 분류
        if (age < 3600) stats.byAge.fresh++;
        else if (age < 21600) stats.byAge.recent++;
        else if (age < 86400) stats.byAge.old++;
        else stats.byAge.stale++;

        // 타입별 분류
        const type = doc.id.split("_")[0];
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // 상태별 분류
        if (data.isError) stats.byStatus.error++;
        else if (data.hasData) stats.byStatus.withData++;
        else stats.byStatus.empty++;
    });

    return stats;
}

async function getApiUsageStats(days) {
    const stats = {
        totalRequests: 0,
        totalCacheHits: 0,
        totalCacheMisses: 0,
        totalErrors: 0,
        daily: []
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usageRef = db.collection("_apiUsage")
        .where("date", ">=", startDate.toISOString().split("T")[0])
        .orderBy("date", "desc");

    const snapshot = await usageRef.get();

    snapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalRequests += data.requests || 0;
        stats.totalCacheHits += data.cacheHits || 0;
        stats.totalCacheMisses += data.cacheMisses || 0;
        stats.totalErrors += data.errors || 0;

        stats.daily.push({
            date: data.date,
            requests: data.requests || 0,
            cacheHits: data.cacheHits || 0,
            cacheMisses: data.cacheMisses || 0,
            errors: data.errors || 0
        });
    });

    return stats;
}

function calculateAverageCacheAge(cacheStats) {
    const total = cacheStats.total;
    if (total === 0) return 0;

    const weights = {
        fresh: 0.5, // 0.5 시간
        recent: 3.5, // 3.5 시간
        old: 15, // 15 시간
        stale: 36 // 36 시간
    };

    let weightedSum = 0;
    for (const [age, count] of Object.entries(cacheStats.byAge)) {
        weightedSum += weights[age] * count;
    }

    return (weightedSum / total).toFixed(2);
}

function calculateCacheHitRate(apiUsage) {
    const total = apiUsage.totalCacheHits + apiUsage.totalCacheMisses;
    if (total === 0) return 0;

    return ((apiUsage.totalCacheHits / total) * 100).toFixed(2);
}

function calculateErrorRate(apiUsage) {
    if (apiUsage.totalRequests === 0) return 0;

    return ((apiUsage.totalErrors / apiUsage.totalRequests) * 100).toFixed(2);
}

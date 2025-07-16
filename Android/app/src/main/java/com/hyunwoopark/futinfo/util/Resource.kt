package com.hyunwoopark.futinfo.util

/**
 * 네트워크 요청의 상태를 나타내는 sealed class
 * Loading, Success, Error 세 가지 상태를 가집니다.
 */
sealed class Resource<T>(
    val data: T? = null,
    val message: String? = null
) {
    /**
     * 로딩 상태
     */
    class Loading<T>(data: T? = null) : Resource<T>(data)
    
    /**
     * 성공 상태
     * @param data 성공적으로 받아온 데이터
     */
    class Success<T>(data: T) : Resource<T>(data)
    
    /**
     * 에러 상태
     * @param message 에러 메시지
     * @param data 에러 발생 시에도 보여줄 수 있는 캐시된 데이터 (선택사항)
     */
    class Error<T>(message: String, data: T? = null) : Resource<T>(data, message)
}
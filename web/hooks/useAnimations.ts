import { useSpring, animated } from '@react-spring/web'
import { useState, useCallback } from 'react'

// Like 애니메이션 훅
export function useLikeAnimation() {
  const [liked, setLiked] = useState(false)
  
  const { scale, rotate } = useSpring({
    scale: liked ? 1.2 : 1,
    rotate: liked ? 360 : 0,
    config: { tension: 300, friction: 10 }
  })
  
  const handleLike = useCallback(() => {
    setLiked(!liked)
  }, [liked])
  
  return { 
    liked, 
    handleLike, 
    animatedStyle: { scale, rotate } 
  }
}

// 라이브 펄스 애니메이션 훅
export function useLivePulse() {
  const { opacity } = useSpring({
    from: { opacity: 1 },
    to: { opacity: 0.5 },
    loop: { reverse: true },
    config: { duration: 1000 }
  })
  
  return { opacity }
}

// 카드 호버 애니메이션 훅
export function useCardHover() {
  const [hovered, setHovered] = useState(false)
  
  const { transform, boxShadow } = useSpring({
    transform: hovered ? 'translateY(-4px)' : 'translateY(0px)',
    boxShadow: hovered 
      ? '0 10px 30px rgba(0, 0, 0, 0.2)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    config: { tension: 300, friction: 20 }
  })
  
  return {
    hovered,
    setHovered,
    animatedStyle: { transform, boxShadow },
    handlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false)
    }
  }
}

// 스코어 업데이트 애니메이션 훅
export function useScoreAnimation(score: number) {
  const { number } = useSpring({
    number: score,
    from: { number: 0 },
    config: { duration: 1000 }
  })
  
  return { animatedScore: number.to(n => Math.floor(n)) }
}

// 리프레시 회전 애니메이션 훅
export function useRefreshAnimation() {
  const [refreshing, setRefreshing] = useState(false)
  
  const { rotation } = useSpring({
    rotation: refreshing ? 360 : 0,
    config: { duration: 1000 },
    onRest: () => {
      if (refreshing) setRefreshing(false)
    }
  })
  
  const refresh = useCallback(() => {
    setRefreshing(true)
  }, [])
  
  return {
    refreshing,
    refresh,
    animatedStyle: { 
      transform: rotation.to(r => `rotate(${r}deg)`) 
    }
  }
}

// 스켈레톤 쉬머 애니메이션 훅
export function useSkeletonShimmer() {
  const { x } = useSpring({
    from: { x: -100 },
    to: { x: 100 },
    loop: true,
    config: { duration: 1500 }
  })
  
  return {
    shimmerStyle: {
      background: x.to(x => 
        `linear-gradient(90deg, transparent, rgba(255,255,255,0.1) ${x}%, transparent)`
      )
    }
  }
}

// 페이드인 애니메이션 훅
export function useFadeIn(delay = 0) {
  const { opacity, transform } = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    delay,
    config: { tension: 280, friction: 60 }
  })
  
  return { opacity, transform }
}

// 슬라이드인 애니메이션 훅
export function useSlideIn(direction: 'left' | 'right' | 'up' | 'down' = 'left') {
  const getInitialTransform = () => {
    switch (direction) {
      case 'left': return 'translateX(-100%)'
      case 'right': return 'translateX(100%)'
      case 'up': return 'translateY(-100%)'
      case 'down': return 'translateY(100%)'
    }
  }
  
  const { transform } = useSpring({
    from: { transform: getInitialTransform() },
    to: { transform: 'translate(0%, 0%)' },
    config: { tension: 280, friction: 60 }
  })
  
  return { transform }
}

// 프로그레스 바 애니메이션 훅
export function useProgressAnimation(progress: number) {
  const { width } = useSpring({
    width: `${progress}%`,
    from: { width: '0%' },
    config: { tension: 280, friction: 60 }
  })
  
  return { width }
}

// 탭 전환 애니메이션 훅
export function useTabAnimation(activeTab: string) {
  const [prevTab, setPrevTab] = useState(activeTab)
  
  const { opacity, transform } = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    reset: prevTab !== activeTab,
    onRest: () => setPrevTab(activeTab),
    config: { tension: 300, friction: 25 }
  })
  
  return { opacity, transform }
}
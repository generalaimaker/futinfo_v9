'use client'

import Link from 'next/link'
import { Smartphone, Download, Apple, ChevronRight, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function MobileAppSection() {
  return (
    <Card className="relative overflow-hidden border-0 rounded-2xl shadow-2xl">
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent dark:from-indigo-900/10" />
      
      <div className="relative">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-600 blur-xl opacity-40" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white shadow-lg">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              모바일 앱
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            언제 어디서나 축구 정보를 확인하세요
          </p>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 px-4 py-3 bg-black text-white rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
            >
              <Apple className="w-5 h-5" />
              <div className="text-left">
                <p className="text-[10px] opacity-80">Download on the</p>
                <p className="text-sm font-semibold">App Store</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl flex items-center justify-center gap-2 hover:from-blue-600 hover:to-green-600 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left">
                <p className="text-[10px] opacity-80">GET IT ON</p>
                <p className="text-sm font-semibold">Google Play</p>
              </div>
            </motion.button>
          </div>
          
          <div className="mt-4 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-600 dark:text-gray-400">실시간 경기 알림</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Download className="w-3 h-3" />
                <span>10만+ 다운로드</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 장식 요소 */}
        <div className="absolute top-5 right-5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-cyan-500 blur-xl opacity-40 animate-pulse" />
            <Sparkles className="relative w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>
      </div>
    </Card>
  )
}
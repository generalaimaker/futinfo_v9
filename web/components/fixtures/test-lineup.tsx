'use client'

import { useEffect, useState } from 'react'
import { arrangePlayersV3, detectFormation } from './lineup-utils-v3'

// 테스트 데이터
const testFormations = {
  '4-3-3': {
    formation: '4-3-3',
    players: [
      { player: { id: 1, name: 'GK', number: 1, grid: '1:1' }},
      { player: { id: 2, name: 'LB', number: 2, grid: '2:1' }},
      { player: { id: 3, name: 'CB1', number: 3, grid: '2:2' }},
      { player: { id: 4, name: 'CB2', number: 4, grid: '2:3' }},
      { player: { id: 5, name: 'RB', number: 5, grid: '2:4' }},
      { player: { id: 6, name: 'LCM', number: 6, grid: '3:1' }},
      { player: { id: 7, name: 'CM', number: 7, grid: '3:2' }},
      { player: { id: 8, name: 'RCM', number: 8, grid: '3:3' }},
      { player: { id: 9, name: 'LW', number: 9, grid: '4:1' }},  // row 4로 수정 (윙어)
      { player: { id: 10, name: 'ST', number: 10, grid: '5:1' }},  // row 5 (스트라이커)
      { player: { id: 11, name: 'RW', number: 11, grid: '4:3' }}  // row 4로 수정 (윙어)
    ]
  },
  '4-3-3 (포지션명)': {
    formation: '4-3-3',
    players: [
      { player: { id: 1, name: 'Ter Stegen', number: 1, pos: 'G' }},
      { player: { id: 2, name: 'Alba', number: 2, pos: 'LB' }},
      { player: { id: 3, name: 'Pique', number: 3, pos: 'CB' }},
      { player: { id: 4, name: 'Araujo', number: 4, pos: 'CB' }},
      { player: { id: 5, name: 'Dest', number: 5, pos: 'RB' }},
      { player: { id: 6, name: 'Busquets', number: 6, pos: 'DM' }},
      { player: { id: 7, name: 'De Jong', number: 7, pos: 'CM' }},
      { player: { id: 8, name: 'Pedri', number: 8, pos: 'CM' }},
      { player: { id: 9, name: 'Fati', number: 9, pos: 'LW' }},
      { player: { id: 10, name: 'Lewandowski', number: 10, pos: 'ST' }},
      { player: { id: 11, name: 'Raphinha', number: 11, pos: 'RW' }}
    ]
  },
  '4-2-3-1': {
    formation: '4-2-3-1',
    players: [
      { player: { id: 1, name: 'GK', number: 1, grid: '1:1' }},
      { player: { id: 2, name: 'LB', number: 2, grid: '2:1' }},
      { player: { id: 3, name: 'CB1', number: 3, grid: '2:2' }},
      { player: { id: 4, name: 'CB2', number: 4, grid: '2:3' }},
      { player: { id: 5, name: 'RB', number: 5, grid: '2:4' }},
      { player: { id: 6, name: 'LDM', number: 6, grid: '3:1' }},
      { player: { id: 7, name: 'RDM', number: 7, grid: '3:2' }},
      { player: { id: 8, name: 'LAM', number: 8, grid: '4:1' }},
      { player: { id: 9, name: 'CAM', number: 9, grid: '4:2' }},
      { player: { id: 10, name: 'RAM', number: 10, grid: '4:3' }},
      { player: { id: 11, name: 'ST', number: 11, grid: '5:1' }}
    ]
  },
  '3-5-2': {
    formation: '3-5-2',
    players: [
      { player: { id: 1, name: 'GK', number: 1, grid: '1:1' }},
      { player: { id: 2, name: 'LCB', number: 2, grid: '2:1' }},
      { player: { id: 3, name: 'CB', number: 3, grid: '2:2' }},
      { player: { id: 4, name: 'RCB', number: 4, grid: '2:3' }},
      { player: { id: 5, name: 'LWM', number: 5, grid: '3:1' }},
      { player: { id: 6, name: 'LCM', number: 6, grid: '3:2' }},
      { player: { id: 7, name: 'CM', number: 7, grid: '3:3' }},
      { player: { id: 8, name: 'RCM', number: 8, grid: '3:4' }},
      { player: { id: 9, name: 'RWM', number: 9, grid: '3:5' }},
      { player: { id: 10, name: 'LS', number: 10, grid: '5:1' }},
      { player: { id: 11, name: 'RS', number: 11, grid: '5:2' }}
    ]
  }
}

export function TestLineup() {
  const [selectedFormation, setSelectedFormation] = useState('4-3-3')
  const [isHomeTeam, setIsHomeTeam] = useState(true)
  
  const testData = testFormations[selectedFormation as keyof typeof testFormations]
  const arrangedPlayers = arrangePlayersV3(testData.players, testData.formation, isHomeTeam)
  const detectedFormation = detectFormation(testData.players)
  
  return (
    <div className="p-8 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">라인업 테스트 시스템</h2>
        
        <div className="flex gap-4 mb-6">
          <select 
            value={selectedFormation}
            onChange={(e) => setSelectedFormation(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            {Object.keys(testFormations).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          
          <button
            onClick={() => setIsHomeTeam(!isHomeTeam)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isHomeTeam ? '홈팀' : '원정팀'}
          </button>
        </div>
        
        <div className="mb-4">
          <p>원본 포메이션: <strong>{testData.formation}</strong></p>
          <p>감지된 포메이션: <strong className={detectedFormation === testData.formation ? 'text-green-600' : 'text-red-600'}>
            {detectedFormation}
          </strong></p>
          <p className="text-sm text-gray-600 mt-2">
            {testData.players.some(p => p.player.grid) ? 'Grid 기반 배치' : '포지션명 기반 배치'}
          </p>
        </div>
        
        {/* 필드 뷰 */}
        <div className="bg-gradient-to-b from-green-600 to-green-500 rounded-lg p-4 aspect-[3/4] relative max-w-md mx-auto">
          {/* 축구장 라인 */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133">
            <rect x="5" y="5" width="90" height="123" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
            <line x1="5" y1="66.5" x2="95" y2="66.5" stroke="white" strokeWidth="0.5" opacity="0.5"/>
            <circle cx="50" cy="66.5" r="9" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
            <rect x="20" y="5" width="60" height="16" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
            <rect x="20" y="112" width="60" height="16" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5"/>
          </svg>
          
          {/* 선수 배치 */}
          <div className="absolute inset-0 p-4">
            {arrangedPlayers.map((player) => (
              <div
                key={player.player.id}
                className="absolute flex flex-col items-center group"
                style={{
                  left: `${player.fieldPosition.x}%`,
                  top: `${player.fieldPosition.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-gray-300">
                  <span className="text-xs font-bold text-gray-900">
                    {player.player.number}
                  </span>
                </div>
                <p className="text-white text-[10px] mt-1 text-center font-medium whitespace-nowrap drop-shadow-lg">
                  {player.player.name}
                </p>
                <div className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  x:{player.fieldPosition.x.toFixed(0)}, y:{player.fieldPosition.y.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 위치 데이터 테이블 */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">위치 데이터</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">선수</th>
                <th className="text-left py-2">Grid</th>
                <th className="text-left py-2">X</th>
                <th className="text-left py-2">Y</th>
              </tr>
            </thead>
            <tbody>
              {arrangedPlayers.map(player => (
                <tr key={player.player.id} className="border-b">
                  <td className="py-2">{player.player.name}</td>
                  <td className="py-2">{player.player.grid || '-'}</td>
                  <td className="py-2">{player.fieldPosition.x.toFixed(0)}</td>
                  <td className="py-2">{player.fieldPosition.y.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
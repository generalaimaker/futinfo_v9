// Team transfers using free-api-live-football-data
// Provides accurate transfer fees and market values

import { getFreeApiId } from '@/lib/data/team-id-mapping';
import { 
  getTeamPlayersInTransfers, 
  getTeamPlayersOutTransfers,
  getTransfersByTeamId 
} from './client';

export interface EnhancedTransfer {
  id: string;
  playerName: string;
  playerId: number;
  position?: string;
  transferDate: string;
  transferType: 'transfer' | 'loan' | 'free';
  fee?: {
    amount?: number;
    text: string;
    currency?: string;
  };
  marketValue?: number;
  fromClub: {
    id: number;
    name: string;
    logo?: string;
  };
  toClub: {
    id: number;
    name: string;
    logo?: string;
  };
  direction: 'in' | 'out';
  onLoan: boolean;
  loanDates?: {
    from: string;
    to: string;
  };
}

// Format transfer fee from API response
function formatTransferFee(fee: any): EnhancedTransfer['fee'] {
  if (!fee) return { text: '비공개' };
  
  if (fee.value) {
    // Convert to millions with currency symbol
    const million = fee.value / 1000000;
    const formatted = million >= 1 
      ? `€${million.toFixed(1)}M` 
      : `€${(fee.value / 1000).toFixed(0)}K`;
    
    return {
      amount: fee.value,
      text: formatted,
      currency: 'EUR'
    };
  }
  
  // Handle text-based fees
  const feeTextMap: Record<string, string> = {
    'free transfer': '자유이적',
    'on loan': '임대',
    'loan': '임대',
    'end of loan': '임대 복귀',
    'fee': '이적료',
    'undisclosed': '비공개'
  };
  
  const text = feeTextMap[fee.localizedFeeText] || 
                feeTextMap[fee.feeText] || 
                fee.feeText || 
                '비공개';
  
  return { text };
}

// Convert API response to enhanced transfer format
function mapToEnhancedTransfer(
  transfer: any, 
  teamId: number,
  direction: 'in' | 'out'
): EnhancedTransfer {
  return {
    id: `${transfer.playerId}-${transfer.transferDate}`,
    playerName: transfer.name || '선수명 미상',
    playerId: transfer.playerId,
    position: transfer.position?.label || transfer.position?.key,
    transferDate: transfer.transferDate,
    transferType: transfer.onLoan ? 'loan' : 
                  transfer.fee?.feeText === 'free transfer' ? 'free' : 
                  'transfer',
    fee: formatTransferFee(transfer.fee),
    marketValue: transfer.marketValue,
    fromClub: {
      id: transfer.fromClubId,
      name: transfer.fromClub || '미상',
      logo: transfer.fromClubLogoUrl
    },
    toClub: {
      id: transfer.toClubId,
      name: transfer.toClub || '미상',
      logo: transfer.toClubLogoUrl
    },
    direction,
    onLoan: transfer.onLoan || false,
    loanDates: transfer.onLoan && transfer.fromDate && transfer.toDate ? {
      from: transfer.fromDate,
      to: transfer.toDate
    } : undefined
  };
}

// Main function to get team transfers with fallback
export async function getEnhancedTeamTransfers(apiFootballId: number) {
  // Try to get free-api ID from mapping
  const freeApiId = getFreeApiId(apiFootballId);
  
  if (freeApiId) {
    // Use enhanced API with accurate fees
    console.log(`[Team Transfers] Using free-api for team ${apiFootballId} -> ${freeApiId}`);
    
    try {
      // Fetch both in and out transfers
      const [inTransfers, outTransfers] = await Promise.all([
        getTeamPlayersInTransfers(freeApiId.toString()),
        getTeamPlayersOutTransfers(freeApiId.toString())
      ]);
      
      // Map to enhanced format
      const transfersIn = (inTransfers.transfers || [])
        .map((t: any) => mapToEnhancedTransfer(t, freeApiId, 'in'));
      
      const transfersOut = (outTransfers.transfers || [])
        .map((t: any) => mapToEnhancedTransfer(t, freeApiId, 'out'));
      
      // Filter by date (July 2024 onwards)
      const cutoffDate = new Date('2024-07-01');
      
      const filterRecent = (transfers: EnhancedTransfer[]) => 
        transfers.filter(t => new Date(t.transferDate) >= cutoffDate)
                 .sort((a, b) => new Date(b.transferDate).getTime() - 
                                new Date(a.transferDate).getTime());
      
      return {
        in: filterRecent(transfersIn),
        out: filterRecent(transfersOut),
        loans: {
          in: filterRecent(transfersIn.filter(t => t.onLoan)),
          out: filterRecent(transfersOut.filter(t => t.onLoan))
        },
        stats: {
          totalIn: transfersIn.length,
          totalOut: transfersOut.length,
          loansIn: transfersIn.filter(t => t.onLoan).length,
          loansOut: transfersOut.filter(t => t.onLoan).length,
          totalSpent: transfersIn.reduce((sum, t) => sum + (t.fee?.amount || 0), 0),
          totalEarned: transfersOut.reduce((sum, t) => sum + (t.fee?.amount || 0), 0)
        },
        source: 'free-api' as const
      };
      
    } catch (error) {
      console.error('[Team Transfers] Free-api error, falling back:', error);
      // Fall through to use old API
    }
  }
  
  // Fallback to old API if mapping not found or error
  console.log(`[Team Transfers] Using fallback api-football for team ${apiFootballId}`);
  
  const oldTransfers = await getTransfersByTeamId(apiFootballId);
  
  // Convert old format to enhanced format (with limited data)
  const transfers = (oldTransfers.transfers || []).map((transferData: any) => {
    const latestTransfer = transferData.transfers?.[0];
    const isIn = latestTransfer?.teams?.in?.id === apiFootballId;
    
    return {
      id: `${transferData.player?.id}-${latestTransfer?.date}`,
      playerName: transferData.player?.name || '선수명 미상',
      playerId: transferData.player?.id,
      position: undefined,
      transferDate: latestTransfer?.date,
      transferType: latestTransfer?.type?.toLowerCase().includes('loan') ? 'loan' : 'transfer',
      fee: { text: latestTransfer?.type || '비공개' },
      marketValue: undefined,
      fromClub: {
        id: latestTransfer?.teams?.out?.id,
        name: latestTransfer?.teams?.out?.name || '미상',
        logo: latestTransfer?.teams?.out?.logo
      },
      toClub: {
        id: latestTransfer?.teams?.in?.id,
        name: latestTransfer?.teams?.in?.name || '미상',
        logo: latestTransfer?.teams?.in?.logo
      },
      direction: isIn ? 'in' : 'out',
      onLoan: latestTransfer?.type?.toLowerCase().includes('loan') || false,
      loanDates: undefined
    } as EnhancedTransfer;
  });
  
  // Filter and organize
  const cutoffDate = new Date('2024-07-01');
  const recentTransfers = transfers
    .filter(t => new Date(t.transferDate) >= cutoffDate)
    .sort((a, b) => new Date(b.transferDate).getTime() - 
                   new Date(a.transferDate).getTime());
  
  const transfersIn = recentTransfers.filter(t => t.direction === 'in');
  const transfersOut = recentTransfers.filter(t => t.direction === 'out');
  
  return {
    in: transfersIn,
    out: transfersOut,
    loans: {
      in: transfersIn.filter(t => t.onLoan),
      out: transfersOut.filter(t => t.onLoan)
    },
    stats: {
      totalIn: transfersIn.length,
      totalOut: transfersOut.length,
      loansIn: transfersIn.filter(t => t.onLoan).length,
      loansOut: transfersOut.filter(t => t.onLoan).length,
      totalSpent: 0, // Not available in old API
      totalEarned: 0 // Not available in old API
    },
    source: 'api-football' as const
  };
}

// Hook for React components
export function useEnhancedTeamTransfers(teamId: number, enabled = true) {
  const { useQuery } = require('@tanstack/react-query');
  
  return useQuery({
    queryKey: ['team-transfers-enhanced', teamId],
    queryFn: () => getEnhancedTeamTransfers(teamId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
// 개발용 Mock 데이터
import { FixturesResponse } from '@/lib/types/football'

export const mockFixturesData: FixturesResponse = {
  get: "fixtures",
  parameters: { date: "2025-01-16" },
  errors: [],
  results: 10,
  paging: { current: 1, total: 1 },
  response: [
    {
      fixture: {
        id: 1,
        date: "2025-01-16T20:00:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 1,
          name: "Anfield",
          city: "Liverpool"
        },
        timezone: "UTC",
        referee: "Michael Oliver"
      },
      league: {
        id: 39,
        name: "Premier League",
        country: "England",
        logo: "https://media.api-sports.io/football/leagues/39.png",
        flag: "https://media.api-sports.io/flags/gb.svg",
        season: 2024,
        round: "Regular Season - 21",
        standings: true
      },
      teams: {
        home: {
          id: 40,
          name: "Liverpool",
          logo: "https://media.api-sports.io/football/teams/40.png",
          winner: null
        },
        away: {
          id: 33,
          name: "Manchester United",
          logo: "https://media.api-sports.io/football/teams/33.png",
          winner: null
        }
      },
      goals: {
        home: null,
        away: null
      }
    },
    {
      fixture: {
        id: 2,
        date: "2025-01-16T19:00:00+00:00",
        status: {
          long: "Match Finished",
          short: "FT",
          elapsed: 90
        },
        venue: {
          id: 2,
          name: "Seoul World Cup Stadium",
          city: "Seoul"
        },
        timezone: "Asia/Seoul",
        referee: "Kim Min-woo"
      },
      league: {
        id: 292,
        name: "K League 1",
        country: "South Korea",
        logo: "https://media.api-sports.io/football/leagues/292.png",
        flag: "https://media.api-sports.io/flags/kr.svg",
        season: 2025,
        round: "Regular Season - 1",
        standings: true
      },
      teams: {
        home: {
          id: 2748,
          name: "FC Seoul",
          logo: "https://media.api-sports.io/football/teams/2748.png",
          winner: true
        },
        away: {
          id: 2749,
          name: "Jeonbuk Motors",
          logo: "https://media.api-sports.io/football/teams/2749.png",
          winner: false
        }
      },
      goals: {
        home: 2,
        away: 1
      }
    },
    {
      fixture: {
        id: 3,
        date: "2025-01-16T01:00:00+00:00",
        status: {
          long: "First Half",
          short: "1H",
          elapsed: 35
        },
        venue: {
          id: 3,
          name: "Mercedes-Benz Stadium",
          city: "Atlanta"
        },
        timezone: "America/New_York",
        referee: "John Smith"
      },
      league: {
        id: 253,
        name: "MLS",
        country: "USA",
        logo: "https://media.api-sports.io/football/leagues/253.png",
        flag: "https://media.api-sports.io/flags/us.svg",
        season: 2025,
        round: "Regular Season - 1",
        standings: true
      },
      teams: {
        home: {
          id: 1607,
          name: "Atlanta United",
          logo: "https://media.api-sports.io/football/teams/1607.png",
          winner: null
        },
        away: {
          id: 1599,
          name: "Inter Miami",
          logo: "https://media.api-sports.io/football/teams/1599.png",
          winner: null
        }
      },
      goals: {
        home: 1,
        away: 1
      }
    }
  ]
}
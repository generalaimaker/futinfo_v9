// 더 많은 Mock 데이터
import { FixturesResponse } from '@/lib/types/football'

export const largeMockFixturesData: FixturesResponse = {
  get: "fixtures",
  parameters: { date: "2025-01-16" },
  errors: [],
  results: 15,
  paging: { current: 1, total: 1 },
  response: [
    // Premier League
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
      goals: { home: null, away: null }
    },
    {
      fixture: {
        id: 2,
        date: "2025-01-16T15:00:00+00:00",
        status: {
          long: "Match Finished",
          short: "FT",
          elapsed: 90
        },
        venue: {
          id: 2,
          name: "Etihad Stadium",
          city: "Manchester"
        },
        timezone: "UTC",
        referee: "Anthony Taylor"
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
          id: 50,
          name: "Manchester City",
          logo: "https://media.api-sports.io/football/teams/50.png",
          winner: true
        },
        away: {
          id: 49,
          name: "Chelsea",
          logo: "https://media.api-sports.io/football/teams/49.png",
          winner: false
        }
      },
      goals: { home: 3, away: 1 }
    },
    {
      fixture: {
        id: 3,
        date: "2025-01-16T17:30:00+00:00",
        status: {
          long: "First Half",
          short: "1H",
          elapsed: 35
        },
        venue: {
          id: 3,
          name: "Emirates Stadium",
          city: "London"
        },
        timezone: "UTC",
        referee: "Martin Atkinson"
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
          id: 42,
          name: "Arsenal",
          logo: "https://media.api-sports.io/football/teams/42.png",
          winner: null
        },
        away: {
          id: 47,
          name: "Tottenham",
          logo: "https://media.api-sports.io/football/teams/47.png",
          winner: null
        }
      },
      goals: { home: 1, away: 0 }
    },
    // La Liga
    {
      fixture: {
        id: 4,
        date: "2025-01-16T21:00:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 4,
          name: "Santiago Bernabéu",
          city: "Madrid"
        },
        timezone: "UTC",
        referee: "Mateu Lahoz"
      },
      league: {
        id: 140,
        name: "La Liga",
        country: "Spain",
        logo: "https://media.api-sports.io/football/leagues/140.png",
        flag: "https://media.api-sports.io/flags/es.svg",
        season: 2024,
        round: "Regular Season - 20",
        standings: true
      },
      teams: {
        home: {
          id: 541,
          name: "Real Madrid",
          logo: "https://media.api-sports.io/football/teams/541.png",
          winner: null
        },
        away: {
          id: 529,
          name: "Barcelona",
          logo: "https://media.api-sports.io/football/teams/529.png",
          winner: null
        }
      },
      goals: { home: null, away: null }
    },
    {
      fixture: {
        id: 5,
        date: "2025-01-16T19:00:00+00:00",
        status: {
          long: "Second Half",
          short: "2H",
          elapsed: 67
        },
        venue: {
          id: 5,
          name: "Wanda Metropolitano",
          city: "Madrid"
        },
        timezone: "UTC",
        referee: "Gil Manzano"
      },
      league: {
        id: 140,
        name: "La Liga",
        country: "Spain",
        logo: "https://media.api-sports.io/football/leagues/140.png",
        flag: "https://media.api-sports.io/flags/es.svg",
        season: 2024,
        round: "Regular Season - 20",
        standings: true
      },
      teams: {
        home: {
          id: 530,
          name: "Atletico Madrid",
          logo: "https://media.api-sports.io/football/teams/530.png",
          winner: null
        },
        away: {
          id: 543,
          name: "Real Betis",
          logo: "https://media.api-sports.io/football/teams/543.png",
          winner: null
        }
      },
      goals: { home: 2, away: 1 }
    },
    // Serie A
    {
      fixture: {
        id: 6,
        date: "2025-01-16T19:45:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 6,
          name: "San Siro",
          city: "Milan"
        },
        timezone: "UTC",
        referee: "Daniele Orsato"
      },
      league: {
        id: 135,
        name: "Serie A",
        country: "Italy",
        logo: "https://media.api-sports.io/football/leagues/135.png",
        flag: "https://media.api-sports.io/flags/it.svg",
        season: 2024,
        round: "Regular Season - 20",
        standings: true
      },
      teams: {
        home: {
          id: 489,
          name: "AC Milan",
          logo: "https://media.api-sports.io/football/teams/489.png",
          winner: null
        },
        away: {
          id: 492,
          name: "Napoli",
          logo: "https://media.api-sports.io/football/teams/492.png",
          winner: null
        }
      },
      goals: { home: null, away: null }
    },
    {
      fixture: {
        id: 7,
        date: "2025-01-16T17:30:00+00:00",
        status: {
          long: "Match Finished",
          short: "FT",
          elapsed: 90
        },
        venue: {
          id: 7,
          name: "Allianz Stadium",
          city: "Turin"
        },
        timezone: "UTC",
        referee: "Maurizio Mariani"
      },
      league: {
        id: 135,
        name: "Serie A",
        country: "Italy",
        logo: "https://media.api-sports.io/football/leagues/135.png",
        flag: "https://media.api-sports.io/flags/it.svg",
        season: 2024,
        round: "Regular Season - 20",
        standings: true
      },
      teams: {
        home: {
          id: 496,
          name: "Juventus",
          logo: "https://media.api-sports.io/football/teams/496.png",
          winner: true
        },
        away: {
          id: 505,
          name: "Inter",
          logo: "https://media.api-sports.io/football/teams/505.png",
          winner: false
        }
      },
      goals: { home: 2, away: 0 }
    },
    // Bundesliga
    {
      fixture: {
        id: 8,
        date: "2025-01-16T19:30:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 8,
          name: "Allianz Arena",
          city: "Munich"
        },
        timezone: "UTC",
        referee: "Felix Zwayer"
      },
      league: {
        id: 78,
        name: "Bundesliga",
        country: "Germany",
        logo: "https://media.api-sports.io/football/leagues/78.png",
        flag: "https://media.api-sports.io/flags/de.svg",
        season: 2024,
        round: "Regular Season - 18",
        standings: true
      },
      teams: {
        home: {
          id: 157,
          name: "Bayern Munich",
          logo: "https://media.api-sports.io/football/teams/157.png",
          winner: null
        },
        away: {
          id: 165,
          name: "Borussia Dortmund",
          logo: "https://media.api-sports.io/football/teams/165.png",
          winner: null
        }
      },
      goals: { home: null, away: null }
    },
    {
      fixture: {
        id: 9,
        date: "2025-01-16T17:30:00+00:00",
        status: {
          long: "Halftime",
          short: "HT",
          elapsed: 45
        },
        venue: {
          id: 9,
          name: "Red Bull Arena",
          city: "Leipzig"
        },
        timezone: "UTC",
        referee: "Tobias Stieler"
      },
      league: {
        id: 78,
        name: "Bundesliga",
        country: "Germany",
        logo: "https://media.api-sports.io/football/leagues/78.png",
        flag: "https://media.api-sports.io/flags/de.svg",
        season: 2024,
        round: "Regular Season - 18",
        standings: true
      },
      teams: {
        home: {
          id: 173,
          name: "RB Leipzig",
          logo: "https://media.api-sports.io/football/teams/173.png",
          winner: null
        },
        away: {
          id: 172,
          name: "VfB Stuttgart",
          logo: "https://media.api-sports.io/football/teams/172.png",
          winner: null
        }
      },
      goals: { home: 1, away: 1 }
    },
    // K League
    {
      fixture: {
        id: 10,
        date: "2025-01-16T11:00:00+00:00",
        status: {
          long: "Match Finished",
          short: "FT",
          elapsed: 90
        },
        venue: {
          id: 10,
          name: "Seoul World Cup Stadium",
          city: "Seoul"
        },
        timezone: "UTC",
        referee: "Kim Dae-yong"
      },
      league: {
        id: 292,
        name: "K League 1",
        country: "South Korea",
        logo: "https://media.api-sports.io/football/leagues/292.png",
        flag: "https://media.api-sports.io/flags/kr.svg",
        season: 2024,
        round: "Regular Season - 15",
        standings: true
      },
      teams: {
        home: {
          id: 2748,
          name: "FC Seoul",
          logo: "https://media.api-sports.io/football/teams/2748.png",
          winner: false
        },
        away: {
          id: 2750,
          name: "Jeonbuk Motors",
          logo: "https://media.api-sports.io/football/teams/2750.png",
          winner: true
        }
      },
      goals: { home: 1, away: 2 }
    },
    {
      fixture: {
        id: 11,
        date: "2025-01-16T12:00:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 11,
          name: "Ulsan Munsu Football Stadium",
          city: "Ulsan"
        },
        timezone: "UTC",
        referee: "Lee Dong-jun"
      },
      league: {
        id: 292,
        name: "K League 1",
        country: "South Korea",
        logo: "https://media.api-sports.io/football/leagues/292.png",
        flag: "https://media.api-sports.io/flags/kr.svg",
        season: 2024,
        round: "Regular Season - 15",
        standings: true
      },
      teams: {
        home: {
          id: 2749,
          name: "Ulsan Hyundai",
          logo: "https://media.api-sports.io/football/teams/2749.png",
          winner: null
        },
        away: {
          id: 2747,
          name: "Suwon Bluewings",
          logo: "https://media.api-sports.io/football/teams/2747.png",
          winner: null
        }
      },
      goals: { home: null, away: null }
    },
    // MLS
    {
      fixture: {
        id: 12,
        date: "2025-01-16T02:00:00+00:00",
        status: {
          long: "Match Finished",
          short: "FT",
          elapsed: 90
        },
        venue: {
          id: 12,
          name: "Mercedes-Benz Stadium",
          city: "Atlanta"
        },
        timezone: "UTC",
        referee: "Mark Geiger"
      },
      league: {
        id: 253,
        name: "MLS",
        country: "USA",
        logo: "https://media.api-sports.io/football/leagues/253.png",
        flag: "https://media.api-sports.io/flags/us.svg",
        season: 2024,
        round: "Regular Season - 10",
        standings: true
      },
      teams: {
        home: {
          id: 1607,
          name: "Atlanta United",
          logo: "https://media.api-sports.io/football/teams/1607.png",
          winner: true
        },
        away: {
          id: 1598,
          name: "LA Galaxy",
          logo: "https://media.api-sports.io/football/teams/1598.png",
          winner: false
        }
      },
      goals: { home: 3, away: 2 }
    },
    {
      fixture: {
        id: 13,
        date: "2025-01-16T03:30:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 13,
          name: "BMO Field",
          city: "Toronto"
        },
        timezone: "UTC",
        referee: "Jair Marrufo"
      },
      league: {
        id: 253,
        name: "MLS",
        country: "USA",
        logo: "https://media.api-sports.io/football/leagues/253.png",
        flag: "https://media.api-sports.io/flags/us.svg",
        season: 2024,
        round: "Regular Season - 10",
        standings: true
      },
      teams: {
        home: {
          id: 1601,
          name: "Toronto FC",
          logo: "https://media.api-sports.io/football/teams/1601.png",
          winner: null
        },
        away: {
          id: 1599,
          name: "New York City FC",
          logo: "https://media.api-sports.io/football/teams/1599.png",
          winner: null
        }
      },
      goals: { home: null, away: null }
    },
    // Champions League
    {
      fixture: {
        id: 14,
        date: "2025-01-16T20:00:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 14,
          name: "Parc des Princes",
          city: "Paris"
        },
        timezone: "UTC",
        referee: "Björn Kuipers"
      },
      league: {
        id: 2,
        name: "UEFA Champions League",
        country: "World",
        logo: "https://media.api-sports.io/football/leagues/2.png",
        flag: null,
        season: 2024,
        round: "Round of 16",
        standings: false
      },
      teams: {
        home: {
          id: 85,
          name: "Paris Saint Germain",
          logo: "https://media.api-sports.io/football/teams/85.png",
          winner: null
        },
        away: {
          id: 157,
          name: "Bayern Munich",
          logo: "https://media.api-sports.io/football/teams/157.png",
          winner: null
        }
      },
      goals: { home: null, away: null }
    },
    {
      fixture: {
        id: 15,
        date: "2025-01-16T20:00:00+00:00",
        status: {
          long: "Not Started",
          short: "NS",
          elapsed: null
        },
        venue: {
          id: 15,
          name: "Stamford Bridge",
          city: "London"
        },
        timezone: "UTC",
        referee: "Antonio Mateu Lahoz"
      },
      league: {
        id: 2,
        name: "UEFA Champions League",
        country: "World",
        logo: "https://media.api-sports.io/football/leagues/2.png",
        flag: null,
        season: 2024,
        round: "Round of 16",
        standings: false
      },
      teams: {
        home: {
          id: 49,
          name: "Chelsea",
          logo: "https://media.api-sports.io/football/teams/49.png",
          winner: null
        },
        away: {
          id: 529,
          name: "Barcelona",
          logo: "https://media.api-sports.io/football/teams/529.png",
          winner: null
        }
      },
      goals: { home: null, away: null }
    }
  ]
}
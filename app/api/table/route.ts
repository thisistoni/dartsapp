import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthlyTable, PlayerRanking } from '@/lib/models/tableTypes';

interface Challenge {
    challenger: string;
    defender: string;
    date: Date;
    isRematch: boolean;
    completed: boolean;
    result?: { winner: string };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  if (!month) {
    return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    let table = await MonthlyTable.findOne({ month });
    
    // If no table exists for this month, create one with default rankings
    if (!table) {
      const defaultPlayers = [
        'Muki', 'Markus', 'Schucki', 'Chris', 'Marko',
        'Dominik', 'Michi', 'Chavez', 'Josip', 'Ermin'
      ].map((name, index) => ({
        name,
        position: index + 1,
        wins: 0,
        losses: 0,
        challengesLeft: 2,
        challengedBy: []
      }));

      table = await MonthlyTable.create({
        month,
        players: defaultPlayers,
        challenges: []
      });
    }

    return NextResponse.json({ data: table });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { challenger, defender, month, action, winner } = await request.json();
    await connectToDatabase();

    const table = await MonthlyTable.findOne({ month });
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    if (action === 'challenge') {
      // Validate challenge
      const challengerPlayer = table.players.find((p: PlayerRanking) => p.name === challenger);
      const defenderPlayer = table.players.find((p: PlayerRanking) => p.name === defender);

      if (!challengerPlayer || !defenderPlayer) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      // Check if positions are valid for challenge (can only challenge players above)
      if (challengerPlayer.position <= defenderPlayer.position) {
        return NextResponse.json({ 
          error: 'Can only challenge players above in ranking' 
        }, { status: 400 });
      }

      // Check remaining challenges
      if (challengerPlayer.challengesLeft <= 0) {
        return NextResponse.json({ 
          error: 'No challenges left this month' 
        }, { status: 400 });
      }

      // Find all challenges between these players
      const challenges = table.challenges.filter((c: Challenge) => 
        c.challenger === challenger && 
        c.defender === defender
      );

      // Check if it's a rematch
      const originalChallenge = challenges.find((c: Challenge) => !c.isRematch && c.completed);
      const rematchExists = challenges.some((c: Challenge) => c.isRematch);

      // Only allow one rematch after original challenge is completed
      if (rematchExists) {
        return NextResponse.json({ 
          error: 'Rematch already exists for this challenge' 
        }, { status: 400 });
      }

      const isRematch = !!originalChallenge;

      // Deduct challenge if it's not a rematch
      challengerPlayer.challengesLeft--;

      // Create new challenge
      table.challenges.push({
        challenger,
        defender,
        date: new Date(),
        isRematch,
        completed: false
      });

    } else if (action === 'complete') {
      const challenge = table.challenges.find((c: Challenge) => 
        c.challenger === challenger && 
        c.defender === defender && 
        !c.completed
      );

      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }

      // Update challenge result
      challenge.completed = true;
      challenge.result = { winner };

      // Update rankings if challenger won (for both original and rematch challenges)
      if (winner === challenger) {
        const challengerPos = table.players.find((p: PlayerRanking) => p.name === challenger)!.position;
        const defenderPos = table.players.find((p: PlayerRanking) => p.name === defender)!.position;

        // Update all players' positions
        table.players = table.players.map((player: PlayerRanking) => {
          if (player.name === challenger) {
            player.position = defenderPos;
            player.wins++;
          } else if (player.name === defender) {
            player.position = challengerPos;
            player.losses++;
          } else if (
            player.position > Math.min(challengerPos, defenderPos) && 
            player.position < Math.max(challengerPos, defenderPos)
          ) {
            // For rematch, we need to handle position changes in both directions
            if (challengerPos > defenderPos) {
              player.position++;  // Moving up
            } else {
              player.position--;  // Moving down
            }
          }
          return player;
        });

        // Sort players by position
        table.players.sort((a: PlayerRanking, b: PlayerRanking) => a.position - b.position);

        // Add automatic back challenge only for original challenges
        if (!challenge.isRematch) {
          table.challenges.push({
            challenger: defender,
            defender: challenger,
            date: new Date(),
            isRematch: true,
            completed: false
          });
        }
      } else {
        // Update W/L without position changes
        table.players = table.players.map((player: PlayerRanking) => {
          if (player.name === challenger) {
            player.losses++;
          } else if (player.name === defender) {
            player.wins++;
          }
          return player;
        });
      }
    } else if (action === 'cancel') {
      // Find the challenge
      const challengeIndex = table.challenges.findIndex((c: Challenge) => 
        c.challenger === challenger && 
        c.defender === defender && 
        !c.completed
      );

      if (challengeIndex === -1) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }

      const challenge = table.challenges[challengeIndex];

      // If it's not a rematch, restore the challenger's challenge count
      if (!challenge.isRematch) {
        const challengerPlayer = table.players.find((p: PlayerRanking) => p.name === challenger);
        if (challengerPlayer) {
          challengerPlayer.challengesLeft++;
        }
      }

      // Remove the challenge
      table.challenges.splice(challengeIndex, 1);
      await table.save();
      
      return NextResponse.json({ data: table });
    }

    await table.save();
    return NextResponse.json({ data: table });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update the PUT endpoint for month transition
export async function PUT(request: Request) {
    try {
        const { fromMonth, toMonth } = await request.json();
        await connectToDatabase();

        const oldTable = await MonthlyTable.findOne({ month: fromMonth });
        if (!oldTable) {
            return NextResponse.json({ error: 'Previous month table not found' }, { status: 404 });
        }

        // Create new month table with carried over data
        const newTable = await MonthlyTable.create({
            month: toMonth,
            players: oldTable.players.map((player: PlayerRanking) => ({
                name: player.name,
                position: player.position,
                wins: player.wins,
                losses: player.losses,
                challengesLeft: 2,
                challengedBy: [],
                average: player.average
            })),
            challenges: []  // Start with no challenges
        });

        return NextResponse.json({ data: newTable });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 
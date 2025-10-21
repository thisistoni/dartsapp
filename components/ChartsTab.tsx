import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { TooltipProps } from 'recharts';

interface DotProps {
    cx?: number;
    cy?: number;
    payload?: {
        value: number;
        matchday: number | string;
        opponent: string;
    };
}

interface Player {
    playerName: string;
    adjustedAverage: number;
}

interface TeamData {
    players: Player[];
}

interface MatchReport {
    lineup: string[];
    score: string;
    details: {
        singles: Array<{
            homePlayer: string;
            awayPlayer: string;
            homeScore: number;
            awayScore: number;
        }>;
    };
}

interface RunningAverage {
    matchday: string | number;
    average: number;
    runningAverage: number;
    opponent: string;
}

interface MatchDataItem {
    matchday: string | number;
    opponent: string;
    numericMatchday?: number;
}

interface ChartsTabProps {
    selectedPlayer: string;
    setSelectedPlayer: (value: string) => void;
    teamData: TeamData | null;
    runningAverages: RunningAverage[];
    matchData: MatchDataItem[];
    matchReports: MatchReport[];
}

export default function ChartsTab({
    selectedPlayer,
    setSelectedPlayer,
    teamData,
    runningAverages,
    matchData,
    matchReports
}: ChartsTabProps) {
    
    // Calculate the domain dynamically based on the actual data
    const getChartDomain = () => {
        if (runningAverages.length === 0) return [30, 50];  // fallback if no data
        
        const allValues = runningAverages.flatMap(d => [d.average, d.runningAverage].filter(v => v !== undefined));
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        
        // Add 5-10% padding and round to nearest 5
        const padding = (maxValue - minValue) * 0.1;
        const min = Math.floor((minValue - padding) / 5) * 5;
        const max = Math.ceil((maxValue + padding) / 5) * 5;
        
        return [min, max];
    };

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    {/* Opponent Name */}
                    <div className="mb-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                            {matchData.find(m => m.matchday === label)?.opponent}
                        </span>
                    </div>
                    {/* Values */}
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded ${
                                entry.name === 'runningAverage' 
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}>
                                {Number(entry.value).toFixed(2)}
                            </span>
                            <span className="text-gray-600">
                                {entry.name === 'runningAverage' ? 'Running Average' : 'Match Average'}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderDot = (props: DotProps) => {
        const { cx, cy, payload } = props;
        if (!cx || !cy || !payload) return (
            <svg width={0} height={0}></svg>
        );

        // Find the match report for this matchday
        // Handle both numeric matchday and string matchday with season prefix (e.g., "1-5", "2-3")
        let matchReport;
        const matchday = payload.matchday as number | string;
        if (typeof matchday === 'string' && matchday.includes('-')) {
            // For "all seasons" mode with prefix like "1-5"
            const matchDataEntry = matchData.find(m => m.matchday === matchday);
            if (matchDataEntry && matchDataEntry.numericMatchday) {
                matchReport = matchReports[matchDataEntry.numericMatchday - 1];
            }
        } else {
            // For single season mode
            const numericMatchday = typeof matchday === 'number' ? matchday : parseInt(matchday);
            matchReport = matchReports[numericMatchday - 1];
        }
        
        if (!matchReport) return (
            <svg width={0} height={0}></svg>
        );

        // For team average, check the match score
        if (selectedPlayer === "team") {
            const [homeScore, awayScore] = matchReport.score.split('-').map(Number);
            let color;
            if (homeScore > awayScore) {
                color = "#22c55e";  // green for win
            } else if (homeScore < awayScore) {
                color = "#ef4444";  // red for loss
            } else {
                color = "#f59e0b";  // amber for draw
            }

            return (
                <svg key={`dot-${cx}-${cy}`} x={cx - 6} y={cy - 6} width={12} height={12} fill="none">
                    <path
                        d="M1 1L11 11M1 11L11 1"
                        stroke={color}
                        strokeWidth={2}
                    />
                </svg>
            );
        }

        // For player average, find their result in the lineup
        const playerIndex = matchReport.lineup.indexOf(selectedPlayer);
        if (playerIndex === -1) return (
            <svg width={0} height={0}></svg>
        );

        // Check if player won their matches
        const playerWon = matchReport.details.singles.some(match => 
            (match.homePlayer === selectedPlayer && match.homeScore > match.awayScore) ||
            (match.awayPlayer === selectedPlayer && match.awayScore > match.homeScore)
        );

        const color = playerWon ? "#22c55e" : "#ef4444";  // green for win, red for loss

        return (
            <svg key={`dot-${cx}-${cy}`} x={cx - 6} y={cy - 6} width={12} height={12} fill="none">
                <path
                    d="M1 1L11 11M1 11L11 1"
                    stroke={color}
                    strokeWidth={2}
                />
            </svg>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Average Development</h2>
                <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="team">Team Average</option>
                    {teamData?.players
                        .filter((player) => {
                            // Check if player appears in at least one match lineup
                            return matchReports.some(report => report.lineup.includes(player.playerName));
                        })
                        .map((player) => (
                            <option key={player.playerName} value={player.playerName}>
                                {player.playerName}
                            </option>
                        ))
                    }
                </select>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-400/40 to-blue-500/40" />
                <div className="p-5">
                    {/* Add Legend */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-[#22c55e]"></div>
                            <span>Running Average</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-4 h-4 text-[#22c55e]">✕</div>
                                <div className="w-4 h-4 text-[#f59e0b]">✕</div>
                                <div className="w-4 h-4 text-[#ef4444]">✕</div>
                            </div>
                            <span>Match Average (Win/Draw/Loss)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-[#3b82f6] border-t-2 border-dashed"></div>
                            <span>Current Average</span>
                        </div>
                    </div>

                    <div className="h-[300px] sm:h-[400px] -ml-2 sm:ml-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={runningAverages} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="matchday" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    dx={-10}
                                    domain={getChartDomain()}
                                    ticks={Array.from(
                                        { length: (getChartDomain()[1] - getChartDomain()[0]) / 5 + 1 },
                                        (_, i) => getChartDomain()[0] + i * 5
                                    )}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                {/* Add key props to Line components */}
                                <Line
                                    key="match-average"
                                    type="monotone"
                                    dataKey="average"
                                    stroke="none"
                                    dot={renderDot}
                                    isAnimationActive={false}
                                />
                                <Line
                                    key="running-average"
                                    type="monotone"
                                    dataKey="runningAverage"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "#22c55e" }}
                                />
                                {/* Move reference lines outside of render condition */}
                                <ReferenceLine 
                                    key="last-average"
                                    y={runningAverages[runningAverages.length - 1]?.runningAverage}
                                    stroke="#3b82f6"
                                    strokeDasharray="3 3"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

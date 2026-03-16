import { useTimer } from '../hooks/useTimer';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Timer({ item }) {
  const timer = useTimer(item.timerType, {
    sets: item.sets,
    holdSeconds: item.holdSeconds,
    restSeconds: item.restSeconds,
    timerSeconds: item.timerSeconds,
  });

  const isIdle = timer.phase === 'idle';
  const isComplete = timer.phase === 'complete';

  // Calculate progress for circular ring
  let progress = 0;
  if (item.timerType === 'interval') {
    const totalPhaseTime = timer.phase === 'hold' ? item.holdSeconds : item.restSeconds;
    if (totalPhaseTime > 0) progress = 1 - (timer.secondsRemaining / totalPhaseTime);
  } else if (item.timerType === 'countdown') {
    if (item.timerSeconds > 0) progress = 1 - (timer.secondsRemaining / item.timerSeconds);
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const phaseColor = timer.phase === 'hold' ? 'text-green-400' : timer.phase === 'rest' ? 'text-yellow-400' : 'text-blue-400';
  const ringColor = timer.phase === 'hold' ? 'stroke-green-400' : timer.phase === 'rest' ? 'stroke-yellow-400' : 'stroke-blue-400';

  return (
    <div className="flex flex-col items-center py-4 gap-3">
      {/* Set indicator */}
      {item.timerType === 'interval' && !isIdle && (
        <div className="text-sm text-gray-400">
          Set {timer.currentSet} of {timer.totalSets}
        </div>
      )}

      {/* Phase label */}
      {item.timerType === 'interval' && !isIdle && !isComplete && (
        <div className={`text-lg font-bold tracking-widest ${phaseColor}`}>
          {timer.phase === 'hold' ? 'HOLD' : 'REST'}
        </div>
      )}

      {/* Timer display with ring */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {!isIdle && !isComplete && item.timerType !== 'stopwatch' && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#374151" strokeWidth="6" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              className={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        )}
        <span className={`text-5xl font-mono font-bold ${isComplete ? 'text-green-400' : phaseColor}`}>
          {isComplete ? (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : item.timerType === 'stopwatch' ? (
            formatTime(timer.elapsedSeconds)
          ) : (
            formatTime(timer.secondsRemaining)
          )}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full max-w-xs">
        {isIdle || isComplete ? (
          <button
            onClick={timer.start}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg active:bg-blue-700 min-h-[48px]"
          >
            {isComplete ? 'Restart' : 'Start'}
          </button>
        ) : (
          <>
            <button
              onClick={timer.isRunning ? timer.pause : timer.resume}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg active:bg-blue-700 min-h-[48px]"
            >
              {timer.isRunning ? 'Pause' : 'Resume'}
            </button>
            {item.timerType === 'interval' && (
              <button
                onClick={timer.skipToNextSet}
                className="px-4 py-3 rounded-xl bg-gray-700 text-gray-300 font-medium active:bg-gray-600 min-h-[48px]"
              >
                Skip
              </button>
            )}
          </>
        )}
        {!isIdle && (
          <button
            onClick={timer.reset}
            className="px-4 py-3 rounded-xl bg-gray-700 text-gray-300 font-medium active:bg-gray-600 min-h-[48px]"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';
import { useEffect, useRef, useState } from 'react';
import { formatAmount } from '@/domain/inputSteps';
import type { EventStats } from '@/domain/leaderboard';
import { useSession } from '@/state/store';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

/**
 * The event's rank distribution. Asks again whenever `refreshKey` changes, keeping the previous
 * figures on screen until the new ones arrive; they are dropped only when the event changes.
 */
function useStats(guid: string, playerId: string, refreshKey: string): EventStats | null {
  const [loaded, setLoaded] = useState<{ guid: string; stats: EventStats } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`api/leaderboard/${encodeURIComponent(guid)}/stats?player=${encodeURIComponent(playerId)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.ok) {
          setLoaded({ guid, stats: (await response.json()) as EventStats });
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [guid, playerId, refreshKey]);

  return loaded?.guid === guid ? loaded.stats : null;
}

/** Bumps when the page's colours change, so the chart can be drawn again with the new ones. */
function useThemeTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setTick((value) => value + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => observer.disconnect();
  }, []);
  return tick;
}

function Bars({ distribution, ranks, themeTick }: { distribution: number[]; ranks: number; themeTick: number }) {
  const { title } = useSession();
  const { powers } = title;
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) {
      return;
    }
    const style = getComputedStyle(document.documentElement);
    const color = (name: string) => style.getPropertyValue(name).trim();
    // The page's body font, so the chart's labels match the text around it.
    const font = { family: getComputedStyle(document.body).fontFamily };
    const axisTitle = (text: string) => ({ display: true, text, color: color('--muted'), font: { ...font, weight: 600 } });
    const count = Math.max(ranks, distribution.length);
    const data = Array.from({ length: count }, (_, index) => distribution[index] ?? 0);
    const chart = new Chart(element, {
      type: 'bar',
      data: {
        labels: data.map((_, index) => String(index + 1)),
        datasets: [{ data, backgroundColor: color('--accent'), hoverBackgroundColor: color('--accent'), borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: false }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Hovering anywhere in a rank's column shows its count, as on the old leaderboard site.
        interaction: { mode: 'index', intersect: false },
        font,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: color('--surface'),
            titleColor: color('--ink'),
            bodyColor: color('--ink'),
            borderColor: color('--line'),
            borderWidth: 1,
            displayColors: false,
            titleFont: font,
            bodyFont: font,
            callbacks: {
              title: () => '',
              label: (item) => `Rank ${item.label}: ${formatAmount(item.parsed.y ?? 0, powers)} players`
            }
          }
        },
        scales: {
          x: {
            title: axisTitle('Rank'),
            grid: { display: false },
            border: { color: color('--line') },
            ticks: { color: color('--muted'), maxRotation: 0, font }
          },
          y: {
            title: axisTitle('Player Count'),
            beginAtZero: true,
            grid: { color: color('--line') },
            border: { display: false },
            ticks: { color: color('--muted'), font, callback: (value) => formatAmount(Number(value), powers) }
          }
        }
      }
    });
    return () => chart.destroy();
  }, [distribution, ranks, themeTick, powers]);

  return (
    <div className="relative h-64 sm:h-80">
      <canvas ref={canvas} role="img" aria-label="Number of players at each rank" />
    </div>
  );
}

/** How many players reached each rank in the event, with the cumulative trophies of everyone on the board. */
export function RankDistribution({ guid, playerId, refreshKey }: { guid: string; playerId: string; refreshKey: string }) {
  const { balance, title } = useSession();
  const stats = useStats(guid, playerId, refreshKey);
  const themeTick = useThemeTick();
  if (!stats) {
    return null;
  }

  return (
    <section aria-labelledby="rank-heading" className="space-y-2">
      <h2 id="rank-heading" className="text-base font-semibold">
        Rank Distribution
      </h2>
      <p className="text-sm text-muted">Cumulative trophies: {formatAmount(stats.trophySum, title.powers)}</p>
      <div className="rounded-xl border border-line bg-surface p-3">
        <Bars distribution={stats.rankDistribution} ranks={balance.Ranks?.length ?? 0} themeTick={themeTick} />
      </div>
    </section>
  );
}

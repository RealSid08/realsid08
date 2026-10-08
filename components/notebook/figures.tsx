import React from 'react';
import {
  AFTER_OUTCOME,
  COOP_COLUMNS,
  COOP_RATES,
  FOODLY_FLOW,
  FOODLY_SCREENS,
  OUTCOMES,
  REPLAY,
  SERVOGRID_BOARD,
  SWITCHYARD_LOG,
} from './data';

// Figures animate in when their page turns into view: the engine adds `is-in` to every `[data-reveal]`.

/** Marks a screenshot that opens in the viewer (see Lightbox.tsx). */
export const zoomable = (group: string, full: string, caption: string, detail = '') => ({
  'data-zoom': '',
  'data-group': group,
  'data-full': full,
  'data-caption': caption,
  'data-detail': detail,
  tabIndex: 0,
  role: 'button',
  draggable: false,
});

const pct = (value: number | null) => (value == null ? '·' : String(Math.round(value * 100)));

/** Cooperation rate per agent and opponent. Missing data stays empty, never zero. */
export const CoopHeatmap: React.FC = () => (
  <div className="hm-wrap" data-reveal>
    <table className="hm">
      <thead>
        <tr>
          <th />
          {COOP_COLUMNS.map((column) => <th key={column} scope="col">{column}</th>)}
        </tr>
      </thead>
      <tbody>
        {COOP_RATES.map(([agent, model, rates, games]) => (
          <tr key={model} className={games === 1 ? 'hm-partial' : undefined}>
            <th scope="row"><b>{agent}</b> <i>{model}</i></th>
            {rates.map((rate, index) =>
              rate == null ? (
                <td key={index} className="hm-cell hm-na" title={`${agent} ${model}, ${COOP_COLUMNS[index]}: no data yet`}>·</td>
              ) : (
                <td
                  key={index}
                  className={`hm-cell${rate >= 0.6 ? ' hm-dark' : ''}`}
                  style={{ '--v': rate } as React.CSSProperties}
                  title={`${agent} ${model}, ${COOP_COLUMNS[index]}: cooperated ${pct(rate)}% of rounds`}
                >
                  <span>{pct(rate)}</span>
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
    <p className="hm-key"><span className="hm-swatch" /> share of rounds the agent cooperated · faded rows have 1 game per cell</p>
  </div>
);

/** What each agent did after each outcome of the previous round. */
export const AfterOutcome: React.FC = () => (
  <div className="m1" data-reveal>
    {AFTER_OUTCOME.map(({ agent, tag, rates, note }) => (
      <figure key={agent} className="m1-card">
        <figcaption><b>{agent}</b><span className="m1-tag">{tag}</span></figcaption>
        <div className="m1-bars">
          {rates.map((rate, index) => (
            <div key={OUTCOMES[index][2]} className="m1-col" title={`After ${OUTCOMES[index][2]}: cooperated ${pct(rate)}% of the time`}>
              <div className="m1-track"><div className="m1-bar" style={{ '--p': rate } as React.CSSProperties} /></div>
              <code>{OUTCOMES[index][0]}<br />{OUTCOMES[index][1]}</code>
            </div>
          ))}
        </div>
        <p>{note}</p>
      </figure>
    ))}
  </div>
);

export const Replay: React.FC = () => (
  <figure className="rp" data-reveal>
    {REPLAY.rows.map((row) => (
      <div key={row.who} className="rp-row">
        <span className="rp-who">{row.who}</span>
        {[...row.moves].map((move, index) => {
          const flipped = row.flips[index] === 'x';
          return (
            <span
              key={index}
              className={`rp-t rp-${move}${flipped ? ' rp-flip' : ''}`}
              style={{ '--i': index } as React.CSSProperties}
              title={`Round ${index + 1}: ${move === 'A' ? 'cooperated' : 'betrayed'}${flipped ? ' (flipped at random)' : ''}`}
            >
              {move}
            </span>
          );
        })}
      </div>
    ))}
    <figcaption><span className="rp-key" aria-hidden="true" /> {REPLAY.note}</figcaption>
  </figure>
);

/** Clients on the left, one gateway, accounts on the right. Packets ride the tracks. */
export const SwitchyardDiagram: React.FC = () => {
  const clients = ['Codex CLI', 'Claude Code', 'OpenCode', 'Cursor'];
  const accounts: Array<[string, 'ready' | 'limited' | 'off']> = [
    ['Codex · 621840', 'limited'],
    ['Codex · 7d38c1', 'ready'],
    ['Claude', 'ready'],
    ['Gemini', 'ready'],
    ['Ollama', 'off'],
  ];
  const gx = 380, gy = 150;
  const cy = (i: number) => 50 + i * 66;
  const ay = (i: number) => 30 + i * 60;
  const inPaths = clients.map((_, i) => `M150,${cy(i)} C260,${cy(i)} 270,${gy} ${gx - 70},${gy}`);
  const outPaths = accounts.map((_, i) => `M${gx + 70},${gy} C${gx + 170},${gy} ${gx + 150},${ay(i)} 590,${ay(i)}`);
  return (
    <svg className="sy" viewBox="0 0 760 300" role="img" aria-label="Four coding clients send requests into Switchyard, which routes them across five accounts and skips the rate-limited and disabled ones">
      <g className="sy-tracks">
        {inPaths.map((d) => <path key={d} d={d} />)}
        {outPaths.map((d, i) => <path key={d} d={d} className={accounts[i][1] !== 'ready' ? 'sy-dead' : undefined} />)}
      </g>
      <g className="sy-packets">
        {inPaths.map((d, i) => (
          <circle key={d} r="3.2"><animateMotion dur={`${2.4 + i * 0.35}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" path={d} /></circle>
        ))}
        {[1, 2, 3].map((k, j) => (
          <circle key={k} r="3.2"><animateMotion dur={`${2.2 + j * 0.4}s`} begin={`${0.8 + j * 0.6}s`} repeatCount="indefinite" path={outPaths[k]} /></circle>
        ))}
      </g>
      {clients.map((client, i) => (
        <g key={client} className="sy-node" transform={`translate(20,${cy(i) - 15})`}>
          <rect width="130" height="30" rx="6" />
          <text x="12" y="19">{client}</text>
        </g>
      ))}
      <g className="sy-hub" transform={`translate(${gx - 70},${gy - 42})`}>
        <rect width="140" height="84" rx="10" />
        <text x="70" y="36" textAnchor="middle" className="sy-hub-t">switchyard</text>
        <text x="70" y="56" textAnchor="middle" className="sy-hub-s">:7410/v1</text>
      </g>
      {accounts.map(([name, state], i) => (
        <g key={name} className={`sy-node sy-${state}`} transform={`translate(590,${ay(i) - 15})`}>
          <rect width="150" height="30" rx="6" />
          <circle cx="14" cy="15" r="3.5" className="sy-dot" />
          <text x="26" y="19">{name}</text>
        </g>
      ))}
    </svg>
  );
};

export const SwitchyardTerminal: React.FC = () => (
  <div className="term" aria-label="An example Switchyard log: one account is rate limited and the request fails over to another">
    <div className="bar"><i /><i /><i /></div>
    {SWITCHYARD_LOG.map((line, index) => (
      <div key={index} className="l" style={{ animationDelay: `${index * 0.45}s` }}>
        {line.length === 0 ? ' ' : line.map(([cls, text], j) => (cls ? <span key={j} className={cls}>{text}</span> : <React.Fragment key={j}>{text}</React.Fragment>))}
      </div>
    ))}
    <div className="l" style={{ animationDelay: `${SWITCHYARD_LOG.length * 0.45}s` }}>
      <span className="p">▍</span><span className="cur" />
    </div>
  </div>
);

/** A roadside price sign where every price wears its trust state. */
export const ServoBoard: React.FC = () => (
  <div className="sv" role="img" aria-label="A fuel price sign where each price is labelled live, scheduled, delayed, cached or unavailable">
    <div className="sv-head"><span>ServoGrid</span><span className="sv-demo">illustrative</span></div>
    {SERVOGRID_BOARD.map(([grade, price, state, why]) => (
      <div key={grade} className={`sv-row sv-${state}`}>
        <span className="sv-g">{grade}</span>
        <span className="sv-p">{price}</span>
        <span className="sv-s"><b>{state}</b><i>{why}</i></span>
      </div>
    ))}
  </div>
);

export const ParkSpeed: React.FC = () => (
  <div className="pk" data-reveal role="img" aria-label="The first catalogue load fell from 23.3 seconds to 0.53 seconds">
    <div className="pk-row"><span>before</span><div className="pk-bar" style={{ '--w': '100%' } as React.CSSProperties} /><b>23.3s</b></div>
    <div className="pk-row"><span>after</span><div className="pk-bar pk-after" style={{ '--w': '2.3%' } as React.CSSProperties} /><b>0.53s</b></div>
  </div>
);

export const FoodlyFlow: React.FC = () => (
  <ol className="ff" data-reveal>
    {FOODLY_FLOW.map(([step, detail], index) => (
      <li key={step} style={{ '--i': index } as React.CSSProperties}><b>{step}</b><span>{detail}</span></li>
    ))}
  </ol>
);

export const FoodlyScreens: React.FC = () => (
  <div className="nb-four">
    {FOODLY_SCREENS.map((screen) => (
      <figure key={screen.src} className="ff-phone">
        <div className={`phone${screen.os === 'Android' ? ' android' : ''}`}>
          <img
            src={screen.src}
            alt={`Foodly ${screen.label}, ${screen.os}`}
            loading="lazy"
            decoding="async"
            {...zoomable('foodly', screen.full, `Foodly · ${screen.label}`, screen.os)}
          />
        </div>
        <figcaption><span className="os">{screen.os}</span>{screen.label}</figcaption>
      </figure>
    ))}
  </div>
);

/** Freshness on a ServoGrid price: four clocks, only two of which count. */
export const FreshnessTrack: React.FC = () => (
  <div className="tl" data-reveal>
    <div className="track">
      <div className="fresh" />
      <div className="ev up" style={{ left: '7%' }}><b>Price set</b><span>17:40</span><i /></div>
      <div className="ev" style={{ left: '31%' }}><i /><b>Published</b><span>17:50</span></div>
      <div className="ev up" style={{ left: '62%' }}><b>We saw it</b><span>18:02</span><i /></div>
      <div className="ev net" style={{ left: '90%' }}><i /><b>Last checked</b><span>just now</span></div>
    </div>
  </div>
);

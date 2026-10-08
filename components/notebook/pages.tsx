import React from 'react';
import { PROFILE } from '../../constants';
import { CONTENTS } from './contents';
import {
  zoomable,
  AfterOutcome,
  CoopHeatmap,
  FoodlyFlow,
  FoodlyScreens,
  FreshnessTrack,
  ParkSpeed,
  Replay,
  ServoBoard,
  SwitchyardDiagram,
  SwitchyardTerminal,
} from './figures';
import { DocIcon, GitHubIcon, LinkedInIcon, MailIcon, RepoLink } from './icons';
import { SWITCHYARD_FACTS } from './data';

/**
 * Every page of the notebook, in reading order. Even pages are right-hand pages
 * (the front of a leaf), odd pages are left-hand pages (the back of one).
 * `target` lists the ids the assistant can turn to; `[data-mark]` is what it circles.
 */
export type Page = {
  name: string;
  className?: string;
  /** colour of the section, used by chips, tabs and figures */
  color?: string;
  /** a tab on the page's edge that jumps to its spread; only on right-hand pages */
  tab?: string;
  target?: string;
  content: React.ReactNode;
};

const Run: React.FC<{ left: React.ReactNode; right?: React.ReactNode }> = ({ left, right }) => (
  <div className="run"><span>{left}</span><span>{right}</span></div>
);

const Sticky: React.FC<{ style: React.CSSProperties; wide?: boolean; className?: string; children: React.ReactNode }> = ({ style, wide, className, children }) => (
  <div className={['sticky', wide && 'wide', className].filter(Boolean).join(' ')} style={style}>{children}</div>
);

/** Handwritten "problem / so" notes in the margin. */
const Notes: React.FC<{ rows: Array<[string, React.ReactNode]> }> = ({ rows }) => (
  <div className="qa">
    {rows.map(([label, text]) => (
      <React.Fragment key={label}><span>{label}</span><p>{text}</p></React.Fragment>
    ))}
  </div>
);

const SHELF = [
  { id: 'codex-shared-memory', kind: 'MCP server', title: 'Codex Shared Memory', line: 'Self-hosted MCP server that shares agent memory snapshots across machines over SSH, with an offline cache.', url: 'https://github.com/RealSid08/codex-shared-memory' },
  { id: 't3-wall', kind: 'Ambient dashboard', title: 't3-wall', line: 'Read-only portrait kiosk for T3 Code: running agents, subscription limits and usage across machines.', url: 'https://github.com/RealSid08/t3-wall' },
  { id: 'hs-heist', kind: 'WebMCP game', title: 'HS: Heist', line: 'A first-person heist where a WebMCP agent plays your partner through ten tools and remembers its failures.', url: 'https://github.com/RealSid08/openai-webmcp-challenge' },
  { id: 'cursor-subagents', kind: 'Codex plugin', title: 'Cursor Subagents', line: 'One skill that lets Codex hand a bounded task to Cursor CLI, then review and verify the diff.', url: 'https://github.com/RealSid08/cursor-subagents' },
  { id: 'pptx-react-renderer', kind: 'npm package', title: 'pptx-react-renderer', line: 'Renders PowerPoint files as HTML in the browser, with pixel-diff regression tests.', url: 'https://github.com/OpenRenderKit/pptx-react-renderer' },
  { id: 'tbrgs', kind: 'ML coursework', title: 'Traffic route guidance', line: 'LSTM and GRU forecasts from SCATS sensor data feeding an A* route search.', url: 'https://github.com/RealSid08/IntroToAISquad/tree/2B' },
];

export const PAGES: Page[] = [
  {
    name: 'Cover',
    className: 'cover',
    content: (
      <>
        <div className="stitch" />
        <div className="label">
          <h1>Sidhaarth Krishnan</h1>
          <p>Portfolio notebook<br />Software engineer · Melbourne</p>
        </div>
        <div className="band" />
        <div className="hint">open me →</div>
      </>
    ),
  },
  {
    name: 'Hello',
    className: 'about',
    target: 'top',
    content: (
      <>
        <Run left="Sidhaarth Krishnan" right="Melbourne" />
        <p className="hw" style={{ margin: '14px 0 0' }}>hi! this is what I’ve been building ↓</p>
        <figure className="me">
          <span className="tape" />
          <img
            src="/work/notebook/me-working.jpg"
            alt="Sidhaarth working at his laptop"
            decoding="async"
            {...zoomable('me', '/work/notebook/full/me-working.jpg', 'me, mid-build')}
          />
          <figcaption>me, mid-build</figcaption>
        </figure>
        <h1 data-mark>I build software people use every day, and the <em>tools</em> I build it with.</h1>
        <p className="lede">
          When I run into a real-world problem, or a company brings me one, I build the software that solves it. For
          companies, that’s a task platform for about 600 staff at Besmak, and a platform at Kenspire that turns goals
          and procedures into scheduled work. For me, it’s Foodly, ParkAlong and ServoGrid: food I meant to try, parking
          in the city, fuel prices I couldn’t trust. I love this work, and I care most that what I build gets used.
        </p>
        <p className="lab">How I work</p>
        <p className="body" style={{ margin: '0 0 12px', fontSize: 12.5 }}>
          I own the whole job: understanding the problem, designing the system, and shipping something people rely on.
          Coding agents let me move faster, so I use them heavily, and I hold their work to the same standard as mine:
          tested, run for real, and read line by line before it ships.
        </p>
        <div data-target="education">
          <p className="lab">Studying</p>
          <p className="body" style={{ margin: 0 }} data-mark>Bachelor of Engineering (Honours), Software<br />Swinburne University of Technology</p>
        </div>
      </>
    ),
  },
  {
    name: 'Contents',
    className: 'toc',
    color: 'var(--nb-accent)',
    target: 'contents',
    content: (
      <>
        <Run left="Contents" />
        <h2 data-mark>Contents</h2>
        <nav aria-label="Contents">
          {CONTENTS.map((row, index) => (
            <a key={row.title} href={`#p${row.spread * 2 - 1}`} data-go={row.spread} data-row={row.targets.join(' ')}>
              <span className="n">0{index + 1}</span>
              <b>{row.title}</b>
              <span className="dots" />
              <span className="p">{row.spread * 2 - 1}</span>
              <small>{row.line}</small>
            </a>
          ))}
        </nav>
      </>
    ),
  },
  {
    name: 'Kenspire',
    color: '#7a5c3e',
    target: 'work exp-kenspire',
    content: (
      <>
        <Run left={<><b>01</b> · Client work</>} right="Contract · since Apr 2026" />
        <span className="chip">Kenspire Advisors · web and mobile</span>
        <h2 className="t" data-mark>Kenspire</h2>
        <p className="pitch" style={{ maxWidth: '15em' }}>Turns a company’s goals and procedures into scheduled, checked work. Planned rollout to 500 organisations.</p>
        <Notes rows={[
          ['my job', 'I own the architecture and delivery: a TanStack Start web app and an Expo mobile app on one Convex backend.'],
          ['inside', 'Recurring schedules, timesheets, passkey sign-in, iOS Live Activities, and a Gemini agent that edits procedure drafts through tool calls.'],
        ]} />
        <div className="chain"><b>Goal</b><i>→</i><b>Procedure</b><i>→</i><b>Schedule</b><i>→</i><b>Task</b></div>
        <div className="chain sub"><span>maker ✓</span><span>checker ✓</span><span>reviewer ✓</span></div>
        <Sticky wide style={{ right: 34, bottom: 46, width: 262, transform: 'rotate(-2deg)' }}>
          62 aggregates were <b>70%</b> of billed database I/O. Now exact counters, zero drift.
        </Sticky>
      </>
    ),
  },
  {
    name: 'Besmak',
    color: '#7a5c3e',
    tab: 'Work',
    target: 'exp-besmak',
    content: (
      <>
        <Run left="Client work" right={<b>Contract · since Jul 2026</b>} />
        <span className="chip">Besmak Components · web and mobile</span>
        <h2 className="t" data-mark>Besmak</h2>
        <p className="pitch" style={{ maxWidth: '16em' }}>One task platform for about 600 staff, across every department.</p>
        <Notes rows={[
          ['my job', 'I lead development, web and mobile, with end-to-end tests for both apps.'],
          ['hard part', 'Recurring tasks with subtasks run as a resumable background job: checkpoints, retries that never duplicate, and dates that survive daylight saving. Tested at 600 subtasks for 600 users.'],
        ]} />
        <div className="infra" role="img" aria-label="Web and mobile apps talk to Convex on EC2, backed by Multi-AZ PostgreSQL and encrypted S3">
          <div className="col"><b>Web</b><b>Mobile</b></div><i>→</i>
          <div className="col"><b className="hub">Convex<small>self-hosted on EC2</small></b></div><i>→</i>
          <div className="col"><b>Postgres<small>Multi-AZ</small></b><b>S3<small>encrypted</small></b></div>
        </div>
        <p className="hw" style={{ margin: '8px 0 0', fontSize: 19 }}>all of it in OpenTofu, on AWS</p>
        <Sticky style={{ right: 34, bottom: 60, width: 124, transform: 'rotate(-3deg)' }}>database failover, tested<b>40s</b></Sticky>
      </>
    ),
  },
  {
    name: 'Foodly',
    color: '#3f8f4f',
    target: 'projects project-foodly',
    content: (
      <>
        <Run left={<><b>02</b> · Foodly</>} right="iOS · Android · web" />
        <span className="chip">Honours project · iOS, Android, web</span>
        <h2 className="t" data-mark>Foodly</h2>
        <p className="pitch">Every food reel you saved, finally on a map.</p>
        <div className="flow-wrap"><FoodlyFlow /></div>
        <p className="body foodly-body">I wrote the backend and rebuilt the iOS and Android app around a map-first Explore tab, reels that play inside the app, and photo-led place pages.</p>
        <div className="tags" style={{ maxWidth: 250 }}>
          {['React Native', 'Convex', 'Gemini', 'Google Places', 'Apify'].map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <a className="go" href="https://foodly-app-mauve.vercel.app" target="_blank" rel="noopener noreferrer">Open the web app ↗</a>
        <Sticky style={{ right: 34, bottom: 62, width: 140, transform: 'rotate(3deg)' }}>map query, uncached<b>9s → 1.1s</b>per-place totals in one row</Sticky>
      </>
    ),
  },
  {
    name: 'Foodly',
    color: '#3f8f4f',
    tab: 'Foodly',
    content: (
      <>
        <Run left="Screens" right={<b>Foodly</b>} />
        <FoodlyScreens />
      </>
    ),
  },
  {
    name: 'Switchyard',
    color: '#c98a12',
    target: 'project-switchyard',
    content: (
      <>
        <Run left={<><b>03</b> · Switchyard</>} right="Rust · open source" />
        <span className="chip">Open source · Rust gateway</span>
        <h2 className="t" data-mark>Switchyard</h2>
        <p className="pitch">Every coding agent, every account, one local endpoint.</p>
        <Notes rows={[
          ['the problem', 'Use Codex, Claude Code and OpenCode and you juggle their accounts too. Each tool is wired to one provider, a rate limit ends your session, and nothing shows usage across all of them.'],
          ['so', 'A gateway on your own machine. Every client points at it. It speaks each provider’s own API, so nothing is lost in translation, and when an account hits its limit the next request goes to another one.'],
        ]} />
        <div className="facts">
          {SWITCHYARD_FACTS.map(([label, value]) => <div key={label}><small>{label}</small>{value}</div>)}
        </div>
        <RepoLink href="https://github.com/RealSid08/switchyard">Source and releases</RepoLink>
        <p className="hw margin-note" style={{ right: 40, bottom: 54, transform: 'rotate(-4deg)', textAlign: 'right', fontSize: 19 }}>started from a T3 Code dev’s<br />public wishlist ✓</p>
      </>
    ),
  },
  {
    name: 'Switchyard',
    color: '#c98a12',
    tab: 'Switchyard',
    content: (
      <>
        <Run left="How it routes" right={<b>Switchyard</b>} />
        <div className="fig" style={{ marginTop: 14 }}>
          <SwitchyardDiagram />
          <p className="cap">Fig. 1, clients in, accounts out. Limited and disabled lines go dashed.</p>
        </div>
        <SwitchyardTerminal />
        <p className="hw margin-note" style={{ left: 46, right: 40, bottom: 48, transform: 'rotate(-2deg)' }}>↑ one account hits a 429, the next turn just lands on another. Prompts are never stored.</p>
      </>
    ),
  },
  {
    name: 'ParkAlong',
    color: '#d2491f',
    target: 'project-parkalong',
    content: (
      <>
        <Run left={<><b>04</b> · ParkAlong</>} right="Swift · iOS" />
        <span className="chip">Native iOS · SwiftUI + MapKit</span>
        <h2 className="t" data-mark>ParkAlong</h2>
        <p className="pitch">Is there parking, how long can I stay, and what will it cost? One map for Victoria.</p>
        <Notes rows={[
          ['the problem', 'Finding parking in Melbourne is hard because the answer is scattered. Council sensors know which bays are free but not the rules. The sign has the time limit, but only once you’re there. Prices sit in payment apps and car park websites. So you circle the block.'],
          ['so', 'One map that answers all three, with live City of Melbourne bay sensors and 38,610 public records across Victoria. Say how long you’re staying and it shows only spots that allow it. It never invents a price or a forecast it can’t back up.'],
        ]} />
        <p className="lab" style={{ marginTop: 16 }}>First load of the statewide catalogue</p>
        <ParkSpeed />
        <p className="cap4" style={{ maxWidth: '19em' }}>The decoder built new date formatters for all 34,000 records. Reusing one parser fixed it.</p>
        <RepoLink href="https://github.com/OpenRenderKit/ParkAlong">Source</RepoLink>
        <Sticky className="wide-only" style={{ right: 32, bottom: 20, width: 108, transform: 'rotate(-3deg)' }}>first load<b>43×</b>faster</Sticky>
      </>
    ),
  },
  {
    name: 'ParkAlong',
    color: '#d2491f',
    tab: 'ParkAlong',
    className: 'pkR',
    content: (
      <>
        <Run left="Screens" right={<b>ParkAlong</b>} />
        <div className="pair">
          <figure>
            <span className="tape" />
            <div className="phone"><img src="/work/notebook/parkalong-map-light.jpg" alt="ParkAlong map of live parking, light mode" loading="lazy" decoding="async" {...zoomable('parkalong', '/work/notebook/full/parkalong-map-light.jpg', 'ParkAlong · live bays, by day', 'iOS')} /></div>
            <figcaption>live bays, by day</figcaption>
          </figure>
          <figure>
            <span className="tape" style={{ '--tape': 'rgba(210,73,31,0.55)' } as React.CSSProperties} />
            <div className="phone"><img src="/work/notebook/parkalong-zone-dark.jpg" alt="ParkAlong zone detail with the time limit and price, dark mode" loading="lazy" decoding="async" {...zoomable('parkalong', '/work/notebook/full/parkalong-zone-dark.jpg', 'ParkAlong · zone rules, by night', 'iOS')} /></div>
            <figcaption>zone rules, by night</figcaption>
          </figure>
        </div>
        <p className="hw margin-note" style={{ left: 46, bottom: 52, transform: 'rotate(-2deg)', fontSize: 19 }}>230+ Swift tests and 72 data-pipeline tests in CI</p>
      </>
    ),
  },
  {
    name: 'ServoGrid',
    color: '#2a9bb5',
    target: 'project-servogrid',
    content: (
      <>
        <Run left={<><b>05</b> · ServoGrid</>} right="Swift · iOS" />
        <span className="chip">Native iOS · Australian fuel prices</span>
        <h2 className="t" data-mark>ServoGrid</h2>
        <p className="pitch">A fuel map that tells you when a price might be stale.</p>
        <Notes rows={[
          ['the problem', 'Fuel apps show every price as if it were current. Some are hours old, or come from a feed that stopped updating, and you can’t tell which.'],
          ['so', 'Every price on the map carries its status. Age comes from the provider’s own timestamp, so refreshing the app can’t make an old price look new.'],
        ]} />
        <FreshnessTrack />
        <p className="cap4">Four clocks on every price. Only the first two count toward freshness.</p>
        <RepoLink href="https://github.com/RealSid08/ServoGrid">Source</RepoLink>
      </>
    ),
  },
  {
    name: 'ServoGrid',
    color: '#2a9bb5',
    tab: 'ServoGrid',
    className: 'sgR',
    content: (
      <>
        <Run left="Trust states" right={<b>ServoGrid</b>} />
        <ServoBoard />
        <figure className="shot">
          <span className="tape" style={{ '--tape': 'rgba(125,200,225,0.75)' } as React.CSSProperties} />
          <div className="phone"><img src="/work/notebook/servogrid-station-detail.jpg" alt="ServoGrid station detail with the evidence behind a price" loading="lazy" decoding="async" {...zoomable('servogrid', '/work/notebook/full/servogrid-station-detail.jpg', 'ServoGrid · a station and the evidence behind its price', 'iOS')} /></div>
        </figure>
        <div className="note-l">
          <p className="hw">every price wears its status, even the missing ones →</p>
          <p className="body">Live WA FuelWatch data, including tomorrow’s prices. NSW and Tasmania are ready for credentials. States without reusable data say so; nothing is scraped. When evidence is thin it shows “insufficient data” instead of a trend.</p>
        </div>
      </>
    ),
  },
  {
    name: 'Research',
    color: '#4f46e5',
    target: 'project-llm-cooperation',
    content: (
      <>
        <Run left={<><b>06</b> · Research</>} right="Python" />
        <div className="sheet">
          <p className="lab" style={{ margin: 0 }}>
            Pilot · Oct 2026 · <a href="https://github.com/RealSid08/llm-cooperation-pilot" target="_blank" rel="noopener noreferrer"><GitHubIcon /> llm-cooperation-pilot</a>
          </p>
          <h3 data-mark>Do coding agents cooperate when nobody tells them to?</h3>
          <p className="abs">
            Each round, two players choose to cooperate or betray. Betraying someone who cooperates pays best, but if both
            betray, both lose out. I had Claude Code, Codex and five OpenCode models play ten-round games against simple
            scripted players and against themselves, with 5% of moves randomly flipped so mistakes happen. Each move is a
            fresh call with no tools or instructions beyond the rules.
          </p>
          <p className="lab">Fig. 1 · How often each agent cooperated (%), by opponent</p>
          <CoopHeatmap />
        </div>
      </>
    ),
  },
  {
    name: 'Research',
    color: '#4f46e5',
    tab: 'Research',
    content: (
      <>
        <Run left="Findings" right={<b>Research</b>} />
        <p className="find">Both cooperate with anyone who cooperates back. They split after a betrayal: Claude Code forgives, Codex holds a grudge.</p>
        <p className="lab" style={{ margin: '12px 0 2px' }}>Right after being betrayed, how often each cooperated</p>
        <div className="duo">
          <div><b className="c">70%</b><span>Claude Code</span></div>
          <div><b>9%</b><span>Codex</span></div>
        </div>
        <p className="lab" style={{ marginTop: 8 }}>Fig. 2 · Chance of cooperating, by last round</p>
        <AfterOutcome />
        <p className="lab" style={{ marginTop: 10 }}>Fig. 3 · A real game · A = cooperate, B = betray</p>
        <div className="replays"><Replay /></div>
        <p className="hw" style={{ margin: '10px 0 0', fontSize: 18, lineHeight: 1.05 }}>the catch: forgiveness gets exploited. Against a player who moves at random, Codex out-scored Claude Code, 2.33 points a round to 2.03.</p>
      </>
    ),
  },
  {
    name: 'Also',
    color: '#8a8175',
    target: 'also',
    content: (
      <>
        <Run left={<><b>07</b> · Also</>} right="tools and experiments" />
        <h2 className="t" style={{ fontSize: 44, marginTop: 16 }} data-mark>Also in here</h2>
        <div className="shelf">
          {SHELF.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" data-target={`project-${item.id}`}>
              <b data-mark><GitHubIcon />{item.title}</b>
              <span className="k">{item.kind}</span>
              <p>{item.line}</p>
            </a>
          ))}
        </div>
      </>
    ),
  },
  {
    name: 'Also',
    color: '#8a8175',
    tab: 'Also',
    className: 'alsoR',
    content: (
      <>
        <Run left="Pinned" right={<b>Also</b>} />
        <figure className="pin pin-a">
          <span className="tape" />
          <img src="/work/notebook/heist-chase.jpg" alt="HS: Heist, a first-person chase" loading="lazy" decoding="async" {...zoomable('also', '/work/notebook/full/heist-chase.jpg', 'HS: Heist · the agent plays your partner', 'WebMCP game')} />
          <figcaption>HS: Heist · the agent plays your partner</figcaption>
        </figure>
        <figure className="pin pin-b">
          <span className="tape" style={{ '--tape': 'rgba(160,150,140,0.6)' } as React.CSSProperties} />
          <img src="/work/notebook/t3-wall.jpg" alt="t3-wall, a dashboard of running agents and subscription limits" loading="lazy" decoding="async" {...zoomable('also', '/work/notebook/full/t3-wall.jpg', 't3-wall · agents and limits at a glance', 'Ambient dashboard')} />
          <figcaption>t3-wall · agents and limits at a glance</figcaption>
        </figure>
        <p className="hw pin-note">tools for my own agent setup, and a few experiments ↗</p>
      </>
    ),
  },
  {
    name: 'More work',
    color: '#7a5c3e',
    target: 'experience',
    content: (
      <>
        <Run left={<><b>08</b> · More client work</>} right="since 2025" />
        <h2 className="t" style={{ fontSize: 44, marginTop: 16 }} data-mark>Before and alongside</h2>
        <div className="xp">
          <div data-target="exp-complete-leader">
            <div className="top"><b data-mark>Complete Leader</b><em>casual · since Dec 2025</em></div>
            <p>Paper questionnaires and hand-written reports became online psychometric assessments, automatic scoring and streamed AI reports, with a staff dashboard to invite clients and export results.</p>
            <div className="tags"><span>Next.js</span><span>Supabase</span></div>
          </div>
          <div data-target="exp-mindtek">
            <div className="top"><b data-mark>Mindtek AI</b><em>May to Oct 2025</em></div>
            <p>A platform where businesses build chatbots grounded in their own documents and embed them on their sites. I also built a Gemini Live voice agent that answers spoken questions and takes booking requests through tool calls.</p>
            <div className="tags"><span>Next.js</span><span>Supabase</span><span>RAG</span><span>Gemini Live</span></div>
          </div>
          <div data-target="exp-hida">
            <div className="top"><b data-mark>HiDa</b><em>founder · 2020 to 2021</em></div>
            <p>A video-calling app with screen sharing and synced chat, built on WebRTC.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    name: 'Contact',
    className: 'contact',
    color: 'var(--nb-accent)',
    tab: 'Hello',
    target: 'contact',
    content: (
      <>
        <Run left="Contact" right={<b>Hello</b>} />
        <p className="hw" style={{ margin: '40px 0 0', fontSize: 28 }}>say hello →</p>
        <h2 className="t" style={{ fontSize: 52 }} data-mark>Let’s build something.</h2>
        <p className="body" style={{ maxWidth: '26em' }}>I’m in Melbourne. If you’re hiring, or have a product that needs building, write to me.</p>
        <ul className="ways">
          <li><a href={`mailto:${PROFILE.email}`}><MailIcon />{PROFILE.email}</a></li>
          <li><a href={PROFILE.github} target="_blank" rel="noopener noreferrer"><GitHubIcon />github.com/RealSid08</a></li>
          <li><a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer"><LinkedInIcon />linkedin.com/in/sidhaarth-krishnan</a></li>
          <li><a href={PROFILE.resumeUrl} download="Sidhaarth_Krishnan_Resume.pdf"><DocIcon />Résumé, PDF</a></li>
        </ul>
      </>
    ),
  },
  {
    name: 'Back cover',
    className: 'cover',
    content: (
      <>
        <div className="stitch" />
        <div className="found">If found, please return to<br /><a href={`mailto:${PROFILE.email}`}><MailIcon />{PROFILE.email}</a></div>
      </>
    ),
  },
];

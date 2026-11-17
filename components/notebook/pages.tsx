import React from 'react';
import { PROFILE } from '../../constants';
import { CONTENTS } from './contents';
import {
  zoomable,
  AfterOutcome,
  Bars,
  CoopHeatmap,
  FoodlyFlow,
  FoodlyScreens,
  FreshnessTrack,
  ParkSpeed,
  Replay,
  ServoBoard,
  StretchWeek,
  SwitchyardDiagram,
  Tile,
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
  { id: 'pptx-react-renderer', kind: 'npm · 1,485 downloads', title: 'pptx-react-renderer', line: 'Renders PowerPoint files as semantic HTML in the browser, checked by pixel-diff tests. About 300 downloads a month.', url: 'https://www.npmjs.com/package/pptx-react-renderer' },
  { id: 'openclaw', kind: 'Co-author', title: 'OpenClaw', line: 'My OpenCode integration became “Agents: add pluggable CLIs” on main, with me as co-author.', url: 'https://github.com/openclaw/openclaw/commit/f31e89d5af' },
  { id: 'codex-shared-memory', kind: 'MCP server', title: 'Codex Shared Memory', line: 'Self-hosted MCP server that shares agent memory across machines over SSH, with an offline cache.', url: 'https://github.com/RealSid08/codex-shared-memory' },
  { id: 'p3stack', kind: 'T3 Code skills', title: 'p3stack', line: 'Lauren Tan’s pstack, ported to T3 Code’s orchestrator: 23 playbooks for planning, delegating and review.', url: 'https://github.com/RealSid08/p3stack' },
  { id: 't3-wall', kind: 'Ambient dashboard', title: 't3-wall', line: 'Read-only kiosk for T3 Code: running agents, subscription limits and usage across machines.', url: 'https://github.com/RealSid08/t3-wall' },
  { id: 'hs-heist', kind: 'WebMCP game', title: 'HS: Heist', line: 'A first-person heist where a WebMCP agent plays your partner through ten tools and remembers its failures.', url: 'https://github.com/RealSid08/openai-webmcp-challenge' },
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
        <p className="hw" style={{ margin: '14px 0 0' }}>hi! this is what I’m building ↓</p>
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
        <h1 data-mark>I’m building <em>Stretch</em>, a personal food agent.</h1>
        <p className="lede">
          It plans your week of meals around your budget and taste, and learns from the taps you already make. About
          360 devices found it in its first five weeks.
        </p>
        <div className="why-row">
          <a className="why" href="#p3" data-go={2}><span>Why?</span> Read the story →</a>
          <span className="stamp" title="Builders Hack: Unlocked, run by Lyra and Product Counsel, Sydney, 16 Oct 2026">Won · Builders Hack<small>Lyra × Product Counsel · Oct 2026</small></span>
        </div>
        <p className="lab">Client work</p>
        <p className="body" style={{ margin: '0 0 12px', fontSize: 12.5 }}>
          I also run production software for three businesses. I learn how each team works, then replace its slow manual
          steps with software and AI agents: Kenspire’s consulting platform, now at 22 client companies, and Besmak’s task
          platform, with 220+ staff accounts in its first two weeks.
        </p>
        <div data-target="education">
          <p className="lab">Studying</p>
          <p className="body" style={{ margin: 0 }} data-mark>Bachelor of Engineering (Honours), Software<br />Swinburne University of Technology<br />Graduating December 2026</p>
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
          {CONTENTS.map((row) => (
            <a key={row.title} href={`#p${row.spread * 2 - 1}`} data-go={row.spread} data-row={row.targets.join(' ')}>
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
    name: 'Stretch',
    color: '#e8361d',
    target: 'projects project-stretch exp-stretch',
    content: (
      <>
        <Run left={<b>Stretch</b>} right="Founder · since Oct 2026" />
        <span className="chip">Won Builders Hack: Unlocked</span>
        <h2 className="t st-title" data-mark>Stretch <Tile /></h2>
        <p className="pitch" style={{ maxWidth: '15em' }}>A personal food agent that plans your week around your budget and taste.</p>
        <StretchWeek />
        <Notes rows={[
          ['the problem', 'After I moved to Melbourne, between uni, client work and side projects, some days were one meal and a coffee. By the afternoon I couldn’t focus. Cooking takes planning, and eating well felt like money I didn’t have.'],
          ['so', 'Tile, Stretch’s agent, plans breakfast, lunch and dinner with one shopping list priced at shops near you. There’s no chat box: it learns from yum or nah, how dinner went, and what the shop really cost.'],
        ]} />
        <a className="go" href="https://getstretch.app" target="_blank" rel="noopener noreferrer">Try Stretch ↗</a>
        <Sticky wide className="st-win wide-only" style={{ right: 34, top: 222, width: 164, transform: 'rotate(3deg)' }}>about <b>360</b> devices in its first five weeks</Sticky>
      </>
    ),
  },
  {
    name: 'Stretch',
    color: '#e8361d',
    tab: 'Stretch',
    className: 'pkR stR',
    content: (
      <>
        <Run left="Screens" right={<b>Stretch</b>} />
        <div className="pair">
          <figure>
            <span className="tape" style={{ '--tape': 'rgba(255, 214, 60, 0.75)' } as React.CSSProperties} />
            <div className="phone"><img src="/work/notebook/stretch-deck.jpg" alt="Stretch swipe deck: red lentil dal, about 22 cents a serve" loading="lazy" decoding="async" {...zoomable('stretch', '/work/notebook/full/stretch-deck.jpg', 'Stretch · swipe a deck with Tile', 'iPhone')} /></div>
            <figcaption>swipe, so Tile learns your taste</figcaption>
          </figure>
          <figure>
            <span className="tape" style={{ '--tape': 'rgba(232, 54, 29, 0.45)' } as React.CSSProperties} />
            <div className="phone"><img src="/work/notebook/stretch-week.jpg" alt="Stretch weekly plan: $29.72 of a $60 budget" loading="lazy" decoding="async" {...zoomable('stretch', '/work/notebook/full/stretch-week.jpg', 'Stretch · a real week, $29.72 of $60', 'iPhone')} /></div>
            <figcaption>a real week, $29.72 of $60</figcaption>
          </figure>
        </div>
        <div className="why-free">
          <p className="hw">evals decide what ships →</p>
          <p className="body">Blind judges from other model families preferred weeks that used people’s own notes 64 of 78 times. A pricing tool that found real prices for 84% of groceries stayed out: 18 times the research, and less variety.</p>
        </div>
      </>
    ),
  },
  {
    name: 'Kenspire Argo',
    color: '#7a5c3e',
    target: 'work exp-kenspire',
    content: (
      <>
        <Run left={<b>Client work</b>} right="Contract · since Oct 2025" />
        <span className="chip">Kenspire Advisors · its only engineer</span>
        <h2 className="t" data-mark>Kenspire Argo</h2>
        <p className="pitch" style={{ maxWidth: '16em' }}>The platform a consultancy runs its consulting on, at 22 client companies.</p>
        <Notes rows={[
          ['the job', 'Kenspire’s method lived in Excel. I ran a 500+ question spec review where the owner settled 160+ decisions, then built the edge cases as explicit states.'],
          ['hard part', 'Database I/O. Over two redesigns I cut it by about 90% while client companies grew from 9 to 22, with zero downtime.'],
        ]} />
        <div className="chain"><b>maker</b><i>→</i><b>checker</b><i>→</i><b>sign-off</b><i>↺</i><b>send back, 7 days</b></div>
        <p className="lab" style={{ marginTop: 20 }}>Database I/O, GB a day</p>
        <div style={{ maxWidth: 252 }}>
          <Bars label="Database I/O per day" best={1} rows={[['before', 1, '7.6'], ['after', 0.8 / 7.6, '0.8']]} />
        </div>
        <p className="cap4" style={{ maxWidth: '16em' }}>62 aggregates became exact transactional counters, and each fact is stored once.</p>
        <Sticky wide style={{ right: 32, bottom: 46, width: 150, transform: 'rotate(-3deg)' }}>client companies went <b>9 → 22</b> in the same months</Sticky>
      </>
    ),
  },
  {
    name: 'Kenspire Connect',
    color: '#7a5c3e',
    tab: 'Work',
    content: (
      <>
        <Run left="Client work" right={<b>Kenspire</b>} />
        <span className="chip">iOS and Android · on the App Store</span>
        <h2 className="t" style={{ fontSize: 46 }}>Kenspire Connect</h2>
        <p className="pitch" style={{ maxWidth: '16em' }}>Tasks and timesheets for Kenspire’s 30-person team.</p>
        <p className="body" style={{ maxWidth: '27em' }}>It replaced Excel planning sheets, WhatsApp follow-ups and manual monthly timesheets. I moved it onto a new backend without changing its mobile UI: 3,634 tasks and 13,560 timesheet entries, zero mismatches.</p>
        <p className="lab" style={{ marginTop: 18 }}>In-app agent, first-call prompt</p>
        <Bars label="In-app agent first-call prompt" best={1} labelWidth={80} rows={[['all tools', 1, '15.5k'], ['lazy tools', 4.3 / 15.5, '4.3k']]} />
        <p className="cap4" style={{ maxWidth: '21em' }}>Every change the agent makes is a direct call through the user’s own permission checks.</p>
        <div className="note-agent">
          <p className="hw">an agent on the team →</p>
          <p className="body">I built an agent that picks up the business team’s issues. It closed 39 in its first three days, 25 through merged fixes with screenshot evidence. Simple fixes ship without me; bigger ones wait for my review.</p>
        </div>
      </>
    ),
  },
  {
    name: 'Besmak',
    color: '#7a5c3e',
    target: 'exp-besmak',
    content: (
      <>
        <Run left={<b>Client work</b>} right="Contract · since Jul 2026" />
        <span className="chip">Besmak Components · web, iOS, Android</span>
        <h2 className="t" data-mark>Besmak</h2>
        <p className="pitch" style={{ maxWidth: '16em' }}>One task platform for every department of a manufacturer in India.</p>
        <Notes rows={[
          ['my job', 'I scoped it with their IT head, built web, iOS and Android, offered SaaS or a perpetual licence (they chose SaaS), and hired a UI/UX developer for three weeks.'],
          ['hard part', 'Their data stays in India and in their hands: it runs in Besmak’s own AWS account in Mumbai. IT asked for a VPN; staff use the load balancer and admins use SSM instead, with no long-lived keys.'],
        ]} />
        <div className="infra" role="img" aria-label="Web and mobile apps talk to Convex on EC2, backed by Multi-AZ PostgreSQL and encrypted S3, in AWS Mumbai">
          <div className="col"><b>Web</b><b>Mobile</b></div><i>→</i>
          <div className="col"><b className="hub">Convex<small>self-hosted on EC2</small></b></div><i>→</i>
          <div className="col"><b>Postgres<small>Multi-AZ</small></b><b>S3<small>encrypted</small></b></div>
        </div>
        <p className="hw" style={{ margin: '8px 0 0', fontSize: 19 }}>all of it in OpenTofu, in AWS Mumbai</p>
        <Sticky wide style={{ right: 36, bottom: 20, width: 196, transform: 'rotate(-2deg)' }}>launched in October, <b>220+</b> accounts in two weeks</Sticky>
      </>
    ),
  },
  {
    name: 'More client work',
    color: '#7a5c3e',
    target: 'experience',
    content: (
      <>
        <Run left="Client work" right={<b>Before and alongside</b>} />
        <h2 className="t" style={{ fontSize: 44, marginTop: 16 }} data-mark>Before and alongside</h2>
        <div className="xp">
          <div data-target="exp-complete-leader">
            <div className="top"><b data-mark>Complete Leader</b><em>casual · since Dec 2025</em></div>
            <p>Paper questionnaires and hand-written reports became online psychometric assessments with scoring and AI-drafted reports. When summaries went missing in production, I moved them server-side and backfilled 93 in about four hours.</p>
            <div className="tags"><span>Next.js</span><span>Supabase</span></div>
          </div>
          <div data-target="exp-mindtek">
            <div className="top"><b data-mark>Mindtek AI</b><em>May to Oct 2025</em></div>
            <p>In a team of four, a platform where businesses build chatbots grounded in their own documents, live on four companies’ websites, and a Gemini Live voice receptionist that books appointments through tool calls.</p>
            <div className="tags"><span>Next.js</span><span>Supabase</span><span>RAG</span><span>Gemini Live</span></div>
          </div>
          <div data-target="exp-hida">
            <div className="top"><b data-mark>HiDa</b><em>founder · 2016 to 2021</em></div>
            <p>A video-calling app with screen sharing and synced chat, built on WebRTC when I was 16.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    name: 'Runaway',
    color: '#c2410c',
    target: 'project-runaway',
    content: (
      <>
        <Run left={<b>Runaway</b>} right="Unity · C# · PyTorch" />
        <span className="chip">Agentic AI for emergency decisions</span>
        <h2 className="t" data-mark>Runaway</h2>
        <p className="pitch" style={{ maxWidth: '16em' }}>A battery fire at night, and an AI advisor that tests its plan before it speaks.</p>
        <Notes rows={[
          ['the problem', 'Water won’t put out a battery in thermal runaway. You keep its neighbours cool and the toxic smoke off the homes and the school, while some sensors lie. When should a commander trust an agent’s call?'],
          ['so', 'A Unity incident simulator. A graph network forecasts which enclosure catches next. A Codex agent reads the fire through five MCP tools, runs each plan 16 times in the simulation, then hands the human a plan to accept, edit or dismiss.'],
        ]} />
        <p className="lab" style={{ marginTop: 14 }}>Forecasting spread 10 minutes ahead, AUC</p>
        <Bars label="Forecast accuracy, AUC" best={0} labelWidth={100} rows={[['graph network', 0.994, '0.994'], ['heuristic', 0.949, '0.949']]} />
        <p className="cap4">400 held-out fires. Trained in PyTorch on 4,000 simulated ones, run inside Unity.</p>
        <RepoLink href="https://github.com/RealSid08/runaway">Source and 3-minute demo</RepoLink>
      </>
    ),
  },
  {
    name: 'Runaway',
    color: '#c2410c',
    tab: 'Runaway',
    className: 'rwR',
    content: (
      <>
        <Run left="The advisor’s card" right={<b>Runaway</b>} />
        <figure className="pin rw-shot">
          <span className="tape" style={{ '--tape': 'rgba(194, 65, 12, 0.35)' } as React.CSSProperties} />
          <img src="/work/notebook/runaway-card.jpg" alt="Runaway: the advisor proposes cooling B3 and B4 and sheltering Glenvale homes, with its reasons and expected effect" loading="lazy" decoding="async" {...zoomable('runaway', '/work/notebook/full/runaway-card.jpg', 'Runaway · the advisor’s plan, waiting for the commander', 'Unity app')} />
          <figcaption>its plan, waiting for the commander</figcaption>
        </figure>
        <figure className="pin rw-smoke">
          <span className="tape" />
          <img src="/work/notebook/runaway-smoke.jpg" alt="Runaway: estimated toxic smoke drifting toward the primary school" loading="lazy" decoding="async" {...zoomable('runaway', '/work/notebook/full/runaway-smoke.jpg', 'Runaway · toxic smoke drifting toward the school', 'Unity app')} />
        </figure>
        <div className="rw-note">
          <p className="lab">Same five fires, enclosures lost</p>
          <Bars label="Enclosures lost on the same five fires" best={2} labelWidth={92} rows={[['no response', 1, '9.0'], ['rule of thumb', 2.2 / 9, '2.2'], ['Codex planner', 1 / 9, '1.0']]} />
          <p className="hw" style={{ marginTop: 10, fontSize: 18, lineHeight: 1.05 }}>two sensors freeze on purpose. it has to catch them from the thermal camera.</p>
        </div>
      </>
    ),
  },
  {
    name: 'Foodly',
    color: '#3f8f4f',
    target: 'project-foodly',
    content: (
      <>
        <Run left={<b>Foodly</b>} right="iOS · Android · web" />
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
        <Run left={<b>Switchyard</b>} right="Rust · open source" />
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
        <Run left={<b>ParkAlong</b>} right="Swift · iOS" />
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
        <Run left={<b>ServoGrid</b>} right="Swift · iOS" />
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
    name: 'Stack',
    color: '#9c3a6b',
    target: 'project-pdfstack',
    content: (
      <>
        <Run left={<b>Stack</b>} right="TypeScript · Cloudflare" />
        <span className="chip">Open source · free, no sign-up</span>
        <h2 className="t" data-mark>Stack</h2>
        <p className="pitch">Any files in, one PDF out. No sign-up, no ads.</p>
        <Notes rows={[
          ['the problem', 'A friend texted me: did I know a PDF converter that didn’t ask for money or a sign-up, and wasn’t buried in ads? I hadn’t realised how common that was until he asked.'],
          ['so', 'Instead of finding a half-decent one, I built one and sent him the link. Photos and PDFs are prepared on your device, documents convert on a Cloudflare Worker that keeps nothing, and the PDF is merged in your browser.'],
        ]} />
        <div className="facts">
          <div><small>Reads</small>56 file types</div>
          <div><small>Keeps</small>nothing</div>
          <div><small>Asks for</small>no account, no money</div>
          <div><small>Runs on</small>Cloudflare Workers</div>
        </div>
        <div className="links">
          <a className="go" href="https://stack.realsid08.me" target="_blank" rel="noopener noreferrer">Open Stack ↗</a>
          <RepoLink href="https://github.com/RealSid08/pdfstack">Source</RepoLink>
        </div>
        <Sticky style={{ right: 34, bottom: 60, width: 118, transform: 'rotate(-3deg)' }}>text to link<b>1 day</b>built and shipped</Sticky>
      </>
    ),
  },
  {
    name: 'Stack',
    color: '#9c3a6b',
    tab: 'Stack',
    className: 'skR',
    content: (
      <>
        <Run left="The link I sent" right={<b>Stack</b>} />
        <figure className="pin sk-desk">
          <span className="tape" style={{ '--tape': 'rgba(156, 58, 107, 0.35)' } as React.CSSProperties} />
          <img src="/work/notebook/stack-desktop.jpg" alt="Stack on a laptop: two files in the stack, A4, Download PDF" loading="lazy" decoding="async" {...zoomable('stack', '/work/notebook/full/stack-desktop.jpg', 'Stack · on a laptop', 'Desktop web')} />
          <figcaption>on a laptop</figcaption>
        </figure>
        <figure className="sk-phone">
          <div className="phone"><img src="/work/notebook/stack-mobile.jpg" alt="Stack on a phone: two files ready to download as one PDF" loading="lazy" decoding="async" {...zoomable('stack', '/work/notebook/full/stack-mobile.jpg', 'Stack · on a phone', 'Mobile web')} /></div>
        </figure>
        <div className="sk-note">
          <p className="hw">drop files in, drag to reorder, download ↓</p>
          <p className="body">Word, Excel, Keynote, Pages, EPUB, email and code files all convert, and iPhone photos decode on the device. Every format has a test, and a live run against production passed 27 of 27 checks.</p>
          <div className="tags">{['docx', 'xlsx', 'pptx', 'key', 'pages', 'epub', 'heic', 'md'].map((ext) => <span key={ext}>.{ext}</span>)}</div>
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
        <Run left={<b>Research</b>} right="Python" />
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
    name: 'Open source',
    color: '#8a8175',
    target: 'also',
    content: (
      <>
        <Run left={<b>Open source</b>} right="packages, tools, experiments" />
        <h2 className="t" style={{ fontSize: 44, marginTop: 14 }} data-mark>Open source</h2>
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
    name: 'Open source',
    color: '#8a8175',
    tab: 'Code',
    className: 'alsoR',
    content: (
      <>
        <Run left="Pinned" right={<b>Open source</b>} />
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
    name: 'Writing',
    color: 'var(--nb-accent)',
    target: 'writing',
    content: (
      <>
        <Run left={<b>Writing</b>} right="blog.realsid08.me" />
        <h2 className="t" style={{ fontSize: 52, marginTop: 18 }} data-mark>Writing</h2>
        <p className="body" style={{ maxWidth: '24em' }}>Notes on what I build and how. Every post can be read, or heard in my voice or one of two others.</p>
        <a className="post" href="https://blog.realsid08.me/agents-at-home" target="_blank" rel="noopener noreferrer">
          <small>Nov 2026 · 12 min read</small>
          <b>Your agents should live at home</b>
          <span>Why I run every coding agent on a Mac that never leaves my desk, and how to set one up with T3 Code.</span>
        </a>
        <a className="go" href="https://blog.realsid08.me" target="_blank" rel="noopener noreferrer">All writing ↗</a>
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
        <p className="body" style={{ maxWidth: '26em' }}>I’m in Melbourne and graduate in December 2026. If you’re hiring, or have a product that needs building, write to me.</p>
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

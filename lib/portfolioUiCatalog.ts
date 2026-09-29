import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';
import { CARD_IDS } from './portfolioIds';

const cardId = z.enum(CARD_IDS).describe('Page card id, e.g. project-foodly or exp-besmak');

/**
 * Visual vocabulary for facts the assistant has already checked. Components that
 * take a card id wire themselves to the page: hovering outlines the card and the
 * button scrolls to it, so the model never has to write event bindings.
 */
const components = {
    Stack: {
      props: z.object({}),
      slots: ['default'],
      description: 'Root container when the answer needs more than one component.',
    },
    WorkCard: {
      props: z.object({
        target: cardId,
        title: z.string(),
        meta: z.string().describe('Role and period, or project type and period'),
        summary: z.string().describe('One or two sentences of concrete evidence'),
        stack: z.array(z.string()).max(5),
      }),
      slots: ['default'],
      description: 'One role or project, with a button that shows it on the page. Children may be Metric or SourceLink.',
    },
    Metric: {
      props: z.object({ value: z.string().describe('A number from a tool result, e.g. 600 or 34,023'), label: z.string() }),
      description: 'A single sourced number with a short label.',
    },
    MetricRow: {
      props: z.object({}),
      slots: ['default'],
      description: 'Two to four Metric elements side by side.',
    },
    Compare: {
      props: z.object({
        columns: z.array(z.object({ title: z.string(), target: cardId.nullable() })).min(2).max(3),
        rows: z.array(z.object({ label: z.string(), values: z.array(z.string()) })).min(2).max(6),
      }),
      description: 'Side-by-side comparison of two or three roles or projects. Each row has one value per column.',
    },
    Timeline: {
      props: z.object({
        items: z.array(z.object({ period: z.string(), title: z.string(), note: z.string(), target: cardId.nullable() })).min(2).max(8),
      }),
      description: 'Roles or projects in date order, newest first.',
    },
    RepoList: {
      props: z.object({
        asOf: z.string().describe('The fetch time from the GitHub tool result'),
        repos: z.array(z.object({
          name: z.string().describe('owner/name'),
          url: z.string().url(),
          description: z.string(),
          language: z.string().nullable(),
          updated: z.string().nullable(),
        })).min(1).max(6),
      }),
      description: 'Public GitHub repositories returned by a lookup tool.',
    },
    PageButton: {
      props: z.object({
        label: z.string(),
        action: z.enum(['show', 'filter', 'tour']),
        value: z.string().nullable().describe('Card id for show, tech or keyword for filter, null for tour'),
      }),
      description: 'A button that changes the page when the visitor clicks it: show a card, filter the work, or start a tour.',
    },
    EvidenceBoard: {
      props: z.object({ title: z.string(), asOf: z.string() }),
      slots: ['default'],
      description: 'Compact board for comparing public repositories, issues, or pull requests. asOf is the source fetch time.',
    },
    EvidenceItem: {
      props: z.object({ kind: z.enum(['project', 'repository', 'issue', 'pull request', 'role']), title: z.string(), summary: z.string() }),
      slots: ['default'],
      description: 'One sourced work item inside an EvidenceBoard.',
    },
    Fact: {
      props: z.object({ label: z.string(), value: z.string() }),
      description: 'A short fact copied from portfolio or GitHub tool results.',
    },
    SourceLink: {
      props: z.object({ label: z.string(), url: z.string().url() }),
      description: 'A public source URL returned by a lookup tool, never an invented URL.',
    },
};

export const portfolioUiCatalog = defineCatalog(schema, { components, actions: {} });

const withoutMeta = (key: string, value: unknown) =>
  key === '$schema' || key === 'additionalProperties' ? undefined : value;

const CARD_ID_JSON = JSON.stringify(z.toJSONSchema(cardId), withoutMeta);

const describeProps = (shape: z.ZodType) => {
  const json = z.toJSONSchema(shape, { unrepresentable: 'any' }) as { properties?: Record<string, unknown> };
  return JSON.stringify(json.properties ?? {}, withoutMeta).split(CARD_ID_JSON).join('"<card id>"');
};

/**
 * A compact spec prompt for this catalog. json-render's generic prompt is long and
 * asks for "realistic sample data", which is the opposite of what a portfolio
 * needs, so the format is described here instead and parsed by pipeJsonRender.
 */
export const uiSpecPrompt = () => `UI spec format:
After the prose, add a fenced block that starts with \`\`\`spec and holds one JSON Patch operation per line. It builds a
flat element map: set /root to the root element key, then add each element under /elements/<key>. Every element has
"type", "props" (all props; use null for nullable ones you do not need) and "children" (element keys, [] if none).
Use a Stack as the root when there is more than one component.

Example:
\`\`\`spec
{"op":"add","path":"/root","value":"stack"}
{"op":"add","path":"/elements/stack","value":{"type":"Stack","props":{},"children":["foodly","show"]}}
{"op":"add","path":"/elements/foodly","value":{"type":"WorkCard","props":{"target":"project-foodly","title":"Foodly","meta":"Final-year project · 2026","summary":"<from the tool result>","stack":["React Native","Convex"]},"children":["metrics"]}}
{"op":"add","path":"/elements/metrics","value":{"type":"MetricRow","props":{},"children":["tests"]}}
{"op":"add","path":"/elements/tests","value":{"type":"Metric","props":{"value":"102","label":"automated tests"},"children":[]}}
{"op":"add","path":"/elements/show","value":{"type":"PageButton","props":{"label":"Filter to Convex work","action":"filter","value":"convex"},"children":[]}}
\`\`\`

Components (props as JSON Schema; <card id> is one of the card ids listed above):
${Object.entries(components)
  .map(([name, definition]) => `- ${name}: ${definition.description}${'slots' in definition ? ' Has children.' : ''} Props: ${describeProps(definition.props)}`)
  .join('\n')}`;

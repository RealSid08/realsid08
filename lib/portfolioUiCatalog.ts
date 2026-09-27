import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

/** Read-only visual vocabulary for facts the assistant has already checked. */
export const portfolioUiCatalog = defineCatalog(schema, {
  components: {
    EvidenceBoard: {
      props: z.object({ title: z.string(), asOf: z.string() }),
      slots: ['default'],
      description: 'Compact board for comparing public projects, repositories, issues, or pull requests. asOf is the source fetch time or a clear static portfolio label.',
    },
    EvidenceItem: {
      props: z.object({ kind: z.enum(['project', 'repository', 'issue', 'pull request', 'role']), title: z.string(), summary: z.string() }),
      slots: ['default'],
      description: 'One sourced work item with a short factual summary.',
    },
    Fact: {
      props: z.object({ label: z.string(), value: z.string() }),
      description: 'A short fact copied from portfolio or GitHub tool results.',
    },
    SourceLink: {
      props: z.object({ label: z.string(), url: z.string().url() }),
      description: 'A public source URL returned by a lookup tool, never an invented URL.',
    },
  },
  actions: {},
});

import React, { Suspense, lazy } from 'react';
import { Notebook } from './components/notebook/Notebook';

// The assistant pulls in the chat and markdown stack, so the notebook paints first.
const AgentBar = lazy(() => import('./components/agent/AgentBar').then((module) => ({ default: module.AgentBar })));

const App: React.FC = () => (
  <>
    <Notebook />
    <Suspense fallback={null}>
      <AgentBar />
    </Suspense>
  </>
);

export default App;

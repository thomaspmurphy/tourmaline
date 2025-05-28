import React, { useState } from 'react'
import ThreadList from './ThreadList'
import ThreadView from './ThreadView'

export type View = 'threads' | 'thread'

interface RouterState {
  view: View
  threadId?: number
}

const Router: React.FC = () => {
  const [routerState, setRouterState] = useState<RouterState>({ view: 'threads' })

  const navigateToThreads = () => {
    setRouterState({ view: 'threads' })
  }

  const navigateToThread = (threadId: number) => {
    setRouterState({ view: 'thread', threadId })
  }

  switch (routerState.view) {
    case 'thread':
      return (
        <ThreadView 
          threadId={routerState.threadId!} 
          onBack={navigateToThreads}
        />
      )
    case 'threads':
    default:
      return (
        <ThreadList onThreadClick={navigateToThread} />
      )
  }
}

export default Router 
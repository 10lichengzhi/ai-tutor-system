import { useEffect, useRef } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import G6 from '@antv/g6'

interface NodeData {
  id: string
  label: string
  status?: 'mastered' | 'learning' | 'locked'
  level?: number
}

interface EdgeData {
  source: string
  target: string
}

interface KnowledgeGraphProps {
  nodes?: NodeData[]
  edges?: EdgeData[]
  onNodeClick?: (node: NodeData) => void
  height?: number
}

const defaultNodes: NodeData[] = [
  { id: '1', label: '函数', status: 'mastered', level: 1 },
  { id: '2', label: '导数', status: 'learning', level: 2 },
  { id: '3', label: '极限', status: 'mastered', level: 2 },
  { id: '4', label: '积分', status: 'locked', level: 3 },
  { id: '5', label: '微分方程', status: 'locked', level: 3 },
  { id: '6', label: '连续', status: 'learning', level: 2 },
  { id: '7', label: '级数', status: 'locked', level: 3 },
]

const defaultEdges: EdgeData[] = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '3', target: '6' },
  { source: '2', target: '4' },
  { source: '4', target: '5' },
  { source: '3', target: '7' },
]

const statusColors: Record<string, string> = {
  mastered: '#10b981',
  learning: '#3b82f6',
  locked: '#9ca3af',
}

const KnowledgeGraph = ({
  nodes = defaultNodes,
  edges = defaultEdges,
  onNodeClick,
  height = 600,
}: KnowledgeGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.scrollWidth

    const graph = new G6.Graph({
      container: containerRef.current,
      width,
      height,
      fitView: true,
      fitViewPadding: 40,
      layout: {
        type: 'force',
        preventOverlap: true,
        linkDistance: 120,
        nodeStrength: -300,
        edgeStrength: 0.5,
      },
      defaultNode: {
        type: 'circle',
        size: 50,
        style: {
          fill: '#e0e7ff',
          stroke: '#6366f1',
          lineWidth: 2,
        },
        labelCfg: {
          style: {
            fill: '#1f2937',
            fontSize: 12,
            fontWeight: 500,
          },
          position: 'bottom',
          offset: 8,
        },
      },
      defaultEdge: {
        type: 'line',
        style: {
          stroke: '#cbd5e1',
          lineWidth: 2,
          endArrow: {
            path: G6.Arrow.triangle(8, 10, 0),
            fill: '#cbd5e1',
          },
        },
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
      },
    })

    graph.data({
      nodes: nodes.map((node) => ({
        id: node.id,
        label: node.label,
        style: {
          fill: node.status ? `${statusColors[node.status]}20` : '#e0e7ff',
          stroke: node.status ? statusColors[node.status] : '#6366f1',
        },
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    })

    graph.render()

    graph.on('node:click', (evt: any) => {
      const { item } = evt
      const model = item.getModel()
      const nodeData = nodes.find((n) => n.id === model.id)
      if (nodeData && onNodeClick) {
        onNodeClick(nodeData)
      }
    })

    graphRef.current = graph

    const handleResize = () => {
      if (!containerRef.current || !graphRef.current) return
      graphRef.current.changeSize(containerRef.current.scrollWidth, height)
      graphRef.current.fitView()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      graph.destroy()
    }
  }, [nodes, edges, height, onNodeClick])

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-secondary-500"></span>
          <span className="text-gray-600">已掌握</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary-500"></span>
          <span className="text-gray-600">学习中</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          <span className="text-gray-600">未解锁</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="knowledge-graph-container border border-gray-200 rounded-xl"
        style={{ height }}
      />
    </div>
  )
}

export default KnowledgeGraph

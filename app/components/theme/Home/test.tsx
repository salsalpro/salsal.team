"use client"
// FlowDiagram.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type OnNodeDrag,
  type NodeProps,
  type Connection,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

// ============ TYPE DEFINITIONS ============

// Define the data structure for the main box node
type MainNodeData = {
  label: string;
  description: string;
  status: 'active' | 'inactive';
};

// Define the data structure for detail boxes (3 on each side = 6 total)
type DetailNodeData = {
  label: string;
  value: number;
  side: 'left' | 'right';
  position: 'top' | 'middle' | 'bottom';
};

// Create a union type for all possible nodes in your flow
// This enables type-safe narrowing in handlers
type AppNode = 
  | Node<MainNodeData, 'main'>
  | Node<DetailNodeData, 'detail'>;

// Edge type - custom data optional
type AppEdge = Edge<{ connectionType: 'main-to-detail' }>;

// ============ CUSTOM NODE COMPONENTS ============

// MAIN BOX COMPONENT (Center)
// This component renders the central box that connects to all 6 detail boxes
const MainNodeComponent = ({ data, selected }: NodeProps<AppNode>) => {
  // data is automatically typed as MainNodeData because we used type='main'
  return (
    <div
      style={{
        padding: '20px 30px',
        borderRadius: '12px',
        background: data.status === 'active' ? '#4caf50' : '#9e9e9e',
        color: 'white', 
        border: selected ? '3px solid #ff9800' : '3px solid #388e3c',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        minWidth: '150px',
        textAlign: 'center',
      }}
    >
      {/* Target handles on all 4 sides to receive connections */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top-target"
        style={{ background: '#ff9800' }}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="bottom-target"
        style={{ background: '#ff9800' }}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-target"
        style={{ background: '#ff9800' }}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="right-target"
        style={{ background: '#ff9800' }}
      />
      
      {/* Source handles - lines come OUT from these to detail boxes */}
      <Handle 
        type="source" 
        position={Position.Left} 
        id="to-left-top"
        style={{ background: '#2196f3', top: '25%' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="to-left-middle"
        style={{ background: '#2196f3', top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="to-left-bottom"
        style={{ background: '#2196f3', top: '75%' }}
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="to-right-top"
        style={{ background: '#2196f3', top: '25%' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="to-right-middle"
        style={{ background: '#2196f3', top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="to-right-bottom"
        style={{ background: '#2196f3', top: '75%' }}
      />
      
      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{data.label}</div>
      <div style={{ fontSize: '12px', marginTop: '8px' }}>{data.description}</div>
      <div style={{ fontSize: '10px', marginTop: '4px' }}>
        Status: {data.status}
      </div>
    </div>
  );
};

// DETAIL BOX COMPONENT (One of 6 peripheral boxes)
// This component renders each detail box that receives a line from the main box
const DetailNodeComponent = ({ data, selected }: NodeProps<AppNode>) => {
  // Type narrowing: TypeScript knows this node has DetailNodeData
  // Data will have label, value, side, and position properties
  
  // Determine position styles based on which side this box is on
  const isLeftSide = data.side === 'left';
  
  // Handles are placed on the side facing the main box
  const handlePosition = isLeftSide ? Position.Right : Position.Left;
  
  // Background color based on position (top/middle/bottom) for visual distinction
  const getBackgroundColor = () => {
    switch(data.position) {
      case 'top': return '#ff5722';
      case 'middle': return '#ff9800';
      case 'bottom': return '#ffc107';
      default: return '#ff9800';
    }
  };
  
  return (
    <div
      style={{
        padding: '15px 20px',
        borderRadius: '8px',
        background: getBackgroundColor(),
        color: 'white',
        border: selected ? '3px solid #fff' : '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '120px',
        textAlign: 'center',
      }}
    >
      {/* Handle to receive connection from main box */}
      {/* The 'nodrag' class prevents this handle from interfering with dragging */}
      <Handle 
        type="target" 
        position={handlePosition} 
        id="from-main"
        className="nodrag"
        style={{ background: '#fff', width: '10px', height: '10px' }}
      />
      
      <div style={{ fontWeight: 'bold' }}>{data.label}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>
        {data.value}
      </div>
      <div style={{ fontSize: '10px' }}>
        {data.side} · {data.position}
      </div>
    </div>
  );
};

// ============ MAIN FLOW COMPONENT ============

// Define all node types mapping - MUST be memoized for performance
const nodeTypes = {
  main: MainNodeComponent,
  detail: DetailNodeComponent,
};

// Define edge types if needed (custom edge styling)
const edgeTypes = {
  // You could add custom edge types here
};

interface FlowDiagramProps {
  // Props you can pass to customize the diagram
  onNodeClick?: (nodeId: string, nodeData: AppNode['data']) => void;
  initialMainStatus?: 'active' | 'inactive';
}

export const FlowDiagram: React.FC<FlowDiagramProps> = ({ 
  onNodeClick, 
  initialMainStatus = 'active' 
}) => {
  // ============ STATE MANAGEMENT ============
  
  // State for nodes - typed as AppNode array
  const [nodes, setNodes] = useState<AppNode[]>(() => [
    // MAIN BOX - Center node
    {
      id: 'main-node',
      type: 'main', // Matches key in nodeTypes object
      position: { x: 400, y: 300 }, // Center position
      data: {
        label: 'Main Controller',
        description: 'Central processing unit',
        status: initialMainStatus,
      },
    },
    // LEFT SIDE DETAIL BOXES (3 boxes)
    {
      id: 'left-top',
      type: 'detail',
      position: { x: 100, y: 150 },
      data: {
        label: 'Left Top Sensor',
        value: 42,
        side: 'left',
        position: 'top',
      },
    },
    {
      id: 'left-middle',
      type: 'detail',
      position: { x: 100, y: 300 },
      data: {
        label: 'Left Middle Sensor',
        value: 78,
        side: 'left',
        position: 'middle',
      },
    },
    {
      id: 'left-bottom',
      type: 'detail',
      position: { x: 100, y: 450 },
      data: {
        label: 'Left Bottom Sensor',
        value: 23,
        side: 'left',
        position: 'bottom',
      },
    },
    // RIGHT SIDE DETAIL BOXES (3 boxes)
    {
      id: 'right-top',
      type: 'detail',
      position: { x: 700, y: 150 },
      data: {
        label: 'Right Top Sensor',
        value: 67,
        side: 'right',
        position: 'top',
      },
    },
    {
      id: 'right-middle',
      type: 'detail',
      position: { x: 700, y: 300 },
      data: {
        label: 'Right Middle Sensor',
        value: 91,
        side: 'right',
        position: 'middle',
      },
    },
    {
      id: 'right-bottom',
      type: 'detail',
      position: { x: 700, y: 450 },
      data: {
        label: 'Right Bottom Sensor',
        value: 34,
        side: 'right',
        position: 'bottom',
      },
    },
  ]);
  
  // State for edges - lines connecting main box to each detail box
  const [edges, setEdges] = useState<AppEdge[]>([
    // Left side connections
    {
      id: 'edge-main-to-left-top',
      source: 'main-node',
      target: 'left-top',
      sourceHandle: 'to-left-top', // Which source handle on the main node to use
      targetHandle: 'from-main',    // Which target handle on the detail node to use
      type: 'smoothstep',           // Edge style: 'default', 'straight', 'step', 'smoothstep'
      animated: true,               // Animated line effect
      style: { stroke: '#2196f3', strokeWidth: 2 },
      data: { connectionType: 'main-to-detail' },
    },
    {
      id: 'edge-main-to-left-middle',
      source: 'main-node',
      target: 'left-middle',
      sourceHandle: 'to-left-middle',
      targetHandle: 'from-main',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#2196f3', strokeWidth: 2 },
      data: { connectionType: 'main-to-detail' },
    },
    {
      id: 'edge-main-to-left-bottom',
      source: 'main-node',
      target: 'left-bottom',
      sourceHandle: 'to-left-bottom',
      targetHandle: 'from-main',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#2196f3', strokeWidth: 2 },
      data: { connectionType: 'main-to-detail' },
    },
    // Right side connections
    {
      id: 'edge-main-to-right-top',
      source: 'main-node',
      target: 'right-top',
      sourceHandle: 'to-right-top',
      targetHandle: 'from-main',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4caf50', strokeWidth: 2 },
      data: { connectionType: 'main-to-detail' },
    },
    {
      id: 'edge-main-to-right-middle',
      source: 'main-node',
      target: 'right-middle',
      sourceHandle: 'to-right-middle',
      targetHandle: 'from-main',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4caf50', strokeWidth: 2 },
      data: { connectionType: 'main-to-detail' },
    },
    {
      id: 'edge-main-to-right-bottom',
      source: 'main-node',
      target: 'right-bottom',
      sourceHandle: 'to-right-bottom',
      targetHandle: 'from-main',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4caf50', strokeWidth: 2 },
      data: { connectionType: 'main-to-detail' },
    },
  ]);
  
  // ============ EVENT HANDLERS ============
  
  // Handler for node changes (position, selection, etc.)
  // The _ parameter: In TypeScript, we use _ to indicate a parameter is required by the type but we don't use it
  // OnNodeDrag expects two parameters: (event, node). We only need the node, so we name the first param _ (unused)
  const onNodeDrag: OnNodeDrag<AppNode> = useCallback((_, node) => {
    // The underscore _ represents the drag event - we ignore it because we only care about the node
    console.log(`Node ${node.id} dragged to position:`, node.position);
    
    // Type-safe narrowing - check the node type before accessing specific data
    if (node.type === 'main') {
      // TypeScript now knows this node.data has MainNodeData structure
      console.log('Main node status:', node.data.status);
    } else if (node.type === 'detail') {
      // TypeScript now knows this node.data has DetailNodeData structure
      console.log('Detail node value:', node.data.value, 'side:', node.data.side);
    }
  }, []);
  
  // Handler for node click events
  const onNodeClick = useCallback((_event: React.MouseEvent, node: AppNode) => {
    // _event: We ignore the DOM event parameter because we don't need it
    console.log(`Clicked node: ${node.id}`);
    
    // If parent component provided a callback, call it with the node data
    if (onNodeClick) {
      onNodeClick(node.id, node.data);
    }
  }, [onNodeClick]);
  
  // Handler for node changes (dragging, selecting, etc.)
  // applyNodeChanges is a helper that applies changes like position updates to your nodes array
  const onNodesChange: OnNodesChange<AppNode> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  // Handler for edge changes (adding, removing edges)
  const onEdgesChange: OnEdgesChange<AppEdge> = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  
  // Handler for new connections (when user drags from one handle to another)
  // The Connection type includes: source, sourceHandle, target, targetHandle
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      console.log('New connection attempted:', connection);
      
      // addEdge creates a new edge object with default properties
      // We spread the connection and add custom properties
      const newEdge: AppEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        animated: true,
        style: { stroke: '#ff9800', strokeWidth: 2 },
        data: { connectionType: 'main-to-detail' },
      } as AppEdge;
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );
  
  // ============ HELPER FUNCTIONS ============
  
  // Example function to update node data programmatically
  const updateDetailNodeValue = useCallback((nodeId: string, newValue: number) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === nodeId && node.type === 'detail') {
          // Type-safe update - we know this is a detail node
          return {
            ...node,
            data: { ...node.data, value: newValue },
          };
        }
        return node;
      })
    );
  }, []);
  
  // Example function to change main node status
  const toggleMainStatus = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === 'main-node' && node.type === 'main') {
          return {
            ...node,
            data: {
              ...node.data,
              status: node.data.status === 'active' ? 'inactive' : 'active',
            },
          };
        }
        return node;
      })
    );
  }, []);
  
  // ============ RENDER ============
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Control panel for interacting with the diagram */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        gap: '10px',
      }}>
        <button onClick={toggleMainStatus}>
          Toggle Main Status
        </button>
        <button onClick={() => updateDetailNodeValue('left-top', Math.floor(Math.random() * 100))}>
          Randomize Left Top
        </button>
      </div>
      
      <ReactFlow
        // Core data
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Event handlers
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        onNodeClick={onNodeClick}
        // Viewport settings
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        // Interaction settings
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        // Appearance
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2 },
        }}
      >
        {/* Background pattern - can be 'dots', 'lines', or 'none' */}
        <Background variant="dots" gap={20} size={1} color="#ccc" />
        
        {/* Zoom controls */}
        <Controls 
          showZoom 
          showFitView 
          showInteractive={false}
          position="bottom-right"
        />
        
        {/* Mini map for navigation */}
        <MiniMap 
          nodeColor={(node) => {
            // Type-safe node color mapping
            if (node.type === 'main') return '#4caf50';
            if (node.type === 'detail') return '#ff9800';
            return '#fff';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

// ============ WRAPPER COMPONENT ============
// Must wrap with ReactFlowProvider to use useReactFlow hook anywhere in children
export const AppTest: React.FC = () => {
  const handleNodeClick = (nodeId: string, nodeData: AppNode['data']) => {
    console.log(`Node clicked: ${nodeId}`, nodeData);
    // You can add your own logic here - open a modal, update state, etc.
  };
  
  return (
    <ReactFlowProvider>
      <FlowDiagram onNodeClick={handleNodeClick} initialMainStatus="active" />
    </ReactFlowProvider>
  );
};

export default AppTest;
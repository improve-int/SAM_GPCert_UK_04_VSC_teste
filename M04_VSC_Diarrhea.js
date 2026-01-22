// ============================================
// M04 VSC DIARRHEA - JAVASCRIPT
// Visual Synthesis Challenge: Acute vs Chronic Diarrhea
// ============================================

// ============================================
// HELPER FUNCTIONS - MUST BE FIRST
// ============================================

// Helper to query by data-role (fallback to legacy IDs)
function byRole(legacyId, role){
    const element = document.querySelector('[data-role="'+role+'"]') || document.getElementById(legacyId);
    if (!element) {
        console.warn('byRole: Element not found for role:', role, 'legacyId:', legacyId);
    }
    return element;
}

// Check if user is currently editing text
function isEditingText(e) {
    if (typeof mxGraphInstance !== 'undefined' && mxGraphInstance && typeof mxGraphInstance.isEditing === 'function' && mxGraphInstance.isEditing()) return true;
    const t = e && e.target;
    return !!(t && (t.isContentEditable || (t.closest && t.closest('.mxCellEditor')) || ['INPUT','TEXTAREA','SELECT'].includes(t.tagName)));
}

// ============================================
// DEVICE DETECTION AND ADAPTIVE UI
// ============================================

function detectDeviceAndAdaptUI() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768 && window.innerWidth > 480;
    
    console.log('Device detection:', { 
        isTouchDevice, 
        isMobile, 
        isTablet, 
        width: window.innerWidth 
    });
    
    document.body.classList.toggle('touch-device', isTouchDevice);
    document.body.classList.toggle('mobile-device', isMobile);
    document.body.classList.toggle('tablet-device', isTablet);
    
    const mobileWarning = document.querySelector('.mobile-warning');
    if (mobileWarning) {
        mobileWarning.style.display = isMobile ? 'block' : 'none';
    }
    
    if (isMobile) {
        console.warn('Mobile device detected - some features may be limited');
    }
}

window.addEventListener('load', detectDeviceAndAdaptUI);
window.addEventListener('resize', detectDeviceAndAdaptUI);

// ============================================
// LABEL & STYLE HELPERS
// ============================================

function normalizeVertexLabelStyles() {
    if (!mxGraphInstance) {
        console.warn('normalizeVertexLabelStyles: mxGraph not initialized');
        return;
    }
    
    const model = mxGraphInstance.getModel();
    const parent = mxGraphInstance.getDefaultParent();
    const cells = mxGraphInstance.getChildVertices(parent);
    
    if (!cells || !cells.length) {
        console.log('normalizeVertexLabelStyles: No cells found');
        return;
    }
    
    model.beginUpdate();
    try {
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            let s = model.getStyle(cell) || '';
            s = mxUtils.setStyle(s, 'labelPosition', 'center');
            s = mxUtils.setStyle(s, 'verticalLabelPosition', 'middle');
            s = mxUtils.setStyle(s, 'align', 'center');
            s = mxUtils.setStyle(s, 'verticalAlign', 'middle');
            s = mxUtils.setStyle(s, 'whiteSpace', 'wrap');
            s = mxUtils.setStyle(s, 'overflow', 'hidden');
            s = mxUtils.setStyle(s, 'spacing', '8');
            model.setStyle(cell, s);
        }
    } finally {
        model.endUpdate();
    }
}

function applyLabelCentering(vertex) {
    if (!mxGraphInstance || !vertex) return;
    const model = mxGraphInstance.getModel();
    
    let style = model.getStyle(vertex) || '';
    style = mxUtils.setStyle(style, 'labelPosition', 'center');
    style = mxUtils.setStyle(style, 'verticalLabelPosition', 'middle');
    style = mxUtils.setStyle(style, 'align', 'center');
    style = mxUtils.setStyle(style, 'verticalAlign', 'middle');
    style = mxUtils.setStyle(style, 'whiteSpace', 'wrap');
    style = mxUtils.setStyle(style, 'overflow', 'hidden');
    style = mxUtils.setStyle(style, 'spacing', '8');
    model.setStyle(vertex, style);
}

// ============================================
// GLOBAL VARIABLES
// ============================================

let currentTab = 0;
let sidebarOpen = false;
let mxGraphInstance = null;
let currentDiagramData = null;

const COMPARISON_BOX = { width: 600, height: 400 };

// Diarrhea-specific element configurations
const diarrheaElements = {
    'presentation': { 
        label: 'Dog with Diarrhea', 
        style: 'presentation-node', 
        width: 200, 
        height: 60 
    },
    'decision': { 
        label: 'Decision Point', 
        style: 'decision-node', 
        width: 180, 
        height: 100 
    },
    'pathway': { 
        label: 'Pathway', 
        style: 'pathway-node', 
        width: 180, 
        height: 60 
    },
    'diagnostic': { 
        label: 'Diagnostic Test', 
        style: 'diagnostic-node', 
        width: 200, 
        height: 80 
    },
    'treatment': { 
        label: 'Treatment', 
        style: 'treatment-node', 
        width: 200, 
        height: 80 
    },
    'outcome': { 
        label: 'Outcome', 
        style: 'outcome-node', 
        width: 200, 
        height: 60 
    }
};

// ============================================
// MXGRAPH INITIALIZATION
// ============================================

function initializeMxGraph() {
    if (!mxClient.isBrowserSupported()) {
        mxUtils.error('Browser not supported!', 200, false);
        return;
    }
    
    const container = byRole('mxgraph-container', 'graph-container');
    if (!container) {
        console.error('Container element not found');
        return;
    }
    
    mxGraphInstance = new mxGraph(container);
    
    // Enable key handler for delete
    const keyHandler = new mxKeyHandler(mxGraphInstance);
    keyHandler.bindKey(46, function(evt) {
        if (!isEditingText(evt) && mxGraphInstance.isEnabled()) {
            deleteSelected();
        }
    });
    
    // Enable panning with spacebar
    setupSpacebarPanning();
    
    // Configure graph settings
    mxGraphInstance.setPanning(true);
    mxGraphInstance.setConnectable(true);
    mxGraphInstance.setAllowDanglingEdges(false);
    mxGraphInstance.setDisconnectOnMove(false);
    mxGraphInstance.setHtmlLabels(true);
    mxGraphInstance.setEdgeLabelsMovable(false);
    mxGraphInstance.setVertexLabelsMovable(false);
    
    // Enable edge validation
    mxGraphInstance.setAllowLoops(false);
    mxGraphInstance.setMultigraph(false);
    
    // Setup custom styles
    setupCustomStyles();
    
    // Load template
    loadDiarrheaTemplate();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('mxGraph initialized successfully');
}

function setupSpacebarPanning() {
    const container = byRole('mxgraph-container', 'graph-container');
    if (!container) return;
    
    let spacePressed = false;
    let originalPanningEnabled = false;
    
    // Spacebar down
    document.addEventListener('keydown', function(e) {
        if (e.key === ' ' && !isEditingText(e) && mxGraphInstance && mxGraphInstance.isEnabled()) {
            if (!spacePressed) {
                e.preventDefault();
                spacePressed = true;
                originalPanningEnabled = mxGraphInstance.panningHandler.isPanningEnabled();
                mxGraphInstance.panningHandler.setPanningEnabled(true);
                container.style.cursor = 'grab';
            }
        }
    });
    
    // Spacebar up
    document.addEventListener('keyup', function(e) {
        if (e.key === ' ' && spacePressed) {
            e.preventDefault();
            spacePressed = false;
            if (mxGraphInstance) {
                mxGraphInstance.panningHandler.setPanningEnabled(originalPanningEnabled);
                container.style.cursor = 'default';
            }
        }
    });
    
    // Panning active
    mxEvent.addListener(container, 'mousedown', function(evt) {
        if (spacePressed && mxGraphInstance && !isEditingText(evt)) {
            container.classList.add('grabbing');
        }
    });
    
    mxEvent.addListener(container, 'mouseup', function() {
        container.classList.remove('grabbing');
        if (spacePressed) {
            container.style.cursor = 'grab';
        }
    });
}

function setupCustomStyles() {
    const stylesheet = mxGraphInstance.getStylesheet();
    
    // Presentation node style (blue)
    const presentationStyle = {
        [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_RECTANGLE,
        [mxConstants.STYLE_ROUNDED]: true,
        [mxConstants.STYLE_ARCSIZE]: 8,
        [mxConstants.STYLE_FILLCOLOR]: '#dae8fc',
        [mxConstants.STYLE_STROKECOLOR]: '#6c8ebf',
        [mxConstants.STYLE_STROKEWIDTH]: 2,
        [mxConstants.STYLE_FONTCOLOR]: '#000000',
        [mxConstants.STYLE_FONTSIZE]: 12,
        [mxConstants.STYLE_FONTSTYLE]: 1,
        [mxConstants.STYLE_FONTFAMILY]: 'Open Sans SemiCondensed, Open Sans, Arial, sans-serif'
    };
    stylesheet.putCellStyle('presentation-node', presentationStyle);
    
    // Decision point style (diamond, yellow)
    const decisionStyle = {
        [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_RHOMBUS,
        [mxConstants.STYLE_FILLCOLOR]: '#fff2cc',
        [mxConstants.STYLE_STROKECOLOR]: '#d6b656',
        [mxConstants.STYLE_STROKEWIDTH]: 2,
        [mxConstants.STYLE_FONTCOLOR]: '#000000',
        [mxConstants.STYLE_FONTSIZE]: 11,
        [mxConstants.STYLE_FONTFAMILY]: 'Open Sans SemiCondensed, Open Sans, Arial, sans-serif'
    };
    stylesheet.putCellStyle('decision-node', decisionStyle);
    
    // Pathway node style (green)
    const pathwayStyle = {
        [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_RECTANGLE,
        [mxConstants.STYLE_ROUNDED]: true,
        [mxConstants.STYLE_ARCSIZE]: 8,
        [mxConstants.STYLE_FILLCOLOR]: '#d5e8d4',
        [mxConstants.STYLE_STROKECOLOR]: '#82b366',
        [mxConstants.STYLE_STROKEWIDTH]: 2,
        [mxConstants.STYLE_FONTCOLOR]: '#000000',
        [mxConstants.STYLE_FONTSIZE]: 11,
        [mxConstants.STYLE_FONTFAMILY]: 'Open Sans SemiCondensed, Open Sans, Arial, sans-serif'
    };
    stylesheet.putCellStyle('pathway-node', pathwayStyle);
    
    // Diagnostic node style (pink/red)
    const diagnosticStyle = {
        [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_RECTANGLE,
        [mxConstants.STYLE_ROUNDED]: true,
        [mxConstants.STYLE_ARCSIZE]: 8,
        [mxConstants.STYLE_FILLCOLOR]: '#f8cecc',
        [mxConstants.STYLE_STROKECOLOR]: '#b85450',
        [mxConstants.STYLE_STROKEWIDTH]: 2,
        [mxConstants.STYLE_FONTCOLOR]: '#000000',
        [mxConstants.STYLE_FONTSIZE]: 10,
        [mxConstants.STYLE_FONTFAMILY]: 'Open Sans SemiCondensed, Open Sans, Arial, sans-serif'
    };
    stylesheet.putCellStyle('diagnostic-node', diagnosticStyle);
    
    // Treatment node style (purple)
    const treatmentStyle = {
        [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_RECTANGLE,
        [mxConstants.STYLE_ROUNDED]: true,
        [mxConstants.STYLE_ARCSIZE]: 8,
        [mxConstants.STYLE_FILLCOLOR]: '#f8cecc',
        [mxConstants.STYLE_STROKECOLOR]: '#b85450',
        [mxConstants.STYLE_STROKEWIDTH]: 2,
        [mxConstants.STYLE_FONTCOLOR]: '#000000',
        [mxConstants.STYLE_FONTSIZE]: 10,
        [mxConstants.STYLE_FONTFAMILY]: 'Open Sans SemiCondensed, Open Sans, Arial, sans-serif'
    };
    stylesheet.putCellStyle('treatment-node', treatmentStyle);
    
    // Outcome node style (purple, bold)
    const outcomeStyle = {
        [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_RECTANGLE,
        [mxConstants.STYLE_ROUNDED]: true,
        [mxConstants.STYLE_ARCSIZE]: 8,
        [mxConstants.STYLE_FILLCOLOR]: '#e1d5e7',
        [mxConstants.STYLE_STROKECOLOR]: '#9673a6',
        [mxConstants.STYLE_STROKEWIDTH]: 2,
        [mxConstants.STYLE_FONTCOLOR]: '#000000',
        [mxConstants.STYLE_FONTSIZE]: 11,
        [mxConstants.STYLE_FONTSTYLE]: 1,
        [mxConstants.STYLE_FONTFAMILY]: 'Open Sans SemiCondensed, Open Sans, Arial, sans-serif'
    };
    stylesheet.putCellStyle('outcome-node', outcomeStyle);
    
    // Configure orthogonal edge style
    const edgeStyle = stylesheet.getDefaultEdgeStyle();
    edgeStyle[mxConstants.STYLE_EDGE] = 'orthogonalEdgeStyle';
    edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC;
    edgeStyle[mxConstants.STYLE_STROKECOLOR] = '#666';
    edgeStyle[mxConstants.STYLE_STROKEWIDTH] = 2;
    edgeStyle[mxConstants.STYLE_ORTHOGONAL] = true;
    edgeStyle[mxConstants.STYLE_ROUNDED] = true;
    edgeStyle[mxConstants.STYLE_ARCSIZE] = 10;
    edgeStyle[mxConstants.STYLE_JETTY_SIZE] = 'auto';
}

function loadDiarrheaTemplate() {
    const model = mxGraphInstance.getModel();
    
    model.beginUpdate();
    try {
        const parent = mxGraphInstance.getDefaultParent();
        
        // Clear existing
        mxGraphInstance.removeCells(mxGraphInstance.getChildVertices(parent));
        
        // Create simplified template structure
        const presentation = mxGraphInstance.insertVertex(
            parent, 'n1', 'Dog with Diarrhea', 
            300, 20, 200, 60, 'presentation-node'
        );
        
        const duration = mxGraphInstance.insertVertex(
            parent, 'n2', 'Duration of\nclinical signs?', 
            320, 120, 180, 100, 'decision-node'
        );
        
        const acute = mxGraphInstance.insertVertex(
            parent, 'n3', 'Acute (< 3 weeks)', 
            100, 260, 180, 60, 'pathway-node'
        );
        
        const chronic = mxGraphInstance.insertVertex(
            parent, 'n4', 'Chronic (≥ 3 weeks)', 
            520, 260, 180, 60, 'pathway-node'
        );
        
        // Main connections
        mxGraphInstance.insertEdge(parent, 'e1', '', presentation, duration, 'edgeStyle=orthogonalEdgeStyle');
        mxGraphInstance.insertEdge(parent, 'e2', 'Acute', duration, acute, 'edgeStyle=orthogonalEdgeStyle');
        mxGraphInstance.insertEdge(parent, 'e3', 'Chronic', duration, chronic, 'edgeStyle=orthogonalEdgeStyle');
        
    } finally {
        model.endUpdate();
    }
    
    // Normalize labels and fit window
    setTimeout(() => {
        normalizeVertexLabelStyles();
        fitWindow();
    }, 150);
    
    updateDiagramData();
}

// ============================================
// NODE MANAGEMENT FUNCTIONS
// ============================================

function addNode(type) {
    const config = diarrheaElements[type];
    if (!config) {
        console.warn('Unknown node type:', type);
        return;
    }
    
    if (!mxGraphInstance) {
        console.error('Graph not initialized');
        return;
    }
    
    const container = byRole('mxgraph-container', 'graph-container');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    const view = mxGraphInstance.getView();
    const scale = view.scale;
    const translate = view.translate;
    
    // Calculate visible viewport center
    const containerRect = container.getBoundingClientRect();
    const centerX = (containerRect.width / 2 - translate.x * scale) / scale;
    const centerY = (containerRect.height / 2 - translate.y * scale) / scale;
    
    const parent = mxGraphInstance.getDefaultParent();
    const model = mxGraphInstance.getModel();
    
    model.beginUpdate();
    try {
        const vertex = mxGraphInstance.insertVertex(
            parent, 
            null, 
            config.label, 
            centerX - config.width / 2,
            centerY - config.height / 2,
            config.width, 
            config.height, 
            config.style
        );
        
        applyLabelCentering(vertex);
        mxGraphInstance.setSelectionCell(vertex);
        
    } finally {
        model.endUpdate();
    }
    
    updateDiagramData();
}

// ============================================
// TOOLBAR FUNCTIONS
// ============================================

function resetToTemplate() {
    if (confirm('Reset to the diarrhea management template? This will remove all your changes.')) {
        loadDiarrheaTemplate();
    }
}

function clearDiagram() {
    if (confirm('Clear all elements from the diagram?')) {
        const model = mxGraphInstance.getModel();
        model.beginUpdate();
        try {
            mxGraphInstance.removeCells(mxGraphInstance.getChildVertices(mxGraphInstance.getDefaultParent()));
        } finally {
            model.endUpdate();
        }
        updateDiagramData();
    }
}

function deleteSelected() {
    const cells = mxGraphInstance.getSelectionCells();
    if (cells && cells.length > 0) {
        mxGraphInstance.removeCells(cells);
        updateDiagramData();
    }
}

function zoomIn() {
    if (!mxGraphInstance) return;
    mxGraphInstance.zoomIn();
    setTimeout(() => {
        mxGraphInstance.view.validate();
    }, 10);
}

function zoomOut() {
    if (!mxGraphInstance) return;
    mxGraphInstance.zoomOut();
    setTimeout(() => {
        mxGraphInstance.view.validate();
    }, 10);
}

function fitWindow() {
    if (mxGraphInstance) {
        const bounds = mxGraphInstance.getGraphBounds();
        mxGraphInstance.fit();
        mxGraphInstance.center(true, true, 0.1);
    }
}

// ============================================
// DIAGRAM DATA MANAGEMENT
// ============================================

function updateDiagramData() {
    if (!mxGraphInstance) return;
    
    const model = mxGraphInstance.getModel();
    const parent = mxGraphInstance.getDefaultParent();
    
    const nodes = [];
    const edges = [];
    
    const childCount = model.getChildCount(parent);
    for (let i = 0; i < childCount; i++) {
        const cell = model.getChildAt(parent, i);
        
        if (model.isVertex(cell)) {
            nodes.push({
                id: cell.getId(),
                value: cell.getValue(),
                style: cell.getStyle(),
                geometry: cell.getGeometry()
            });
        } else if (model.isEdge(cell)) {
            edges.push({
                id: cell.getId(),
                source: cell.source ? cell.source.getId() : null,
                target: cell.target ? cell.target.getId() : null,
                value: cell.getValue()
            });
        }
    }
    
    currentDiagramData = { nodes, edges };
}

// ============================================
// COMPARISON FUNCTIONS
// ============================================

function showComparison() {
    const comparisonPanel = byRole('comparison', 'comparison-panel');
    const downloadSection = byRole('download-section', 'download-section');
    
    if (comparisonPanel) {
        comparisonPanel.classList.add('show');
    }
    
    if (downloadSection) {
        downloadSection.style.display = 'block';
    }
    
    // Update diagram data
    updateDiagramData();
    
    // Render student diagram
    const studentContainer = byRole('studentDiagramContainer', 'student-diagram');
    if (studentContainer && currentDiagramData) {
        studentContainer.innerHTML = '';
        const studentSVG = renderDiagram(currentDiagramData, 'student');
        studentContainer.appendChild(studentSVG);
    }
    
    // Render expert diagram
    const expertContainer = byRole('expertDiagramContainer', 'expert-diagram');
    if (expertContainer) {
        expertContainer.innerHTML = '';
        const expertDiagram = renderExpertDiagram();
        expertContainer.appendChild(expertDiagram);
    }
    
    showMessage('Comparison loaded successfully! Review your diagram against the expert reference.', 'success');
}

function renderExpertDiagram() {
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.padding = '20px';
    
    const img = document.createElement('img');
    img.src = 'VSC_Module4_Diarrhea_ExpertReference.png';
    img.alt = 'Expert Diarrhea Management Decision Map';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.border = 'none';
    img.style.borderRadius = '8px';
    
    img.onload = function() {
        container.style.opacity = '1';
    };
    
    img.onerror = function() {
        container.innerHTML = '<p style="color: #666;">Expert reference diagram not available</p>';
    };
    
    container.appendChild(img);
    return container;
}

function renderDiagram(diagramData, type) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '350');
    svg.setAttribute('viewBox', '0 0 500 350');
    svg.style.borderTop = '2px solid #017DFA';
    svg.style.borderRadius = '0px';
    svg.style.background = 'white';
    
    if (!diagramData || diagramData.nodes.length === 0) {
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', '250');
        text.setAttribute('y', '175');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'Open Sans, Arial, sans-serif');
        text.setAttribute('font-size', '14');
        text.setAttribute('fill', '#666');
        text.textContent = 'No diagram elements found';
        svg.appendChild(text);
        return svg;
    }
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    diagramData.nodes.forEach(node => {
        const g = node.geometry;
        if (g) {
            minX = Math.min(minX, g.x);
            minY = Math.min(minY, g.y);
            maxX = Math.max(maxX, g.x + g.width);
            maxY = Math.max(maxY, g.y + g.height);
        }
    });
    
    const diagramWidth = maxX - minX;
    const diagramHeight = maxY - minY;
    const scale = Math.min(480 / diagramWidth, 330 / diagramHeight, 1);
    const offsetX = (500 - diagramWidth * scale) / 2 - minX * scale;
    const offsetY = (350 - diagramHeight * scale) / 2 - minY * scale;
    
    // Create node map
    const nodeMap = new Map();
    diagramData.nodes.forEach(node => nodeMap.set(node.id, node));
    
    // Add arrow marker
    const defs = document.createElementNS(svgNS, 'defs');
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'arrowhead-' + type);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS(svgNS, 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#666');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
    
    // Render edges
    diagramData.edges.forEach(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        
        if (sourceNode && targetNode) {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', (sourceNode.geometry.x + sourceNode.geometry.width / 2) * scale + offsetX);
            line.setAttribute('y1', (sourceNode.geometry.y + sourceNode.geometry.height / 2) * scale + offsetY);
            line.setAttribute('x2', (targetNode.geometry.x + targetNode.geometry.width / 2) * scale + offsetX);
            line.setAttribute('y2', (targetNode.geometry.y + targetNode.geometry.height / 2) * scale + offsetY);
            line.setAttribute('stroke', '#666');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('marker-end', 'url(#arrowhead-' + type + ')');
            svg.appendChild(line);
        }
    });
    
    // Render nodes
    diagramData.nodes.forEach(node => {
        const x = node.geometry.x * scale + offsetX;
        const y = node.geometry.y * scale + offsetY;
        const width = node.geometry.width * scale;
        const height = node.geometry.height * scale;
        
        let shape;
        let fillColor = '#e3f2fd';
        let strokeColor = '#1976d2';
        
        // Determine colors based on style
        if (node.style) {
            if (node.style.includes('presentation')) {
                fillColor = '#dae8fc';
                strokeColor = '#6c8ebf';
            } else if (node.style.includes('decision')) {
                fillColor = '#fff2cc';
                strokeColor = '#d6b656';
            } else if (node.style.includes('pathway')) {
                fillColor = '#d5e8d4';
                strokeColor = '#82b366';
            } else if (node.style.includes('diagnostic') || node.style.includes('treatment')) {
                fillColor = '#f8cecc';
                strokeColor = '#b85450';
            } else if (node.style.includes('outcome')) {
                fillColor = '#e1d5e7';
                strokeColor = '#9673a6';
            }
        }
        
        // Create shape based on style
        if (node.style && node.style.includes('decision')) {
            shape = document.createElementNS(svgNS, 'polygon');
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const points = `${centerX},${y} ${x + width},${centerY} ${centerX},${y + height} ${x},${centerY}`;
            shape.setAttribute('points', points);
        } else {
            shape = document.createElementNS(svgNS, 'rect');
            shape.setAttribute('x', x);
            shape.setAttribute('y', y);
            shape.setAttribute('width', width);
            shape.setAttribute('height', height);
            shape.setAttribute('rx', '5');
        }
        
        shape.setAttribute('fill', fillColor);
        shape.setAttribute('stroke', strokeColor);
        shape.setAttribute('stroke-width', '2');
        svg.appendChild(shape);
        
        // Add text
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', y + height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-family', 'Open Sans, Arial, sans-serif');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#000');
        text.textContent = node.value || '';
        svg.appendChild(text);
    });
    
    return svg;
}

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================

function downloadMyDiagram() {
    showMessage('Download functionality coming soon', 'info');
}

function downloadExpertDiagram() {
    showMessage('Download functionality coming soon', 'info');
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function showMessage(text, type) {
    const messagesContainer = byRole('messages', 'messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
        <div class="message ${type}">
            <strong>${type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Info:'}</strong> ${text}
        </div>
    `;
    
    setTimeout(() => {
        messagesContainer.innerHTML = '';
    }, 5000);
}

function nextTab() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    currentTab = (currentTab + 1) % tabs.length;
    
    tabs.forEach((tab, index) => {
        if (index === currentTab) {
            tab.classList.add('active');
            tabContents[index].classList.add('active');
        } else {
            tab.classList.remove('active');
            tabContents[index].classList.remove('active');
        }
    });
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach((tab, index) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.querySelectorAll('.tab-content')[index].classList.add('active');
            
            currentTab = index;
        });
    });
    
    // Sidebar toggle
    const sidebarTrigger = byRole('sidebarTrigger', 'sidebar-trigger');
    const sidebar = byRole('sidebar', 'sidebar');
    const mainLayout = document.querySelector('.main-layout');
    
    if (sidebarTrigger && sidebar) {
        sidebarTrigger.addEventListener('click', () => {
            sidebarOpen = !sidebarOpen;
            sidebar.classList.toggle('open', sidebarOpen);
            sidebarTrigger.classList.toggle('active', sidebarOpen);
            
            if (mainLayout) {
                mainLayout.classList.toggle('sidebar-open', sidebarOpen);
            }
            
            document.body.classList.toggle('sidebar-active', sidebarOpen);
        });
    }
    
    // Delegate event listeners for buttons
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        const arg = target.dataset.arg;
        
        switch(action) {
            case 'nextTab':
                nextTab();
                break;
            case 'resetTemplate':
                resetToTemplate();
                break;
            case 'clearDiagram':
                clearDiagram();
                break;
            case 'zoomIn':
                zoomIn();
                break;
            case 'zoomOut':
                zoomOut();
                break;
            case 'fitWindow':
                fitWindow();
                break;
            case 'deleteSelected':
                deleteSelected();
                break;
            case 'showComparison':
                showComparison();
                break;
            case 'downloadMyDiagram':
                downloadMyDiagram();
                break;
            case 'downloadExpertDiagram':
                downloadExpertDiagram();
                break;
        }
    });
    
    // Delegate for palette buttons
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-add-node]');
        if (!target) return;
        
        const nodeType = target.dataset.addNode;
        addNode(nodeType);
    });
    
    // Model change listener
    if (mxGraphInstance) {
        mxGraphInstance.getModel().addListener(mxEvent.CHANGE, () => {
            updateDiagramData();
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing VSC Diarrhea...');
    
    // Check if mxClient is available
    if (typeof mxClient === 'undefined') {
        console.error('mxClient not loaded!');
        return;
    }
    
    // Initialize graph
    initializeMxGraph();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('VSC Diarrhea initialized successfully');
});

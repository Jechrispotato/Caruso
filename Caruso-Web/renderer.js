const canvas = document.getElementById('collage-canvas');
const ctx = canvas.getContext('2d');

let CANVAS_WIDTH = 1080;
let CANVAS_HEIGHT = 1350;
let layoutStyle = 'horizontal'; // 'horizontal' or 'vertical'

// State for top and bottom images
const topState = { img: null, x: 0, y: 0, scale: 1, baseScale: 1, rotation: 0, type: 'top' };
const bottomState = { img: null, x: 0, y: 0, scale: 1, baseScale: 1, rotation: 0, type: 'bottom' };

let isDragging = false;
let activeState = null;
let lastMouseX = 0;
let lastMouseY = 0;

function resetState(state, img, boxW, boxH) {
    state.img = img;
    const imgRatio = img.width / img.height;
    const boxRatio = boxW / boxH;
    
    if (imgRatio > boxRatio) {
        state.baseScale = boxH / img.height;
    } else {
        state.baseScale = boxW / img.width;
    }
    
    state.scale = state.baseScale;
    state.rotation = 0;
    state.x = 0;
    state.y = 0;
}

function drawCanvas(exportContext = null, scaleFactor = 1) {
    const targetCtx = exportContext || ctx;
    const w = CANVAS_WIDTH * scaleFactor;
    const h = CANVAS_HEIGHT * scaleFactor;

    // Clear canvas
    targetCtx.fillStyle = '#FFFFFF';
    targetCtx.fillRect(0, 0, w, h);
    
    if (layoutStyle === 'horizontal') {
        const halfH = (CANVAS_HEIGHT / 2) * scaleFactor;
        drawSection(targetCtx, topState, 0, 0, w, halfH, scaleFactor);
        drawSection(targetCtx, bottomState, 0, halfH, w, halfH, scaleFactor);
    } else {
        const halfW = (CANVAS_WIDTH / 2) * scaleFactor;
        drawSection(targetCtx, topState, 0, 0, halfW, h, scaleFactor);
        drawSection(targetCtx, bottomState, halfW, 0, halfW, h, scaleFactor);
    }
}

function drawSection(targetCtx, state, boxX, boxY, boxW, boxH, scaleFactor) {
    if (state.img) {
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.rect(boxX, boxY, boxW, boxH);
        targetCtx.clip();
        
        const renderW = state.img.width * state.scale * scaleFactor;
        const renderH = state.img.height * state.scale * scaleFactor;
        
        const centerX = boxX + (boxW / 2);
        const centerY = boxY + (boxH / 2);
        
        const transX = centerX + (state.x * scaleFactor);
        const transY = centerY + (state.y * scaleFactor);
        
        targetCtx.translate(transX, transY);
        targetCtx.rotate(state.rotation);
        
        targetCtx.drawImage(state.img, -renderW / 2, -renderH / 2, renderW, renderH);
        targetCtx.restore();
    } else {
        targetCtx.fillStyle = state.type === 'top' ? '#EEEEEE' : '#E0E0E0';
        targetCtx.fillRect(boxX, boxY, boxW, boxH);
    }
}

function setActiveState(state) {
    activeState = state;
}

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

function getTouchPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.touches[0].clientX - rect.left) * scaleX,
        y: (evt.touches[0].clientY - rect.top) * scaleY
    };
}

function getStateAtPos(pos) {
    if (layoutStyle === 'horizontal') {
        if (pos.y < CANVAS_HEIGHT / 2 && topState.img) return topState;
        if (pos.y >= CANVAS_HEIGHT / 2 && bottomState.img) return bottomState;
    } else {
        if (pos.x < CANVAS_WIDTH / 2 && topState.img) return topState;
        if (pos.x >= CANVAS_WIDTH / 2 && bottomState.img) return bottomState;
    }
    return null;
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    const targetState = getStateAtPos(pos);
    setActiveState(targetState);
    if (!targetState) return;
    
    isDragging = true;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeState) return;
    const pos = getMousePos(e);
    const dx = pos.x - lastMouseX;
    const dy = pos.y - lastMouseY;
    
    activeState.x += dx;
    activeState.y += dy;
    
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    drawCanvas();
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const pos = getTouchPos(e);
    const targetState = getStateAtPos(pos);
    setActiveState(targetState);
    if (!targetState) return;
    
    isDragging = true;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || !activeState) return;
    e.preventDefault(); 
    if (e.touches.length !== 1) return;
    const pos = getTouchPos(e);
    const dx = pos.x - lastMouseX;
    const dy = pos.y - lastMouseY;
    
    activeState.x += dx;
    activeState.y += dy;
    
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    drawCanvas();
}, { passive: false });

window.addEventListener('touchend', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); 
    const pos = getMousePos(e);
    const targetState = getStateAtPos(pos);
    setActiveState(targetState);
    
    if (!targetState) return;
    
    const zoomIntensity = 0.05;
    const zoomFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
    
    targetState.scale *= zoomFactor;
    if (targetState.scale < targetState.baseScale * 0.1) {
        targetState.scale = targetState.baseScale * 0.1;
    }
    
    drawCanvas();
}, { passive: false });

function handleUpload(inputId, buttonId, isTop) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    
    button.addEventListener('click', () => {
        input.click();
    });
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const boxW = layoutStyle === 'horizontal' ? CANVAS_WIDTH : CANVAS_WIDTH / 2;
                const boxH = layoutStyle === 'horizontal' ? CANVAS_HEIGHT / 2 : CANVAS_HEIGHT;
                
                if (isTop) {
                    resetState(topState, img, boxW, boxH);
                    setActiveState(topState);
                } else {
                    resetState(bottomState, img, boxW, boxH);
                    setActiveState(bottomState);
                }
                drawCanvas();
                button.style.opacity = '0';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

handleUpload('file-top', 'upload-top', true);
handleUpload('file-bottom', 'upload-bottom', false);

// Settings UI Controls
document.getElementById('btn-canvas').addEventListener('click', () => {
    const menu = document.getElementById('canvas-size-menu');
    menu.style.display = menu.style.display === 'none' || menu.style.display === '' ? 'flex' : 'none';
});

document.querySelectorAll('.size-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
        document.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        
        const parts = e.target.getAttribute('data-size').split('x');
        CANVAS_WIDTH = parseInt(parts[0]);
        CANVAS_HEIGHT = parseInt(parts[1]);
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        
        const wrapper = document.querySelector('.canvas-wrapper');
        wrapper.style.aspectRatio = `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`;
        
        const boxW = layoutStyle === 'horizontal' ? CANVAS_WIDTH : CANVAS_WIDTH / 2;
        const boxH = layoutStyle === 'horizontal' ? CANVAS_HEIGHT / 2 : CANVAS_HEIGHT;
        
        if (topState.img) resetState(topState, topState.img, boxW, boxH);
        if (bottomState.img) resetState(bottomState, bottomState.img, boxW, boxH);
        
        drawCanvas();
        document.getElementById('canvas-size-menu').style.display = 'none';
    });
});

function updateLayout(style) {
    layoutStyle = style;
    
    const boxW = layoutStyle === 'horizontal' ? CANVAS_WIDTH : CANVAS_WIDTH / 2;
    const boxH = layoutStyle === 'horizontal' ? CANVAS_HEIGHT / 2 : CANVAS_HEIGHT;
    
    if (topState.img) resetState(topState, topState.img, boxW, boxH);
    if (bottomState.img) resetState(bottomState, bottomState.img, boxW, boxH);
    
    if (activeState) setActiveState(activeState);
    
    const uploadButtons = document.querySelector('.upload-buttons');
    if (layoutStyle === 'horizontal') {
        uploadButtons.style.flexDirection = 'column';
    } else {
        uploadButtons.style.flexDirection = 'row';
    }
    
    drawCanvas();
}

document.getElementById('btn-layout-h').addEventListener('click', () => updateLayout('horizontal'));
document.getElementById('btn-layout-v').addEventListener('click', () => updateLayout('vertical'));

// Edit button toggle
document.getElementById('btn-edit').addEventListener('click', () => {
    const pan = document.getElementById('edit-controls-pan');
    const vert = document.getElementById('edit-controls-vertical');
    const editBtnImg = document.querySelector('#btn-edit img');
    const wrapper = document.getElementById('canvas-area-wrapper');
    
    if (pan.style.opacity === '0' || pan.style.opacity === '') {
        pan.style.opacity = '1';
        pan.style.pointerEvents = 'auto';
        vert.style.opacity = '1';
        vert.style.pointerEvents = 'auto';
        wrapper.classList.add('editing');
        // Add purple tint to Edit icon
        editBtnImg.style.filter = 'invert(20%) sepia(80%) saturate(4000%) hue-rotate(260deg)';
    } else {
        pan.style.opacity = '0';
        pan.style.pointerEvents = 'none';
        vert.style.opacity = '0';
        vert.style.pointerEvents = 'none';
        wrapper.classList.remove('editing');
        editBtnImg.style.filter = '';
    }
});

// Image UI Controls
document.getElementById('btn-scale-up').addEventListener('click', () => {
    if (activeState) { activeState.scale *= 1.1; drawCanvas(); }
});
document.getElementById('btn-scale-down').addEventListener('click', () => {
    if (activeState) { activeState.scale *= 0.9; drawCanvas(); }
});
document.getElementById('btn-rotate-left').addEventListener('click', () => {
    if (activeState) { activeState.rotation -= Math.PI / 12; drawCanvas(); } // 15 degrees
});
document.getElementById('btn-rotate-right').addEventListener('click', () => {
    if (activeState) { activeState.rotation += Math.PI / 12; drawCanvas(); }
});

const MOVE_STEP = 20;
document.getElementById('btn-move-up').addEventListener('click', () => {
    if (activeState) { activeState.y -= MOVE_STEP; drawCanvas(); }
});
document.getElementById('btn-move-down').addEventListener('click', () => {
    if (activeState) { activeState.y += MOVE_STEP; drawCanvas(); }
});
document.getElementById('btn-move-left').addEventListener('click', () => {
    if (activeState) { activeState.x -= MOVE_STEP; drawCanvas(); }
});
document.getElementById('btn-move-right').addEventListener('click', () => {
    if (activeState) { activeState.x += MOVE_STEP; drawCanvas(); }
});

// Handle export
document.getElementById('btn-export').addEventListener('click', async () => {
    if (!topState.img && !bottomState.img) {
        alert('Please add at least one photo before exporting.');
        return;
    }
    
    let resolutionScale = 1;
    const exportSelect = document.getElementById('export-resolution');
    if (exportSelect) {
        resolutionScale = parseFloat(exportSelect.value);
    }
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH * resolutionScale;
    exportCanvas.height = CANVAS_HEIGHT * resolutionScale;
    const exportCtx = exportCanvas.getContext('2d');
    
    drawCanvas(exportCtx, resolutionScale);
    
    const dataURL = exportCanvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = 'Caruso.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const btn = document.getElementById('btn-export');
    const originalText = btn.textContent;
    btn.textContent = 'Saved!';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
});

// Setup Initial Canvas Aspect Ratio
document.querySelector('.canvas-wrapper').style.aspectRatio = `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`;
drawCanvas();

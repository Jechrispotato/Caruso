const canvas = document.getElementById('collage-canvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const HALF_HEIGHT = CANVAS_HEIGHT / 2; // 675

// State for top and bottom images
const topState = { img: null, x: 0, y: 0, scale: 1, baseScale: 1, type: 'top' };
const bottomState = { img: null, x: 0, y: 0, scale: 1, baseScale: 1, type: 'bottom' };

let isDragging = false;
let activeState = null;
let lastMouseX = 0;
let lastMouseY = 0;

function resetState(state, img, w, h) {
    state.img = img;
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    
    if (imgRatio > boxRatio) {
        state.baseScale = h / img.height;
    } else {
        state.baseScale = w / img.width;
    }
    
    state.scale = state.baseScale;
    state.x = w / 2; // center
    state.y = h / 2; // center
}

// Initial Draw
function drawCanvas(exportContext = null, scaleFactor = 1) {
    const targetCtx = exportContext || ctx;
    const w = CANVAS_WIDTH * scaleFactor;
    const h = CANVAS_HEIGHT * scaleFactor;
    const halfH = HALF_HEIGHT * scaleFactor;

    // Clear canvas
    targetCtx.fillStyle = '#FFFFFF';
    targetCtx.fillRect(0, 0, w, h);
    
    // Draw top image
    drawSection(targetCtx, topState, 0, 0, w, halfH, scaleFactor, 'Top Photo (1080 x 675)');
    
    // Draw bottom image
    drawSection(targetCtx, bottomState, 0, halfH, w, halfH, scaleFactor, 'Bottom Photo (1080 x 675)');
    
    // Draw flat separator line (black)
    targetCtx.beginPath();
    targetCtx.moveTo(0, halfH);
    targetCtx.lineTo(w, halfH);
    targetCtx.lineWidth = 4 * scaleFactor;
    targetCtx.strokeStyle = '#000000';
    targetCtx.stroke();
}

function drawSection(targetCtx, state, boxX, boxY, boxW, boxH, scaleFactor, placeholderText) {
    if (state.img) {
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.rect(boxX, boxY, boxW, boxH);
        targetCtx.clip();
        
        const renderW = state.img.width * state.scale * scaleFactor;
        const renderH = state.img.height * state.scale * scaleFactor;
        
        // Calculate the draw position based on the center point (state.x, state.y are relative to the section's center)
        const drawX = boxX + (state.x * scaleFactor) - (renderW / 2);
        const drawY = boxY + (state.y * scaleFactor) - (renderH / 2);
        
        targetCtx.drawImage(state.img, drawX, drawY, renderW, renderH);
        targetCtx.restore();
    } else {
        targetCtx.fillStyle = state.type === 'top' ? '#EEEEEE' : '#E0E0E0';
        targetCtx.fillRect(boxX, boxY, boxW, boxH);
    }
}

// Mouse interaction handling
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    if (pos.y < HALF_HEIGHT && topState.img) {
        activeState = topState;
    } else if (pos.y >= HALF_HEIGHT && bottomState.img) {
        activeState = bottomState;
    } else {
        return;
    }
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
    activeState = null;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // Prevent page scrolling
    const pos = getMousePos(e);
    let targetState = null;
    if (pos.y < HALF_HEIGHT && topState.img) {
        targetState = topState;
    } else if (pos.y >= HALF_HEIGHT && bottomState.img) {
        targetState = bottomState;
    }
    
    if (!targetState) return;
    
    const zoomIntensity = 0.05;
    const zoomFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
    
    targetState.scale *= zoomFactor;
    
    // Prevent zooming out too much (smaller than min coverage baseScale)
    if (targetState.scale < targetState.baseScale * 0.1) {
        targetState.scale = targetState.baseScale * 0.1; // allow zooming out to 10%
    }
    
    drawCanvas();
}, { passive: false });

// Handle file uploads
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
                if (isTop) {
                    resetState(topState, img, CANVAS_WIDTH, HALF_HEIGHT);
                } else {
                    resetState(bottomState, img, CANVAS_WIDTH, HALF_HEIGHT);
                }
                drawCanvas();
                button.style.opacity = '0'; // Hide the button but keep it clickable
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

handleUpload('file-top', 'upload-top', true);
handleUpload('file-bottom', 'upload-bottom', false);

// Handle export
document.getElementById('btn-export').addEventListener('click', async () => {
    if (!topState.img && !bottomState.img) {
        alert('Please add at least one photo before exporting.');
        return;
    }
    
    const resolutionScale = parseFloat(document.getElementById('export-resolution').value);
    
    // Create an offscreen canvas for high-res export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH * resolutionScale;
    exportCanvas.height = CANVAS_HEIGHT * resolutionScale;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Draw at the new scale
    drawCanvas(exportCtx, resolutionScale);
    
    // Get image data as base64 string
    const dataURL = exportCanvas.toDataURL('image/png');
    
    // Create standard web download
    const link = document.createElement('a');
    link.download = 'Caruso.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Flat success state
    const btn = document.getElementById('btn-export');
    const originalText = btn.textContent;
    btn.textContent = 'Saved!';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
});

// Initial draw call
drawCanvas();

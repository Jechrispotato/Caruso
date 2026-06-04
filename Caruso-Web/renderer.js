const canvas = document.getElementById('collage-canvas');
const ctx = canvas.getContext('2d');

let CANVAS_WIDTH = 1080;
let CANVAS_HEIGHT = 1350;
let layoutStyle = 'horizontal'; // 'horizontal' or 'vertical'

// State for top and bottom images
const topState = { img: null, x: 0, y: 0, scale: 1, baseScale: 1, rotation: 0, type: 'top', isVideo: false };
const bottomState = { img: null, x: 0, y: 0, scale: 1, baseScale: 1, rotation: 0, type: 'bottom', isVideo: false };
const paletteState = { active: false, colors: [], x: 0, y: 0, width: 0, height: 0, scale: 1, baseScale: 1, type: 'palette', pickingBlockIndex: -1 };
const captionsState = { active: false, top: { text: '', color: '#FFD700' }, bottom: { text: '', color: '#FFD700' } };

let isDragging = false;
let activeState = null;
let editingCaptionKey = null;
let lastMouseX = 0;
let lastMouseY = 0;
let dragStartX = 0;
let dragStartY = 0;

let isEditMode = false;
let lastTapTime = 0;
let lastTapState = null;

let animationFrameId = null;

function startRenderLoop() {
    if (!animationFrameId) {
        function loop() {
            drawCanvas();
            animationFrameId = requestAnimationFrame(loop);
        }
        loop();
    }
}

function stopRenderLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resetState(state, img, boxW, boxH, isVideo = false) {
    state.img = img;
    state.isVideo = isVideo;
    const sourceW = isVideo ? img.videoWidth : img.width;
    const sourceH = isVideo ? img.videoHeight : img.height;
    
    const imgRatio = sourceW / sourceH;
    const boxRatio = boxW / boxH;
    
    if (imgRatio > boxRatio) {
        state.baseScale = boxH / sourceH;
    } else {
        state.baseScale = boxW / sourceW;
    }
    
    state.scale = state.baseScale;
    state.rotation = 0;
    state.x = 0;
    state.y = 0;
}

function drawCanvas(exportContext = null, scaleFactor = 1, skipPalette = false) {
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
    
    if (paletteState.active && !skipPalette) {
        drawPalette(targetCtx, scaleFactor);
    }
    
    if (captionsState.active && !skipPalette) {
        drawCaptions(targetCtx, scaleFactor);
    }
}

function drawCaptions(ctx, scaleFactor) {
    if (!captionsState.active) return;
    
    ctx.save();
    ctx.font = `500 ${24 * scaleFactor}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const w = CANVAS_WIDTH * scaleFactor;
    const h = CANVAS_HEIGHT * scaleFactor;
    
    let topX, topY, bottomX, bottomY;
    if (layoutStyle === 'horizontal') {
        topX = w / 2;
        topY = h / 2 - 40 * scaleFactor;
        bottomX = w / 2;
        bottomY = h - 40 * scaleFactor;
    } else {
        topX = w / 4;
        topY = h - 40 * scaleFactor;
        bottomX = (w / 4) * 3;
        bottomY = h - 40 * scaleFactor;
    }
    
    if (captionsState.top.text) {
        ctx.fillStyle = captionsState.top.color;
        ctx.fillText(captionsState.top.text, topX, topY);
    }
    
    if (captionsState.bottom.text) {
        ctx.fillStyle = captionsState.bottom.color;
        ctx.fillText(captionsState.bottom.text, bottomX, bottomY);
    }
    
    ctx.restore();
}

function drawPalette(ctx, scaleFactor) {
    const { x, y, width, height, colors, scale, pickingBlockIndex } = paletteState;
    if (colors.length === 0) return;
    
    const sWidth = width * scale;
    const sHeight = height * scale;
    const blockHeight = sHeight / colors.length;
    
    ctx.save();
    for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        const bx = x * scaleFactor;
        const by = (y + i * blockHeight) * scaleFactor;
        const bw = sWidth * scaleFactor;
        const bh = blockHeight * scaleFactor;
        
        ctx.fillRect(bx, by, bw, bh);
        
        if (i === pickingBlockIndex) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4 * scaleFactor;
            ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1 * scaleFactor;
            ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
        }
    }
    ctx.restore();
}

function drawSection(targetCtx, state, boxX, boxY, boxW, boxH, scaleFactor) {
    if (state.img) {
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.rect(boxX, boxY, boxW, boxH);
        targetCtx.clip();
        
        const sourceW = state.isVideo ? state.img.videoWidth : state.img.width;
        const sourceH = state.isVideo ? state.img.videoHeight : state.img.height;
        
        const renderW = sourceW * state.scale * scaleFactor;
        const renderH = sourceH * state.scale * scaleFactor;
        
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
    if (paletteState.active && 
        pos.x >= paletteState.x && pos.x <= paletteState.x + (paletteState.width * paletteState.scale) &&
        pos.y >= paletteState.y && pos.y <= paletteState.y + (paletteState.height * paletteState.scale)) {
        return paletteState;
    }

    if (layoutStyle === 'horizontal') {
        if (pos.y < CANVAS_HEIGHT / 2 && topState.img) return topState;
        if (pos.y >= CANVAS_HEIGHT / 2 && bottomState.img) return bottomState;
    } else {
        if (pos.x < CANVAS_WIDTH / 2 && topState.img) return topState;
        if (pos.x >= CANVAS_WIDTH / 2 && bottomState.img) return bottomState;
    }
    return null;
}

function checkCaptionClick(pos) {
    if (!captionsState.active) return false;
    
    const isAddonsVisible = document.getElementById('addons-toolbar').style.display === 'flex';
    if (!isAddonsVisible) return false;
    
    ctx.save();
    ctx.font = '500 24px Inter, sans-serif';
    
    let topX, topY, bottomX, bottomY;
    if (layoutStyle === 'horizontal') {
        topX = CANVAS_WIDTH / 2;
        topY = CANVAS_HEIGHT / 2 - 40;
        bottomX = CANVAS_WIDTH / 2;
        bottomY = CANVAS_HEIGHT - 40;
    } else {
        topX = CANVAS_WIDTH / 4;
        topY = CANVAS_HEIGHT - 40;
        bottomX = (CANVAS_WIDTH / 4) * 3;
        bottomY = CANVAS_HEIGHT - 40;
    }
    
    const hitPadding = 30;
    let clicked = null;
    
    if (captionsState.top.text) {
        const topMetrics = ctx.measureText(captionsState.top.text);
        if (pos.x >= topX - topMetrics.width / 2 - hitPadding &&
            pos.x <= topX + topMetrics.width / 2 + hitPadding &&
            pos.y >= topY - 20 - hitPadding &&
            pos.y <= topY + 20 + hitPadding) {
            clicked = 'top';
        }
    }
    
    if (!clicked && captionsState.bottom.text) {
        const bottomMetrics = ctx.measureText(captionsState.bottom.text);
        if (pos.x >= bottomX - bottomMetrics.width / 2 - hitPadding &&
            pos.x <= bottomX + bottomMetrics.width / 2 + hitPadding &&
            pos.y >= bottomY - 20 - hitPadding &&
            pos.y <= bottomY + 20 + hitPadding) {
            clicked = 'bottom';
        }
    }
    
    ctx.restore();
    
    if (clicked) {
        editingCaptionKey = clicked;
        const modal = document.getElementById('caption-modal');
        const input = document.getElementById('caption-input');
        input.value = captionsState[clicked].text === '[Insert caption text here]' ? '' : captionsState[clicked].text;
        modal.style.display = 'flex';
        input.focus();
        return true;
    }
    return false;
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    
    if (checkCaptionClick(pos)) {
        return;
    }
    
    const targetState = getStateAtPos(pos);
    
    if (paletteState.active && paletteState.pickingBlockIndex !== -1) {
        if (targetState !== paletteState) {
            try {
                const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
                const r = pixel[0], g = pixel[1], b = pixel[2];
                paletteState.colors[paletteState.pickingBlockIndex] = `rgb(${r}, ${g}, ${b})`;
                paletteState.pickingBlockIndex = -1;
                drawCanvas();
            } catch (err) {
                console.error("Color pick failed", err);
                paletteState.pickingBlockIndex = -1;
                drawCanvas();
            }
            return;
        }
    }
    
    if (!isEditMode) return;
    
    setActiveState(targetState);
    if (!targetState) return;
    
    isDragging = true;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    dragStartX = pos.x;
    dragStartY = pos.y;
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

window.addEventListener('mouseup', (e) => {
    isDragging = false;
    
    // Check for click without dragging to open color picker
    if (activeState === paletteState && isEditMode) {
        const dist = Math.hypot(lastMouseX - dragStartX, lastMouseY - dragStartY);
        if (dist < 5) {
            handlePaletteClick(dragStartX, dragStartY);
        }
    }
});

function handlePaletteClick(x, y) {
    const scaledWidth = paletteState.width * paletteState.scale;
    const scaledHeight = paletteState.height * paletteState.scale;
    const blockHeight = scaledHeight / paletteState.colors.length;
    
    const blockIndex = Math.floor((y - paletteState.y) / blockHeight);
    
    if (blockIndex >= 0 && blockIndex < paletteState.colors.length) {
        if (paletteState.pickingBlockIndex === blockIndex) {
            paletteState.pickingBlockIndex = -1;
        } else {
            paletteState.pickingBlockIndex = blockIndex;
        }
        drawCanvas();
    }
}

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const pos = getTouchPos(e);
    
    if (checkCaptionClick(pos)) {
        e.preventDefault();
        return;
    }
    
    const targetState = getStateAtPos(pos);
    
    if (paletteState.active && paletteState.pickingBlockIndex !== -1) {
        if (targetState !== paletteState) {
            try {
                const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
                const r = pixel[0], g = pixel[1], b = pixel[2];
                paletteState.colors[paletteState.pickingBlockIndex] = `rgb(${r}, ${g}, ${b})`;
                paletteState.pickingBlockIndex = -1;
                drawCanvas();
            } catch (err) {
                console.error("Color pick failed", err);
                paletteState.pickingBlockIndex = -1;
                drawCanvas();
            }
            return;
        }
    }
    
    if (!isEditMode) return;
    
    setActiveState(targetState);
    if (!targetState) return;
    
    isDragging = true;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    dragStartX = pos.x;
    dragStartY = pos.y;
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

window.addEventListener('touchend', (e) => {
    isDragging = false;
    
    if (activeState === paletteState && isEditMode) {
        const dist = Math.hypot(lastMouseX - dragStartX, lastMouseY - dragStartY);
        if (dist < 5) {
            handlePaletteClick(dragStartX, dragStartY);
        }
    }
});

canvas.addEventListener('wheel', (e) => {
    if (!isEditMode) return;
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
        
        const isVideo = file.type.startsWith('video/');
        const boxW = layoutStyle === 'horizontal' ? CANVAS_WIDTH : CANVAS_WIDTH / 2;
        const boxH = layoutStyle === 'horizontal' ? CANVAS_HEIGHT / 2 : CANVAS_HEIGHT;
        
        if (isVideo) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.onloadedmetadata = () => {
                video.play();
                const state = isTop ? topState : bottomState;
                resetState(state, video, boxW, boxH, true);
                setActiveState(state);
                button.style.opacity = '0';
                startRenderLoop();
            };
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const state = isTop ? topState : bottomState;
                    resetState(state, img, boxW, boxH, false);
                    setActiveState(state);
                    drawCanvas();
                    button.style.opacity = '0';
                    if (!topState.isVideo && !bottomState.isVideo) stopRenderLoop();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
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
        
        if (topState.img) resetState(topState, topState.img, boxW, boxH, topState.isVideo);
        if (bottomState.img) resetState(bottomState, bottomState.img, boxW, boxH, bottomState.isVideo);
        
        drawCanvas();
        document.getElementById('canvas-size-menu').style.display = 'none';
    });
});

function updateLayout(style) {
    layoutStyle = style;
    
    const boxW = layoutStyle === 'horizontal' ? CANVAS_WIDTH : CANVAS_WIDTH / 2;
    const boxH = layoutStyle === 'horizontal' ? CANVAS_HEIGHT / 2 : CANVAS_HEIGHT;
    
    if (topState.img) resetState(topState, topState.img, boxW, boxH, topState.isVideo);
    if (bottomState.img) resetState(bottomState, bottomState.img, boxW, boxH, bottomState.isVideo);
    
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
        isEditMode = true;
        // Add purple tint to Edit icon
        editBtnImg.style.filter = 'invert(20%) sepia(80%) saturate(4000%) hue-rotate(260deg)';
    } else {
        pan.style.opacity = '0';
        pan.style.pointerEvents = 'none';
        vert.style.opacity = '0';
        vert.style.pointerEvents = 'none';
        wrapper.classList.remove('editing');
        isEditMode = false;
        editBtnImg.style.filter = '';
    }
});

function generatePaletteColors() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_WIDTH;
    tempCanvas.height = CANVAS_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    drawCanvas(tempCtx, 1, true);
    
    const colors = [];
    try {
        const imageData = tempCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
        const totalPixels = CANVAS_WIDTH * CANVAS_HEIGHT;
        
        for (let i = 0; i < 6; i++) {
            let r, g, b, a;
            let attempts = 0;
            do {
                const randomPixelIndex = Math.floor(Math.random() * totalPixels);
                const index = randomPixelIndex * 4;
                r = imageData[index];
                g = imageData[index + 1];
                b = imageData[index + 2];
                a = imageData[index + 3];
                attempts++;
            } while ((a < 255 || (r>240 && g>240 && b>240) || (r<15 && g<15 && b<15)) && attempts < 50);
            
            colors.push(`rgb(${r}, ${g}, ${b})`);
        }
    } catch (e) {
        colors.push('#A8B0A0', '#401860', '#302888', '#803850', '#A8B0E0', '#681830');
    }
    return colors;
}

document.getElementById('btn-addons').addEventListener('click', () => {
    document.getElementById('main-toolbar').style.display = 'none';
    document.getElementById('addons-toolbar').style.display = 'flex';
});

document.getElementById('btn-addons-back').addEventListener('click', () => {
    document.getElementById('addons-toolbar').style.display = 'none';
    document.getElementById('main-toolbar').style.display = 'flex';
});

document.getElementById('btn-caption').addEventListener('click', () => {
    captionsState.active = !captionsState.active;
    if (captionsState.active) {
        captionsState.top.text = '[Insert caption text here]';
        captionsState.bottom.text = '[Insert caption text here]';
    }
    drawCanvas();
});

document.getElementById('btn-cancel-caption').addEventListener('click', () => {
    document.getElementById('caption-modal').style.display = 'none';
    editingCaptionKey = null;
});

document.getElementById('btn-save-caption').addEventListener('click', () => {
    if (editingCaptionKey) {
        const newText = document.getElementById('caption-input').value.trim();
        captionsState[editingCaptionKey].text = newText;
        drawCanvas();
    }
    document.getElementById('caption-modal').style.display = 'none';
    editingCaptionKey = null;
});

document.getElementById('btn-palette').addEventListener('click', () => {
    paletteState.active = !paletteState.active;
    
    if (paletteState.active) {
        paletteState.colors = generatePaletteColors();
        
        // Base position: right edge of the bottom half (or equivalent)
        const pWidth = CANVAS_WIDTH * 0.1; // ~10% width
        let pHeight, pX, pY;
        
        if (layoutStyle === 'horizontal') {
            pHeight = CANVAS_HEIGHT / 2;
            pX = CANVAS_WIDTH - pWidth;
            pY = CANVAS_HEIGHT / 2;
        } else {
            pHeight = CANVAS_HEIGHT;
            pX = CANVAS_WIDTH - pWidth;
            pY = 0;
        }
        
        paletteState.width = pWidth;
        paletteState.height = pHeight;
        paletteState.x = pX;
        paletteState.y = pY;
    }
    
    drawCanvas();
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
document.getElementById('btn-change-photo').addEventListener('click', () => {
    if (!activeState || activeState === paletteState) {
        alert("Please select a photo section first by clicking on it.");
        return;
    }
    const inputId = activeState.type === 'top' ? 'file-top' : 'file-bottom';
    document.getElementById(inputId).click();
});

// Handle export
document.getElementById('btn-export').addEventListener('click', async () => {
    if (!topState.img && !bottomState.img) {
        alert('Please add at least one photo or video before exporting.');
        return;
    }
    
    const btn = document.getElementById('btn-export');
    const originalContent = btn.innerHTML;
    
    // Video export
    if (topState.isVideo || bottomState.isVideo) {
        btn.innerHTML = '<span style="color:white; font-family: Inter, sans-serif; font-size: 14px;">Recording...</span>';
        
        const stream = canvas.captureStream(30);
        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = mimeType === 'video/mp4' ? 'mp4' : 'webm';
            a.download = `Caruso_Collage.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            btn.innerHTML = '<span style="color:white; font-family: Inter, sans-serif; font-size: 14px;">Saved!</span>';
            setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
        };
        
        mediaRecorder.start();
        setTimeout(() => {
            mediaRecorder.stop();
        }, 4000); // 4-second recording
        return;
    }
    
    // Image export
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
    link.download = 'Caruso_Collage.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    btn.innerHTML = '<span style="color:white; font-family: Inter, sans-serif; font-size: 14px;">Saved!</span>';
    setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
});

// Setup Initial Canvas Aspect Ratio
document.querySelector('.canvas-wrapper').style.aspectRatio = `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`;
drawCanvas();

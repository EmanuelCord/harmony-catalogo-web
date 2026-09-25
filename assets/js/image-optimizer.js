const machines = [
    { stem: '1_3', name: 'Prensa Hack Squat Pro 45°' },
    { stem: '4', name: 'V-Squat & Sentadilla Guiada' },
    { stem: 'DSC08475', name: 'Banco Predicador Bíceps / Scott Bench' },
    { stem: '1_2', name: 'Banco Declinado con Soporte Olímpico' },
    { stem: 'DSC07716', name: 'Remo Articulado Iso-Lateral' },
    { stem: '1', name: 'Estación Hip Thrust / Glute Drive' }
];

const input = document.getElementById('image-input');
const queue = document.getElementById('image-queue');
const dropZone = document.getElementById('drop-zone');
const count = document.getElementById('selection-count');
const status = document.getElementById('status-message');
const optimizeButton = document.getElementById('optimize-button');
const maxDimension = document.getElementById('max-dimension');
const qualityInput = document.getElementById('image-quality');
const qualityValue = document.getElementById('quality-value');

let selectedImages = [];
let busy = false;

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileStem(filename) {
    return filename.replace(/\.[^.]+$/, '').trim().toLowerCase();
}

function renderQueue() {
    queue.replaceChildren();

    if (selectedImages.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Las imágenes seleccionadas aparecerán aquí para asignarlas.';
        queue.append(empty);
        updateReadiness();
        return;
    }

    selectedImages.forEach((image, index) => {
        const row = document.createElement('div');
        row.className = 'image-row';

        const preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.src = image.previewUrl;
        preview.alt = '';

        const details = document.createElement('div');
        details.className = 'file-details';
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = image.file.name;
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatBytes(image.file.size);
        details.append(fileName, fileSize);

        const select = document.createElement('select');
        select.className = 'machine-select';
        select.setAttribute('aria-label', `Máquina para ${image.file.name}`);
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Asignar máquina';
        select.append(emptyOption);

        machines.forEach((machine) => {
            const option = document.createElement('option');
            option.value = machine.stem;
            option.textContent = machine.name;
            select.append(option);
        });

        select.value = image.machineStem;
        select.addEventListener('change', () => {
            image.machineStem = select.value;
            image.result = null;
            updateRow(index);
            updateReadiness();
        });

        const outputDetails = document.createElement('div');
        outputDetails.className = 'output-details';
        const outputStatus = document.createElement('span');
        outputStatus.className = 'output-status';
        outputStatus.textContent = image.result ? 'Optimizada' : 'Pendiente';
        const outputMeta = document.createElement('span');
        outputMeta.className = 'output-meta';
        outputMeta.textContent = image.result
            ? `${formatBytes(image.result.blob.size)} · ${image.result.width} × ${image.result.height}`
            : 'Salida JPEG';
        outputDetails.append(outputStatus, outputMeta);

        row.append(preview, details, select, outputDetails);
        queue.append(row);
    });

    updateReadiness();
}

function updateRow(index) {
    const image = selectedImages[index];
    const row = queue.children[index];
    if (!image || !row) return;

    const outputStatus = row.querySelector('.output-status');
    const outputMeta = row.querySelector('.output-meta');
    outputStatus.textContent = image.result ? 'Optimizada' : 'Pendiente';
    outputStatus.classList.toggle('is-ready', Boolean(image.result));
    outputMeta.textContent = image.result
        ? `${formatBytes(image.result.blob.size)} · ${image.result.width} × ${image.result.height}`
        : 'Salida JPEG';
}

function updateReadiness(message) {
    const assigned = selectedImages.filter((image) => image.machineStem);
    const uniqueAssignments = new Set(assigned.map((image) => image.machineStem));
    const complete = selectedImages.length === machines.length
        && assigned.length === machines.length
        && uniqueAssignments.size === machines.length;

    count.textContent = `${uniqueAssignments.size} / ${machines.length}`;
    optimizeButton.disabled = !complete || busy;

    if (message) {
        status.textContent = message;
    } else if (selectedImages.length > machines.length) {
        status.textContent = 'Selecciona como máximo seis imágenes.';
    } else if (assigned.length !== uniqueAssignments.size) {
        status.textContent = 'Cada imagen debe corresponder a una máquina distinta.';
    } else if (!complete) {
        status.textContent = 'Asigna una imagen a cada una de las seis máquinas.';
    } else {
        status.textContent = 'Seis máquinas asignadas. Las imágenes están listas para optimizar.';
    }
}

function loadFiles(files) {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (files.length > machines.length) {
        selectedImages = [];
        renderQueue();
        updateReadiness('Selecciona como máximo seis imágenes por paquete.');
        return;
    }

    selectedImages = imageFiles.map((file) => {
        const matchingMachine = machines.find((machine) => machine.stem.toLowerCase() === fileStem(file.name));
        return {
            file,
            machineStem: matchingMachine?.stem ?? '',
            previewUrl: URL.createObjectURL(file),
            result: null
        };
    });

    if (imageFiles.length !== files.length) {
        renderQueue();
        updateReadiness('Uno o más archivos no son imágenes compatibles.');
        return;
    }

    renderQueue();
}

function canvasToJpeg(canvas, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob || blob.type !== 'image/jpeg') {
                reject(new Error('Este navegador no pudo crear imágenes JPEG.'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', quality);
    });
}

async function optimizeImage(file, sideLimit, quality) {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, sideLimit / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
        bitmap.close();
        throw new Error('No se pudo preparar la imagen en este navegador.');
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await canvasToJpeg(canvas, quality);
    return { blob, width, height };
}

async function optimizeAndDownload() {
    if (optimizeButton.disabled || typeof JSZip === 'undefined') {
        updateReadiness('No se pudo iniciar la herramienta ZIP. Revisa la conexión a internet y recarga.');
        return;
    }

    busy = true;
    optimizeButton.disabled = true;
    const sideLimit = Math.max(640, Math.min(2400, Number(maxDimension.value) || 1600));
    const quality = Number(qualityInput.value) / 100;

    try {
        const zip = new JSZip();
        const manifest = [];

        for (const [index, image] of selectedImages.entries()) {
            status.textContent = `Optimizando imagen ${index + 1} de ${machines.length}...`;
            image.result = await optimizeImage(image.file, sideLimit, quality);
            updateRow(index);
            const machine = machines.find((entry) => entry.stem === image.machineStem);
            const path = `assets/images/optimized/${image.machineStem}.jpg`;
            zip.file(path, image.result.blob);
            manifest.push({
                machine: machine.name,
                source: image.file.name,
                output: path,
                width: image.result.width,
                height: image.result.height,
                originalBytes: image.file.size,
                optimizedBytes: image.result.blob.size
            });
        }

        zip.file('assets/images/optimized/manifest.json', JSON.stringify(manifest, null, 2));
        status.textContent = 'Preparando el paquete ZIP...';
        const archive = await zip.generateAsync({ type: 'blob' });
        const downloadUrl = URL.createObjectURL(archive);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'harmony-imagenes-optimizadas.zip';
        link.click();
        URL.revokeObjectURL(downloadUrl);

        const originalTotal = selectedImages.reduce((sum, image) => sum + image.file.size, 0);
        const optimizedTotal = selectedImages.reduce((sum, image) => sum + image.result.blob.size, 0);
        const reduction = originalTotal > 0 ? Math.max(0, Math.round((1 - optimizedTotal / originalTotal) * 100)) : 0;
        status.textContent = `ZIP listo · ${formatBytes(originalTotal)} → ${formatBytes(optimizedTotal)} · ${reduction}% menos peso`;
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'No se pudieron optimizar las imágenes.';
    } finally {
        busy = false;
        updateReadiness(status.textContent);
    }
}

input.addEventListener('change', () => loadFiles(Array.from(input.files ?? [])));
optimizeButton.addEventListener('click', optimizeAndDownload);

qualityInput.addEventListener('input', () => {
    qualityValue.value = qualityInput.value;
    qualityValue.textContent = qualityInput.value;
});

for (const eventName of ['dragenter', 'dragover']) {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add('is-dragging');
    });
}

for (const eventName of ['dragleave', 'drop']) {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove('is-dragging');
    });
}

dropZone.addEventListener('drop', (event) => {
    loadFiles(Array.from(event.dataTransfer?.files ?? []));
});
// Get DOM elements
const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const resetButton = document.getElementById('rst');
const gallery = document.getElementById('gallery');
const resultDiv = document.getElementById('result');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    [...files].forEach(file => {
        if (file.type.startsWith('image/')) {
            uploadFile(file);
        } else {
            resultDiv.textContent = 'Error: Only image files are allowed!';
            resultDiv.style.color = 'red';
        }
    });
}

function uploadFile(file) {
    const url = '/predict';
    const formData = new FormData();
    formData.append('file', file);

    // Show loading state
    resultDiv.textContent = 'Analyzing image...';
    resultDiv.style.color = 'blue';

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        displayResult(result);
        displayImage(file);
    })
    .catch(error => {
        console.error('Error:', error);
        displayResult({ 
            error: 'Error processing the image', 
            details: error.message 
        });
    });
}

function displayResult(result) {
    try {
        if (result.error) {
            resultDiv.textContent = `Error: ${result.error}. Details: ${result.details || 'No details provided'}`;
            resultDiv.style.color = 'red';
        } else if (result.prediction && Array.isArray(result.prediction)) {
            // Get the index of the highest probability
            const maxIndex = result.prediction.indexOf(Math.max(...result.prediction));
            const predictedClass = result.class_names[maxIndex];
            const confidence = result.prediction[maxIndex];
            const confidencePercentage = (confidence * 100).toFixed(2) + '%';
            
            // Create a more detailed result message
            resultDiv.innerHTML = `
                <div style="background-color: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 1.2em; margin-bottom: 10px;">
                        <strong>Predicted Disease:</strong> ${predictedClass}
                    </div>
                    <div style="color: ${confidence > 0.7 ? 'green' : 'orange'};">
                        <strong>Confidence:</strong> ${confidencePercentage}
                    </div>
                </div>
            `;
        } else {
            throw new Error('Unexpected prediction format');
        }
    } catch (error) {
        resultDiv.textContent = `Error processing result: ${error.message}`;
        resultDiv.style.color = 'red';
        console.error('Raw response:', result);
    }
}

function displayImage(file) {
    // Clear the gallery
    gallery.innerHTML = '';
    
    // Create and display the image
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = function() {
        URL.revokeObjectURL(this.src);
    }
    
    // Add image to gallery with fade-in effect
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease-in';
    gallery.appendChild(img);
    
    // Trigger reflow and add opacity
    setTimeout(() => {
        img.style.opacity = '1';
    }, 10);
}

// Handle click on drop area
dropArea.addEventListener('click', () => {
    fileElem.click();
});

// Handle file input change
fileElem.addEventListener('change', function(e) {
    handleFiles(this.files);
});

// Handle reset button click
resetButton.addEventListener('click', () => {
    // Clear result and gallery
    resultDiv.textContent = '';
    gallery.innerHTML = '';
    
    // Reset file input
    fileElem.value = '';
    
    // Remove highlight class if present
    dropArea.classList.remove('highlight');
});

// Add error boundary for unhandled errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    resultDiv.textContent = 'An unexpected error occurred. Please try again.';
    resultDiv.style.color = 'red';
});
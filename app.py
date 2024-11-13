from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
import requests

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Ensure upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        try:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Save the file
            file.save(filepath)

            # Make sure the file exists before trying to open it
            if not os.path.exists(filepath):
                return jsonify({'error': 'File save failed'})

            # Send the file to the API
            try:
                with open(filepath, 'rb') as f:
                    files = {'file': f}
                    response = requests.post('http://localhost:8000/predict', files=files)
            except requests.RequestException as e:
                return jsonify({'error': 'API request failed', 'details': str(e)})
            finally:
                # Clean up: Try to remove the file, but don't raise an error if it fails
                try:
                    if os.path.exists(filepath):
                        os.remove(filepath)
                except Exception as e:
                    print(f"Warning: Could not remove temporary file {filepath}: {e}")

            if response.status_code == 200:
                return jsonify(response.json())
            else:
                return jsonify({'error': 'Error processing the image', 'details': response.text})

        except Exception as e:
            return jsonify({'error': 'Server error', 'details': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
from fastapi import FastAPI, File, UploadFile, HTTPException
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

app = FastAPI()

try:
    MODEL = tf.keras.models.load_model("/Users/shuvo/Downloads/Tea Sickness App/saved model/TeaSicknessModel.h5")
    CLASS_NAMES = ['Anthracnose', 'algal leaf', 'bird eye spot', 'brown_blight', 'gray light', 'healthy', 'red leaf spot', 'white spot']
except FileNotFoundError:
    print("Model file not found. Please check the file path.")
    MODEL = None

@app.get("/ping")
async def ping():
    return {"message": "Testing for first time"}

def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if MODEL is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Please check the server logs.")
    
    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)
    
    predictions = MODEL.predict(img_batch)
    predicted_class_index = np.argmax(predictions[0])
    confidence = float(np.max(predictions[0]))
    
    # Return predictions array along with the class names
    return {
        "prediction": predictions[0].tolist(),
        "class_names": CLASS_NAMES
    }

if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port=8000)
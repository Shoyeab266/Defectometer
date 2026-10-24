# Defectometer

A web-based industrial computer vision application that detects and classifies surface defects on metal components. When an image is uploaded, the system automatically draws bounding boxes around identified defects and classifies them in real-time.

## Features
* **Multi-Class Detection:** Identifies Scratch, Crack, Rust, or Pitting.
* **Custom AI Model:** Powered by a YOLOv8 model trained on a curated dataset of over 4,000 images.
* **Instant Inference:** Processes images rapidly via a cloud-hosted inference API (Roboflow).
* **Visual Overlay:** Highlights the exact boundaries of defects on the uploaded image using the HTML5 Canvas API.

## Tech Stack
* **Computer Vision Model:** YOLOv8 (Trained via Google Colab / T4 GPU)
* **Dataset & API Hosting:** Roboflow 
* **Frontend:** Vanilla JavaScript, HTML5, CSS3
* **Deployment:** Vercel

Live Website Link: https://defectometer.vercel.app/

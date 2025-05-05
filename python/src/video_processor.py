import os
from concurrent.futures import ThreadPoolExecutor
from .motion_detection import process_motion
from .yolo_detection import save_frame_and_detections

def process_video(video_path, output_folder):
    process_motion(video_path, output_folder)

def process_videos_in_folder(input_folder, output_folder):
    videos = [
        f for f in os.listdir(input_folder) 
        if f.endswith(('.mp4', '.avi', '.mov'))
    ]

    # Obtener los nombres de las carpetas ya creadas en el output_folder
    processed_video_names = set(os.listdir(output_folder))

    # Filtrar videos que ya han sido procesados
    videos_to_process = [
        video for video in videos 
        if os.path.splitext(video)[0] not in processed_video_names
    ]

    print(f"🔍 Videos nuevos por procesar: {videos_to_process}")

    with ThreadPoolExecutor() as executor:
        executor.map(lambda video: process_video(
            os.path.join(input_folder, video), output_folder), videos_to_process
        )

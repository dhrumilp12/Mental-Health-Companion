import azure.cognitiveservices.speech as speechsdk
import io
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

def check_ffmpeg():
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        print("FFmpeg version:")
        print(result.stdout)
    except Exception as e:
        print("Failed to run FFmpeg:", str(e))

check_ffmpeg()

def convert_audio_to_wav(input_audio_path, output_audio_path):
    try:
        command = ['ffmpeg', '-i', input_audio_path, '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '16000', output_audio_path]
        result = subprocess.run(command, check=True, text=True, capture_output=True)
        print(f"FFmpeg output: {result.stdout}")
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr}")
        raise Exception("Failed to convert audio") from e


def speech_to_text(audio_file):
    
        # Save original audio to a temporary file
    temp_input_path = 'temp_input.webm'
    temp_output_path = 'temp_output.wav'

    try:
        with open(temp_input_path, 'wb') as f:
            f.write(audio_file.read())

            # Convert to WAV format
        convert_audio_to_wav(temp_input_path, temp_output_path)

         # Load converted audio and process
        with open(temp_output_path, 'rb') as f:
            audio_data = f.read()
        # Convert the audio file received into a stream
        audio_stream = io.BytesIO(audio_data)
        
        print(f"Size of audio file: {audio_stream.getbuffer().nbytes} bytes")  # Debugging the size of the file
        audio_stream.seek(0)
        print(f"Size of audio file: {audio_stream.getbuffer().nbytes} bytes")
        # Set up the speech config with your subscription details
        speech_key = os.environ.get("SPEECH_AI_KEY")
        service_region = os.environ.get("SERVICE_REGION")
        speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000")  # Timeout in milliseconds
        # Create a push stream that can be used with the speech recognizer
        push_stream = speechsdk.audio.PushAudioInputStream()
        audio_config = speechsdk.audio.AudioConfig(stream=push_stream)
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
           

        # Read the buffer and push into the push stream
        data = audio_stream.read(1024)
        print(f"Writing data to stream: {len(data)} bytes")
        while data:
            push_stream.write(data)
            data = audio_stream.read(1024)
        push_stream.close()


        print("Speak into your microphone.")
        result = speech_recognizer.recognize_once()

        # Check the result
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            print("Recognized: {}".format(result.text))
            return result.text
        elif result.reason == speechsdk.ResultReason.NoMatch:
            print("No speech could be recognized")
            return "No speech could be recognized"
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            print("Speech Recognition canceled: {}".format(cancellation_details.reason))
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                print("Error details: {}".format(cancellation_details.error_details))
            return "Speech Recognition canceled"

        else:
            print("Speech Recognition canceled: {}".format(result.cancellation_details.reason))
            if result.cancellation_details.reason == speechsdk.CancellationReason.Error:
                print("Error details: {}".format(result.cancellation_details.error_details))
            return "Speech Recognition canceled"


    except Exception as e:
        print(f"Error during speech recognition: {str(e)}")
        return None
    finally:
        # Clean up temporary files
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)
        if os.path.exists(temp_output_path):
            os.remove(temp_output_path)
        print("Temporary files removed")

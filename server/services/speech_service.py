import azure.cognitiveservices.speech as speechsdk
import io

def speech_to_text(audio_file):
    try:
        # Convert the audio file received into a stream
        audio_stream = io.BytesIO()
        audio_file.save(audio_stream)
        audio_stream.seek(0)

        # Set up the speech config with your subscription details
        speech_key = "c833c8ef4bb0441b98971cc2d850f462"
        service_region = "eastus"
        speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "15000")  # Timeout in milliseconds
        # Create a push stream that can be used with the speech recognizer
        push_stream = speechsdk.audio.PushAudioInputStream()
        audio_config = speechsdk.audio.AudioConfig(stream=push_stream)
        

        # Read the buffer and push into the push stream
        data = audio_stream.read(1024)
        print(f"Writing data to stream: {len(data)} bytes")
        while data:
            push_stream.write(data)
            data = audio_stream.read(1024)
        push_stream.close()

        # Create a recognizer with the given settings
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

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
                print("Error details: {}".for_sessiondetails.error_details)
            return "Speech Recognition canceled"
        else:
            print("Speech Recognition canceled: {}".format(result.cancellation_details.reason))
            if result.cancellation_details.reason == speechsdk.CancellationReason.Error:
                print("Error details: {}".format(result.cancellation_details.error_details))
            return "Speech Recognition canceled"


    except Exception as e:
        print(f"Error during speech recognition: {str(e)}")
        return None

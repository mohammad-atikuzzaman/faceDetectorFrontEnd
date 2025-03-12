import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import toast, { Toaster } from "react-hot-toast";
import ModelsLoading from "./components/ModelsLoading";
import Header from "./components/Header";
import CameraSelector from "./components/CameraSelector";
import LoadingSpinner from "./components/LoadingSpinner";
import UserNameForm from "./components/UserNameForm";
import DetectingButton from "./components/DetectingButton";
import StopDetectingButton from "./components/StopDetectingButton";
import AddedUsers from "./components/AddedUsers";

interface FacePerson {
  name: string;
  descriptor: Float32Array;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
const DETECTION_INTERVAL = 1500;

function App() {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faces, setFaces] = useState<FacePerson[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState("");
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const detectionInterval = useRef<number>();

  // Memoized face descriptors for better performance
  const labeledDescriptors = useMemo(
    () =>
      faces.map(
        (face) =>
          new faceapi.LabeledFaceDescriptors(face.name, [face.descriptor])
      ),
    [faces]
  );

  // Load face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        toast.error("Failed to load AI models");
        console.error("Model loading error:", error);
      }
    };
    loadModels();
  }, []);

  // Get video devices
  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || "Camera" }));
        setDevices(videoDevices);
        setCurrentDevice(videoDevices[0]?.deviceId || "");
      } catch (error) {
        toast.error("Camera access denied");
        console.error("Camera error:", error);
      }
    };
    getVideoDevices();
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    },
    []
  );

  const captureAndAddFace = useCallback(async () => {
    if (!webcamRef.current?.video || !currentName.trim()) return;

    try {
      const video = webcamRef.current.video;
      if (video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        toast.error("Camera not ready");
        return;
      }

      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaces((prev) => [
          ...prev,
          {
            name: currentName,
            descriptor: detection.descriptor,
          },
        ]);
        setCurrentName("");
        toast.success(`${currentName} added successfully!`);
      } else {
        toast.error("No face detected");
      }
    } catch (error) {
      toast.error("Error capturing face");
      console.error("Capture error:", error);
    }
  }, [currentName]);

  const startDetection = useCallback(async () => {
    if (!webcamRef.current?.video || faces.length === 0) return;

    setIsDetecting(true);
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);

    const detectFrame = async () => {
      try {
        const detections = await faceapi
          .detectAllFaces(webcamRef.current!.video!)
          .withFaceLandmarks()
          .withFaceDescriptors();

        const results = detections.map((d) =>
          faceMatcher.findBestMatch(d.descriptor)
        );

        const matchedNames = results
          .filter((r) => r.label !== "unknown")
          .map((r) => r.label);

        if (matchedNames.length > 0) {
          toast.success(`Recognized: ${matchedNames.join(", ")}`);
        } else if (detections.length > 0) {
          toast.error("Unknown person detected!");
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    };

    detectionInterval.current = window.setInterval(
      detectFrame,
      DETECTION_INTERVAL
    );
  }, [labeledDescriptors, faces.length]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = undefined;
    }
    toast.dismiss();
  }, []);

  if (!isModelLoaded) {
    return <ModelsLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <Header />

          <CameraSelector
            currentDevice={currentDevice}
            setCurrentDevice={setCurrentDevice}
            devices={devices}
          />

          <div className="relative mb-8 rounded-xl overflow-hidden border-4 border-gray-100">
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{
                deviceId: currentDevice,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              className="w-full aspect-video"
              onUserMedia={() => setIsWebcamReady(true)}
              onUserMediaError={() => toast.error("Camera access denied")}
            />
            {!isWebcamReady && <LoadingSpinner />}
          </div>

          {!isDetecting ? (
            <div className="space-y-6">
              <UserNameForm
                currentName={currentName}
                setCurrentName={setCurrentName}
                captureAndAddFace={captureAndAddFace}
                isWebcamReady={isWebcamReady}
              />

              <DetectingButton faces={faces} startDetection={startDetection} />
            </div>
          ) : (
            <StopDetectingButton stopDetection={stopDetection} />
          )}

          {faces.length > 0 && <AddedUsers faces={faces} />}
        </div>
      </div>
    </div>
  );
}

export default App;

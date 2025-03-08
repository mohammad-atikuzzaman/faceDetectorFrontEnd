import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { Camera, Plus, Scan, Video, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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
    () => faces.map(face => 
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
          .filter(d => d.kind === "videoinput")
          .map(d => ({ deviceId: d.deviceId, label: d.label || "Camera" }));
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
  useEffect(() => () => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);
  }, []);

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
        setFaces(prev => [...prev, { 
          name: currentName, 
          descriptor: detection.descriptor 
        }]);
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

        const results = detections.map(d => 
          faceMatcher.findBestMatch(d.descriptor)
        );

        const matchedNames = results
          .filter(r => r.label !== "unknown")
          .map(r => r.label);

        if (matchedNames.length > 0) {
          toast.success(`Recognized: ${matchedNames.join(", ")}`);
        } else if (detections.length > 0) {
          toast.error("Unknown person detected!");
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    };

    detectionInterval.current = window.setInterval(detectFrame, DETECTION_INTERVAL);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-xl font-semibold text-blue-600">
          Loading AI models...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <header className="flex items-center gap-3 mb-8">
            <Camera className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FaceGuard AI
            </h1>
          </header>

          <div className="mb-6 space-y-4">
            <label className="block text-sm font-medium text-gray-600">
              Camera Selection
            </label>
            <select
              value={currentDevice}
              onChange={(e) => setCurrentDevice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative mb-8 rounded-xl overflow-hidden border-4 border-gray-100">
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{ 
                deviceId: currentDevice,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }}
              className="w-full aspect-video"
              onUserMedia={() => setIsWebcamReady(true)}
              onUserMediaError={() => toast.error("Camera access denied")}
            />
            {!isWebcamReady && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {!isDetecting ? (
            <div className="space-y-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  placeholder="Enter person's name"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => e.key === "Enter" && captureAndAddFace()}
                />
                <button
                  onClick={captureAndAddFace}
                  disabled={!currentName || !isWebcamReady}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Face
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {faces.length} registered {faces.length === 1 ? "face" : "faces"}
                </div>
                <button
                  onClick={startDetection}
                  disabled={faces.length === 0}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Scan className="w-5 h-5" />
                  Start Detection
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="font-medium text-blue-600">
                  Detection in progress...
                </div>
                <button
                  onClick={stopDetection}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Stop Detection
                </button>
              </div>
            </div>
          )}

          {faces.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Registered Persons
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {faces.map((face, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {face.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
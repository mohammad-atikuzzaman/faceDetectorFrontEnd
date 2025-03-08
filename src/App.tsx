import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Camera, Plus, Scan } from 'lucide-react';

interface FacePerson {
  name: string;
  descriptor: Float32Array;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

function App() {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faces, setFaces] = useState<FacePerson[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [message, setMessage] = useState('');
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<string>('');
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  // for loading face api model
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
        setMessage('Error loading face detection models. Please refresh the page.');
      }
    };
    loadModels();
  }, []);


// for getting  camera access
  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${devices.indexOf(device) + 1}`
          }));
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setCurrentDevice(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error accessing cameras:', error);
        setMessage('Error accessing cameras. Please check camera permissions.');
      }
    };
    getVideoDevices();
  }, []);

  // Reset webcam ready state when device changes
  useEffect(() => {
    setIsWebcamReady(false);
  }, [currentDevice]);

  const captureAndAddFace = async () => {
    if (!webcamRef.current || !currentName.trim() || !isWebcamReady) return;

    try {
      const video = webcamRef.current.video;
      if (!video) return;

      // Ensure video is playing and has dimensions
      if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
        setMessage('Please wait for the camera to initialize fully');
        return;
      }

      // Use video element directly instead of screenshot
      const detection = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaces(prev => [...prev, {
          name: currentName,
          descriptor: detection.descriptor
        }]);
        setCurrentName('');
        setMessage(`${currentName} added successfully!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('No face detected. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      setMessage('Error capturing face. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const startDetecting = async () => {
    if (!webcamRef.current || faces.length === 0 || !isWebcamReady) return;
    setIsDetecting(true);

    const detectFaces = async () => {
      if (!webcamRef.current?.video) return;
      
      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;

      try {
        const detections = await faceapi.detectAllFaces(video)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          const labeledDescriptors = faces.map(
            face => new faceapi.LabeledFaceDescriptors(face.name, [face.descriptor])
          );
          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);

          const results = detections.map(detection => 
            faceMatcher.findBestMatch(detection.descriptor)
          );

          const detectedNames = results
            .filter(result => result.label !== 'unknown')
            .map(result => result.label);

          if (detectedNames.length > 0) {
            setMessage(`Detected: ${detectedNames.join(', ')}`);
          } else {
            setMessage('No registered faces detected');
          }
        } else {
          setMessage('No faces detected');
        }
      } catch (error) {
        console.error('Error during face detection:', error);
        setMessage('Error during face detection');
      }
    };

    const interval = setInterval(detectFaces, 1000);
    return () => clearInterval(interval);
  };

  if (!isModelLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading face detection models...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Camera className="w-8 h-8" />
            Face Detection App
          </h1>

          {devices.length > 0 && (
            <div className="mb-4">
              <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Camera
              </label>
              <select
                id="camera-select"
                value={currentDevice}
                onChange={(e) => setCurrentDevice(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <Webcam
              ref={webcamRef}
              className="w-full rounded-lg"
              screenshotFormat="image/jpeg"
              videoConstraints={{
                deviceId: currentDevice,
                width: 640,
                height: 480
              }}
              onUserMedia={() => setIsWebcamReady(true)}
              onUserMediaError={(error) => {
                console.error('Webcam error:', error);
                setMessage('Error accessing camera. Please check permissions and try again.');
                setIsWebcamReady(false);
              }}
            />
          </div>

          {!isDetecting ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  placeholder="Enter person's name"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={captureAndAddFace}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  disabled={!currentName.trim() || !isWebcamReady}
                >
                  <Plus className="w-5 h-5" />
                  Add Face
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {faces.length} faces registered
                </div>
                <button
                  onClick={startDetecting}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  disabled={faces.length === 0 || !isWebcamReady}
                >
                  <Scan className="w-5 h-5" />
                  Start Detection
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsDetecting(false)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Stop Detection
            </button>
          )}

          {message && (
            <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
              {message}
            </div>
          )}

          {faces.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Registered Faces:</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {faces.map((face, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded-lg">
                    {face.name}
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
import { Config } from "@remotion/cli/config";

// Use EGL for WebGL rendering in headless Chromium (required for Mapbox GL)
Config.setChromiumOpenGlRenderer("egl");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(1); // Render frames sequentially to avoid map tile contention

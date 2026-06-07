import "bootstrap/dist/css/bootstrap.min.css";
import "@fontsource/geist-sans";
import "@fontsource/inter";
import "@fontsource/space-grotesk";
import "./global.css";
import App from "./App";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);

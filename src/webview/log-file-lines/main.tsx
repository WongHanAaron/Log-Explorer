import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StubPanel } from "../shared/components/StubPanel";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <StubPanel
            title="Log File Lines"
            message="Log line parsing configuration will appear here."
        />
    </StrictMode>
);

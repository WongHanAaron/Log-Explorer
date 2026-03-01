import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StubPanel } from "../shared/components/StubPanel";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <StubPanel
            title="Log File Sources"
            message="Log file source configuration will appear here."
        />
    </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StubPanel } from "../shared/components/StubPanel";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <StubPanel
            title="Log Details"
            message="Log entry details will appear here."
        />
    </StrictMode>
);

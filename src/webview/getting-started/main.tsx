import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StubPanel } from "../shared/components/StubPanel";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <StubPanel
            title="Getting Started with Log Explorer"
            message="The Getting Started wizard will guide you through setting up and using Log Explorer."
        />
    </StrictMode>
);

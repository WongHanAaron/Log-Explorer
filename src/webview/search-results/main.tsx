import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StubPanel } from "../shared/components/StubPanel";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <StubPanel
            title="Search Results"
            message="Log search results will appear here."
        />
    </StrictMode>
);

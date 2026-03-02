interface StubPanelProps {
    title: string;
    message: string;
}

export function StubPanel({ title, message }: StubPanelProps) {
    return (
        <div className="p-4">
            <h2 className="text-sm font-semibold mb-1.5">{title}</h2>
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}

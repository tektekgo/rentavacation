import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, ExternalLink } from "lucide-react";

const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string;

export function VoiceConfigInfo() {
  const maskedId = VAPI_ASSISTANT_ID
    ? `${VAPI_ASSISTANT_ID.slice(0, 8)}...${VAPI_ASSISTANT_ID.slice(-4)}`
    : "Not configured";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Voice Configuration
        </CardTitle>
        <CardDescription>
          Current voice search infrastructure settings. Model changes require the VAPI dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">LLM Model</p>
            <Badge variant="secondary">GPT-4o-mini</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Speech-to-Text</p>
            <Badge variant="secondary">Deepgram</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Assistant ID</p>
            <code className="text-xs bg-muted px-2 py-1 rounded">{maskedId}</code>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Max Duration</p>
            <Badge variant="secondary">120s</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Model and voice provider changes must be made in the VAPI dashboard (SDK limitation).
        </p>
      </CardContent>
    </Card>
  );
}

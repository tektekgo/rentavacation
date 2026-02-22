import { VoiceConfigInfo } from "./voice/VoiceConfigInfo";
import { VoiceTierQuotaManager } from "./voice/VoiceTierQuotaManager";
import { VoiceUserOverrideManager } from "./voice/VoiceUserOverrideManager";
import { VoiceUsageDashboard } from "./voice/VoiceUsageDashboard";
import { VoiceObservability } from "./voice/VoiceObservability";

export function VoiceControls() {
  return (
    <div className="space-y-6">
      <VoiceConfigInfo />
      <VoiceTierQuotaManager />
      <VoiceUserOverrideManager />
      <VoiceUsageDashboard />
      <VoiceObservability />
    </div>
  );
}

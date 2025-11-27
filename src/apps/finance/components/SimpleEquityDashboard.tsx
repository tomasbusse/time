import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { SimpleEquityAccounts } from "./SimpleEquityAccounts";
import { SimpleEquityValuations } from "./SimpleEquityValuations";
import EquityGoal from "./EquityGoal";
import EquityMonitoring from "./EquityMonitoring";
import { Button } from "@/components/ui/Button";

export default function SimpleEquityDashboard() {
  const [activeSection, setActiveSection] = useState<
    "accounts" | "valuations" | "goal" | "monitoring"
  >("accounts");

  // fix: move goalData hook declaration here to global scope
  const { workspaceId } = useWorkspace();
  const goalData = useQuery(api.simpleFinance.getEquityGoalProgress, workspaceId ? { workspaceId } : "skip");

  const SectionButton = ({
    target,
    label,
  }: {
    target: typeof activeSection;
    label: string;
  }) => (
    <Button
      variant={activeSection === target ? "default" : "outline"}
      onClick={() => setActiveSection(target)}
      className="capitalize"
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center border-b border-light-gray pb-3 mb-4">
        <SectionButton target="accounts" label="Accounts" />
        <SectionButton target="valuations" label="Valuations" />
        <SectionButton target="goal" label="Goal" />
        <SectionButton target="monitoring" label="Monitoring" />
      </div>

      {activeSection === "accounts" && <SimpleEquityAccounts />}
      {activeSection === "valuations" && <SimpleEquityValuations />}
      {activeSection === "goal" && (
        <div className="max-w-3xl mx-auto">
          <EquityGoal
            currentEquity={goalData?.currentEquity || 0}
            targetEquity={goalData?.targetEquity || 0}
            targetDate={goalData?.targetDate || undefined}
            canEdit={true}
            onEdit={() => {}}
          />
        </div>
      )}
      {activeSection === "monitoring" && (
        <div className="max-w-6xl mx-auto">
          <EquityMonitoring />
        </div>
      )}
    </div>
  );
}
import { ProtocolCard } from "./protocol-card";

const MOCK_PROTOCOLS = [
  { id: "1", name: "Morning Sunlight Exposure", category: "Circadian Rhythm", description: "View sunlight by going outside within 30-60 minutes of waking. Do that again in the late afternoon." },
  { id: "2", name: "Cold Exposure", category: "Metabolism & Resilience", description: "Use cold exposure (ice bath, cold shower) to enhance metabolism and mental resilience." },
  { id: "3", name: "Non-Sleep Deep Rest (NSDR)", category: "Focus & Recovery", description: "A 10-30 minute protocol to deliberately disengage and enhance neuroplasticity and learning." },
];

export const ProtocolList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {MOCK_PROTOCOLS.map((protocol) => (
        <ProtocolCard key={protocol.id} {...protocol} />
      ))}
    </div>
  );
};
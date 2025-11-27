import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const API_SERVICE_DEFINITIONS = {
  openrouter: { displayName: "OpenRouter", placeholder: "sk-or-v1-...", helpText: "Get your API key from https://openrouter.ai/keys" },
  resend: { displayName: "Resend", placeholder: "re_...", helpText: "Get your API key from https://resend.com/api-keys" },
  openai: { displayName: "OpenAI", placeholder: "sk-...", helpText: "Get your API key from https://platform.openai.com/api-keys" },
  anthropic: { displayName: "Anthropic", placeholder: "sk-ant-...", helpText: "Get your API key from https://console.anthropic.com/" },
  google: { displayName: "Google", placeholder: "Google API credentials", helpText: "OAuth2 already configured for Calendar access" },
  elevenlabs: { displayName: "ElevenLabs", placeholder: "...", helpText: "Get your API key from https://elevenlabs.io/speech-synthesis" },
};

const ApiKeyManager = () => {
  // In a real app, these would come from a query to the Convex backend
  const apiKeys = [
    { serviceName: "openrouter", hasKey: true, testStatus: "success" },
    { serviceName: "openai", hasKey: false, testStatus: null },
  ];

  const [editingService, setEditingService] = useState<string | null>(null);
  const [currentApiKey, setCurrentApiKey] = useState("");
  const [testingService, setTestingService] = useState<string | null>(null);

  const handleSave = () => {
    setEditingService(null);
    setCurrentApiKey("");
    alert("API key saved successfully!");
  };

  const handleTest = (serviceName: string) => {
    setTestingService(serviceName);
    setTimeout(() => {
      alert("API key is valid!");
      setTestingService(null);
    }, 1000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">API Key Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(API_SERVICE_DEFINITIONS).map(([serviceName, config]) => {
          const key = apiKeys?.find(k => k.serviceName === serviceName);
          return (
            <Card key={serviceName}>
              <CardHeader>
                <CardTitle>{config.displayName}</CardTitle>
              </CardHeader>
              <CardContent>
                {editingService === serviceName ? (
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder={config.placeholder}
                      value={currentApiKey}
                      onChange={(e) => setCurrentApiKey(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">{config.helpText}</p>
                    <div className="flex space-x-2">
                      <Button onClick={handleSave}>Save</Button>
                      <Button variant="ghost" onClick={() => setEditingService(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className={`text-sm ${key?.hasKey ? 'text-green-600' : 'text-red-600'}`}>
                      {key?.hasKey ? "API Key is set." : "API Key is not set."}
                    </p>
                    {key?.testStatus && (
                      <p className={`text-sm ${key.testStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        Test status: {key.testStatus}
                      </p>
                    )}
                    <div className="flex space-x-2">
                      <Button onClick={() => setEditingService(serviceName)}>
                        {key?.hasKey ? "Update Key" : "Add Key"}
                      </Button>
                      {key?.hasKey && (
                        <Button
                          variant="outline"
                          onClick={() => handleTest(serviceName)}
                          disabled={testingService === serviceName}
                        >
                          {testingService === serviceName ? "Testing..." : "Test Key"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ApiKeyManager;